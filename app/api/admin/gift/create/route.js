import { Redis } from "@upstash/redis"

const redis = Redis.fromEnv()
const P = "rp:"

export async function POST(req){
  const { code, amount, numberOfUsers, maxClaims } = await req.json()
  if(!code || !amount) return Response.json({error:"code and amount required"}, {status:400})

  const CODE = code.trim().toUpperCase()
  const key = `${P}gift:code:${CODE}`

  const exists = await redis.exists(key)
  if(exists) return Response.json({error:"Code already exists"}, {status:400})

  // Number of people who can claim this code - default 1 if admin leaves empty
  const limit = Number(numberOfUsers || maxClaims || 1)
  if(limit < 1) return Response.json({error:"numberOfUsers must be >=1"}, {status:400})

  await redis.hset(key, {
    code: CODE,
    amount: String(amount),
    maxClaims: String(limit),
    claimedCount: "0",
    status: "active",
    createdAt: String(Date.now()),
    claimedBy: "",
    claimedAt: ""
  })
  await redis.lpush(`${P}gift:codes:list`, JSON.stringify({code: CODE, amount, maxClaims: limit, claimedCount: 0, status: "active", createdAt: String(Date.now())}))

  return Response.json({success:true, code:CODE, amount, numberOfUsers: limit, maxClaims: limit})
}