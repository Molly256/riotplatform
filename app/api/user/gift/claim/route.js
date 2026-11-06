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
  // Upstash syntax: eval(script, keys[], args[])
  const claimed = await redis.eval(lua, [giftKey], [String(userId), String(Date.now())])

  if(claimed === 0){
    return Response.json({valid:false, message:"Gift code invalid - already grabbed by someone else"})
  }

  // Add to balance + TX
  const userKey = `${P}user:${userId}`
  const raw = await redis.get(userKey)
  const user = typeof raw === 'string' ? JSON.parse(raw) : raw
  if(!user) return Response.json({valid:false, message:"User not found"}, {status:404})

  const amount = Number(gift.amount)

  user.totalBalance = Number(user.totalBalance||0) + amount
  user.balance = Number(user.balance||0) + amount
  user.availableBalance = Number(user.availableBalance||0) + amount
  await redis.set(userKey, JSON.stringify(user))
  try{ await redis.hset(`riot:user:${userId}`, { balance: user.balance, totalBalance: user.totalBalance, availableBalance: user.availableBalance }) }catch{}

  const tx = {
    id: `gift_${CODE}_${Date.now()}`,
    type: "gift",
    amount,
    display: `Gift Code ${CODE}`,
    status: "success",
    header: "gift_code",
    timestamp: Date.now(),
    displayTime: new Date().toLocaleString()
  }
  await redis.lpush(`${P}tx:${userId}`, JSON.stringify(tx))

  return Response.json({success:true, amount})
}