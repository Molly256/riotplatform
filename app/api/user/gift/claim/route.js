import { createClient } from "redis"
const client = createClient({ url: process.env.REDIS_URL })
await client.connect().catch(()=>{})
const P = "rp:"

export async function POST(req){
  const { code, userId, preview } = await req.json()
  const CODE = code.trim().toUpperCase()
  const giftKey = `${P}gift:code:${CODE}`
  const gift = await client.hGetAll(giftKey)

  if(!gift.code) return Response.json({valid:false, message:"Gift code invalid"})

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
  const claimed = await client.eval(lua, { keys: [giftKey], arguments: [userId, String(Date.now())] })

  if(claimed === 0){
    return Response.json({valid:false, message:"Gift code invalid - already grabbed by someone else"})
  }

  // Add to balance + TX
  const userKey = `${P}user:${userId}`
  const raw = await client.get(userKey)
  const user = typeof raw === 'string' ? JSON.parse(raw) : raw
  const amount = Number(gift.amount)

  user.totalBalance = Number(user.totalBalance||0) + amount
  user.balance = Number(user.balance||0) + amount
  user.availableBalance = Number(user.availableBalance||0) + amount
  await client.set(userKey, JSON.stringify(user))
  try{ await client.hSet(`riot:user:${userId}`, { balance: user.balance, totalBalance: user.totalBalance, availableBalance: user.availableBalance }) }catch{}

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
  await client.lPush(`${P}tx:${userId}`, JSON.stringify(tx))

  return Response.json({success:true, amount})
}