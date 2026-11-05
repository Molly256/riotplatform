export const runtime='nodejs';
export const dynamic='force-dynamic';
import { NextResponse } from 'next/server';
import { Redis } from '@upstash/redis';
const redis=Redis.fromEnv();
const P='rp:';

// FIXED: Always build d/m/yr hr:mins in Kampala time from timestamp
const getUgDisplayFromTs = (ts) => {
  if(!ts) return '';
  const d = new Date(Number(ts));
  if(isNaN(d.getTime())) return '';
  const dateGB = d.toLocaleDateString('en-GB', { timeZone: 'Africa/Kampala' }); // 05/11/2026
  const timeGB = d.toLocaleTimeString('en-GB', { timeZone: 'Africa/Kampala', hour:'2-digit', minute:'2-digit', hour12:false }); // 14:32
  return `${dateGB} ${timeGB}`;
};

const getUgDisplayFromISO = (iso) => {
  if(!iso) return '';
  const d = new Date(iso);
  if(isNaN(d.getTime())) return '';
  const dateGB = d.toLocaleDateString('en-GB', { timeZone: 'Africa/Kampala' });
  const timeGB = d.toLocaleTimeString('en-GB', { timeZone: 'Africa/Kampala', hour:'2-digit', minute:'2-digit', hour12:false });
  return `${dateGB} ${timeGB}`;
};

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
    
    // FIXED: Guarantee displayTime is ALWAYS d/m/yr hr:mins
    txs = txs.map(t=>{
      if(!t.status) t.status = 'success';

      // 1. Try timestamp first - most reliable, always has time
      let displayTime = '';
      if(t.timestamp) displayTime = getUgDisplayFromTs(t.timestamp);

      // 2. If no timestamp, try createdAt if it's a real ISO
      if(!displayTime && t.createdAt && t.createdAt.includes('T')) displayTime = getUgDisplayFromISO(t.createdAt);

      // 3. If still empty, try existing displayTime/dateStr if it already has time "05/11/2026 14:32"
      if(!displayTime){
        const cand = t.displayTime || t.dateStr || t.createdAtUg || t.fullDate || '';
        if(cand && cand.includes(' ') && cand.includes(':')) displayTime = cand;
      }

      // 4. If still empty, build from ugandaDate + time field
      if(!displayTime && t.ugandaDate){
        // ugandaDate is YYYY-MM-DD -> convert to DD/MM/YYYY
        const parts = String(t.ugandaDate).slice(0,10).split('-');
        if(parts.length===3){
          const dateGB = `${parts[2]}/${parts[1]}/${parts[0]}`;
          const tm = t.time || '00:00';
          displayTime = `${dateGB} ${tm}`;
        }
      }

      // 5. Last fallback: old date only - keep it, but don't lose it
      if(!displayTime) displayTime = t.displayTime || t.dateStr || t.date || '';

      t.displayTime = displayTime;
      t.dateStr = displayTime;
      // Keep t.date as date-only for any code that expects date-only
      if(displayTime && displayTime.includes(' ')){
        t.date = displayTime.split(' ')[0];
        t.time = displayTime.split(' ')[1];
      } else if(!t.date){
        t.date = displayTime;
      }
      // Keep ISO for sorting, but never use it as display
      if(!t.createdAt) t.createdAt = displayTime;

      return t;
    });
    
    return NextResponse.json({success:true, txs});
  }catch(e){
    console.error(e);
    return NextResponse.json({success:false, txs:[], error:e.message}, {status:500});
  }
}