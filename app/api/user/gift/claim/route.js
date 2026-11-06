import { Redis } from "@upstash/redis"

const redis = Redis.fromEnv()
const P = "rp:"

export async function POST(req){
  const { code, userId, preview } = await req.json()
  if(!code || !userId) return Response.json({valid:false, message:"Missing code or user"}, {status:400})

  const CODE = code.trim().toUpperCase()
  const giftKey = `${P}gift:code:${CODE}`
  const gift = await redis.hgetall(giftKey)

  if(!gift || !gift.code) return Response.json({valid:false, message:"Gift code invalid"})

  // For small box that shows worth
  if(preview){
    if(gift.status === "claimed") return Response.json({valid:false, message:"Already claimed"})
    return Response.json({valid:true, amount: Number(gift.amount)})
  }

  // ATOMIC CLAIM - Lua to prevent double claim
  const lua = `
    local status = redis.call('HGET', KEYS[1], 'status')
    if status == 'claimed' then return 0 end
    redis.call('HSET', KEYS[1], 'status', 'claimed', 'claimedBy', ARGV[1], 'claimedAt', ARGV[2])
    return 1
  `
  const claimed = await redis.eval(lua, [giftKey], [String(userId), String(Date.now())])

  if(claimed === 0){
    return Response.json({valid:false, message:"Gift code invalid - already grabbed by someone else"})
  }

  const amount = Number(gift.amount)

  // === EXACT SAME AS adminDeposit IN /api/admin ===
  let user = await redis.get(`${P}user:${userId}`)
  if(typeof user === 'string'){ try{ user = JSON.parse(user) }catch{} }
  if(!user) return Response.json({valid:false, message:"User not found"}, {status:404})

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

  return Response.json({success:true, amount, user, totalBalance: user.totalBalance})
}