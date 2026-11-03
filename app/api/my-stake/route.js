export const runtime='nodejs';
export const dynamic='force-dynamic';
import { NextResponse } from 'next/server';
import { Redis } from '@upstash/redis';

const redis = Redis.fromEnv();
const P='rp:';

export async function POST(req){
  try{
    const body = await req.json().catch(()=> ({}));
    const { userId, phone } = body;
    const uid = userId || phone;
    if(!uid) return NextResponse.json({success:true, stakes:[]});
    
    const raw = await redis.lrange(`${P}stakes:${uid}`,0,200);
    const stakes = raw.map(s=>{
      try{return typeof s==='string'? JSON.parse(s):s}
      catch{return null}
    }).filter(Boolean);
    
    return NextResponse.json({success:true, stakes});
  }catch(e){
    console.error("my-stake fail", e);
    return NextResponse.json({success:true, stakes:[]});
  }
}