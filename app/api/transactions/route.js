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
    
    const raw = await redis.lrange(`${P}tx:${userId}`,0,-1);
    const raw2 = await redis.lrange(`${P}tx:history:${userId}`,0,-1).catch(()=>[]);
    const raw3 = await redis.lrange(`${P}transactions:${userId}`,0,-1).catch(()=>[]);
    
    const allRaw = [...raw, ...raw2, ...raw3];
    
    const txsMap = new Map();
    for(const r of allRaw){
      try{
        const obj = typeof r==='string'?JSON.parse(r):r;
        if(!obj || !obj.id) continue;
        if(!txsMap.has(obj.id)) txsMap.set(obj.id, obj);
      }catch{ continue }
    }
    
    let txs = Array.from(txsMap.values());
    txs.sort((a,b)=> Number(b.timestamp||0) - Number(a.timestamp||0));
    
    // FIXED TIME ONLY - normalize d/m/yr hr:mins
    txs = txs.map(t=>{
      if(!t.status) t.status = 'success';
      // Ensure displayTime is used - d/m/yr hr:mins
      const time = t.displayTime || t.dateStr || t.createdAt || t.date || '';
      if(!t.displayTime) t.displayTime = time;
      if(!t.dateStr) t.dateStr = time;
      if(!t.date) t.date = time;
      // Keep time field if exists, else extract from displayTime
      if(!t.time && time && time.includes(' ')){
        const parts = time.split(' ');
        if(parts[1] && parts[1].includes(':')) t.time = parts[1];
      }
      return t;
    });
    
    return NextResponse.json({success:true, txs});
  }catch(e){
    console.error(e);
    return NextResponse.json({success:false, txs:[], error:e.message}, {status:500});
  }
}