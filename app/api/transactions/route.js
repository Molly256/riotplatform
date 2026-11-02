export const runtime='nodejs';
export const dynamic='force-dynamic';
import { NextResponse } from 'next/server';
import { Redis } from '@upstash/redis';
const redis=Redis.fromEnv();
const P='rp:';

export async function POST(req){
  try{
    const {userId}=await req.json();
    if(!userId) return NextResponse.json({success:false, txs:[]}, {status:400});
    
    // Main source - you use this in deposit, withdraw, stake, yield, commission, turbo
    const raw = await redis.lrange(`${P}tx:${userId}`,0,-1);
    
    // Also pull legacy keys if exist (some old tx are there)
    const raw2 = await redis.lrange(`${P}tx:history:${userId}`,0,-1).catch(()=>[]);
    const raw3 = await redis.lrange(`${P}transactions:${userId}`,0,-1).catch(()=>[]);
    
    const allRaw = [...raw, ...raw2, ...raw3];
    
    const txsMap = new Map();
    for(const r of allRaw){
      try{
        const obj = typeof r==='string'?JSON.parse(r):r;
        if(!obj || !obj.id) continue;
        // dedupe by id, keep newest
        if(!txsMap.has(obj.id)) txsMap.set(obj.id, obj);
      }catch{ continue }
    }
    
    let txs = Array.from(txsMap.values());
    
    // Sort by timestamp DESC (newest first)
    txs.sort((a,b)=> Number(b.timestamp||0) - Number(a.timestamp||0));
    
    // Normalize types for frontend tabs
    txs = txs.map(t=>{
      // Ensure status capitalized for display
      if(!t.status) t.status = 'success';
      // Ensure dateStr exists
      if(!t.dateStr && t.date) t.dateStr = t.date;
      return t;
    });
    
    return NextResponse.json({success:true, txs});
  }catch(e){
    console.error(e);
    return NextResponse.json({success:false, txs:[], error:e.message}, {status:500});
  }
}