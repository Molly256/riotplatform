import { Redis } from "@upstash/redis"

const redis = Redis.fromEnv()
const P = "rp:"

export async function POST(req){
  const { code, userId, preview } = await req.json()
  if(!code || !userId) return Response.json({valid:false, success:false, message:"Missing code or user"}, {status:400})

  const CODE = code.trim().toUpperCase()
  const giftKey = `${P}gift:code:${CODE}`
  const gift = await redis.hgetall(giftKey)

  if(!gift || !gift.code) return Response.json({valid:false, success:false, message:"Gift code invalid"})

  // FIXED: Preview - NO amount, check count vs max + already claimed
  if(preview){
    // NEW: Check if THIS user already claimed - show Oops popup
    const already = await redis.sismember(`${giftKey}:claimedUsers`, String(userId))
    if(already === 1) return Response.json({valid:false, success:false, type:"already_claimed", message:"Oops you already claimed the gift"})

    const max = Number(gift.maxClaims || 1)
    const count = Number(gift.claimedCount || 0)
    if(gift.status === "claimed" && max === 1 && count >= 1) return Response.json({valid:false, success:false, type:"grabbed", message:"Gift already grabbed by someone be fast next time 😞"})
    if(count >= max) return Response.json({valid:false, success:false, type:"grabbed", message:"Gift already grabbed by someone be fast next time 😞"})
    return Response.json({valid:true, success:true})
  }

  // ATOMIC CLAIM FOR N USERS - Lua to prevent double claim + over-claim
  const lua = `
    local key = KEYS[1]
    local userId = ARGV[1]
    local now = ARGV[2]
    local maxClaims = tonumber(redis.call('HGET', key, 'maxClaims') or '1')
    local claimedCount = tonumber(redis.call('HGET', key, 'claimedCount') or '0')

    -- Same user already claimed this code?
    if redis.call('SISMEMBER', key..':claimedUsers', userId) == 1 then return -1 end

    -- Limit reached?
    if claimedCount >= maxClaims then return 0 end

    claimedCount = claimedCount + 1
    redis.call('HSET', key, 'claimedCount', claimedCount)
    redis.call('SADD', key..':claimedUsers', userId)
    redis.call('HSET', key, 'claimedBy', userId, 'claimedAt', now)

    if claimedCount >= maxClaims then
      redis.call('HSET', key, 'status', 'claimed')
    end

    return claimedCount
  `
  const claimed = await redis.eval(lua, [giftKey], [String(userId), String(Date.now())])

  if(claimed === 0){
    // Limit reached - 6th user for 5-user code
    return Response.json({valid:false, success:false, type:"grabbed", message:"Gift already grabbed by someone be fast next time 😞"})
  }
  if(claimed === -1){
    // CHANGED: Was "You already claimed this gift" -> Now "Oops you already claimed the gift"
    return Response.json({valid:false, success:false, type:"already_claimed", message:"Oops you already claimed the gift"})
  }

  const amount = Number(gift.amount)

  // === EXACT SAME AS adminDeposit IN /api/admin ===
  let user = await redis.get(`${P}user:${userId}`)
  if(typeof user === 'string'){ try{ user = JSON.parse(user) }catch{} }
  if(!user) return Response.json({valid:false, success:false, message:"User not found"}, {status:404})

  user.totalBalance = Number(user.totalBalance||0) + amount
  user.balance = user.totalBalance
  user.availableBalance = user.totalBalance
  await redis.set(`${P}user:${user.userId}`, user)
  // === END adminDeposit logic ===

  const tx = {
    id: `gift_${CODE}_${Date.now()}`,
    type: "gift",
    amount,
    display: `Gift Code ${CODE}`,
    status: "success",
    header: "gift_code",
    timestamp: Date.now(),
    displayTime: new Date().toLocaleString('en-GB', { timeZone: 'Africa/Kampala' })
  }
  await redis.lpush(`${P}tx:${userId}`, JSON.stringify(tx))

  return Response.json({success:true, type:"success", amount, user, totalBalance: user.totalBalance})
}