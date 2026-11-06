import { createClient } from "redis"
const client = createClient({ url: process.env.REDIS_URL })
await client.connect().catch(()=>{})
const P = "rp:"

export async function POST(req){
  const { code, amount } = await req.json()
  if(!code || !amount) return Response.json({error:"code and amount required"}, {status:400})

  const CODE = code.trim().toUpperCase()
  const key = `${P}gift:code:${CODE}`

  const exists = await client.exists(key)
  if(exists) return Response.json({error:"Code already exists"}, {status:400})

  await client.hSet(key, {
    code: CODE,
    amount: String(amount),
    status: "active",
    createdAt: String(Date.now()),
    claimedBy: "",
    claimedAt: ""
  })
  await client.lPush(`${P}gift:codes:list`, JSON.stringify({code: CODE, amount}))

  return Response.json({success:true, code:CODE, amount})
}