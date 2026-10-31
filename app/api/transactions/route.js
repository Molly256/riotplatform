export const runtime='nodejs';
export const dynamic='force-dynamic';
import { NextResponse } from 'next/server';
import { Redis } from '@upstash/redis';
const redis=Redis.fromEnv();
const P='rp:';
export async function POST(req){
  const {userId}=await req.json();
  const raw=await redis.lrange(`${P}tx:${userId}`,0,-1);
  const txs=raw.map(r=>{try{return typeof r==='string'?JSON.parse(r):r}catch{return null}}).filter(Boolean).reverse();
  return NextResponse.json({success:true,txs});
}