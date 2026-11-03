export const runtime='nodejs';
export const dynamic='force-dynamic';
import { NextResponse } from 'next/server';
import { Redis } from '@upstash/redis';
const redis = Redis.fromEnv();
const P='rp:';
export async function POST(req){
  const { userId } = await req.json();
  if(!userId) return NextResponse.json({success:false, stakes:[]});
  const raw = await redis.lrange(`${P}stakes:${userId}`,0,200);
  const stakes = raw.map(s=>{try{return typeof s==='string'? JSON.parse(s):s}catch{return null}}).filter(Boolean);
  return NextResponse.json({success:true, stakes});
}