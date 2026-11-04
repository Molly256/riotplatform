export const runtime='nodejs';
export const dynamic='force-dynamic';
import { NextResponse } from 'next/server';
import { Redis } from '@upstash/redis';

const redis = Redis.fromEnv();
const P='rp:';

const getUgDate = () => new Date().toLocaleDateString('en-CA', { timeZone: 'Africa/Kampala' });

export async function POST(req){
  try{
    const body = await req.json().catch(()=> ({}));
    const { userId, phone } = body;
    const uid = userId || phone;
    if(!uid) return NextResponse.json({success:true, stakes:[]});
    
    const raw = await redis.lrange(`${P}stakes:${uid}`,0,500);
    const stakes = raw.map(s=>{
      try{
        const obj = typeof s==='string'? JSON.parse(s):s;
        // FIX: ensure ugStakedDate exists for old stakes
        if(!obj.ugStakedDate){
          obj.ugStakedDate = obj.ugDate || getUgDate();
        }
        if(!obj.powerLabel) obj.powerLabel = obj.power;
        return obj;
      }
      catch{return null}
    }).filter(Boolean)
    .sort((a,b) => new Date(b.stakedAt||0) - new Date(a.stakedAt||0));
    
    return NextResponse.json({success:true, stakes});
  }catch(e){
    console.error("my-stake fail", e);
    return NextResponse.json({success:true, stakes:[]});
  }
}