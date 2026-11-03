export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import { Redis } from '@upstash/redis';
const redis = Redis.fromEnv();
const P = 'rp:';

const parse = s => { if(typeof s==='object') return s; try{return JSON.parse(s)}catch{return null} }
const normalizePhone = p => { if(!p) return ''; let s=String(p).replace(/\s/g,''); if(s.startsWith('+256')) s='0'+s.slice(4); if(s.startsWith('256')) s='0'+s.slice(3); return s }

async function getUserByQuery(q){
  if(!q) return null
  const raw = String(q).trim()
  const low = raw.toLowerCase()
  let userId = await redis.get(`${P}phone:${raw}`)
  if(!userId) userId = await redis.get(`${P}phone:${normalizePhone(raw)}`)
  if(!userId) userId = await redis.get(`${P}username:${low}`)
  if(!userId){
    const exists = await redis.exists(`${P}user:${raw}`)
    if(exists) userId = raw
  }
  if(!userId){
    const all = await redis.smembers(`${P}all_users`)
    for(const id of all.slice(0,400)){
      const u = await redis.get(`${P}user:${id}`)
      if(!u) continue
      const uObj = typeof u==='string'? parse(u):u
      if(!uObj) continue
      if(String(uObj.phone||'').includes(raw) || normalizePhone(uObj.phone||'').includes(normalizePhone(raw))) return uObj
    }
    return null
  }
  const u = await redis.get(`${P}user:${userId}`)
  if(!u) return null
  return typeof u==='string'? parse(u):u
}

const getUgDMYHM = () => {
  const d = new Date(new Date().toLocaleString('en-US', { timeZone: 'Africa/Kampala' }));
  return `${d.getDate()}/${d.getMonth()+1}/${d.getFullYear()} ${String(d.getHours()).padStart(2,'0')}:${String(d.getMinutes()).padStart(2,'0')}`;
};
const getUgDate = () => new Date().toLocaleDateString('en-CA', { timeZone: 'Africa/Kampala' }) // YYYY-MM-DD Uganda
const getUgDateTime = () => new Date().toLocaleString('en-CA', { timeZone: 'Africa/Kampala', hour12:false }).replace(',','').slice(0,19)

export async function POST(req){
  try{
    const { userId, phone, amount, power, stakeId } = await req.json();
    const query = userId || phone
    if(!query || !amount) return NextResponse.json({ success:false, message:'Missing' }, {status:400});
    
    const user = await getUserByQuery(query);
    if(!user) return NextResponse.json({ success:false, message:'User not found '+query }, {status:404});
    
    const amt = Number(String(amount).replace(/,/g,''));
    const todayUg = getUgDate(); // e.g. 2026-11-03 Kampala

    // 1. KEEP ALL - UPDATE ONE STAKE - BLOCK SAME DAY
    const stakesKey = P+'stakes:'+user.userId;
    const stakesRaw = await redis.lrange(stakesKey, 0, 200);
    if(stakesRaw.length > 0){
      let stakes = stakesRaw.map(s => typeof s==='string'? parse(s):s).filter(Boolean);
      
      let targetIndex = -1;
      if(stakeId){
        targetIndex = stakes.findIndex(s => s.id === stakeId);
      } else {
        // find first matching power that hasn't collected TODAY
        targetIndex = stakes.findIndex(s => {
          const matchPower = String(s.power) === String(power) || String(s.powerLabel) === String(power);
          if(!matchPower) return false;
          if((s.collectedDays||0) >= 180) return false;
          return s.lastClaimDate !== todayUg; // <-- only this check
        });
        if(targetIndex === -1) targetIndex = stakes.findIndex(s => String(s.power) === String(power) || String(s.powerLabel) === String(power));
      }

      if(targetIndex !== -1){
        const st = stakes[targetIndex];
        if(st.lastClaimDate === todayUg){
          return NextResponse.json({ success:false, message:'Already collected today' }, {status:400});
        }
        if((st.collectedDays||0) >= 180){
          return NextResponse.json({ success:false, message:'Generator expired' }, {status:400});
        }
        // update - keeps all generators
        st.collectedDays = (st.collectedDays||0)+1;
        st.lastClaimDate = todayUg;
        st.lastCollected = new Date().toISOString();
        st.countdown = `${st.collectedDays}/180`;
        st.expired = st.collectedDays >= 180;
        stakes[targetIndex] = st;

        // rewrite list preserving order (delete + lpush reverse)
        await redis.del(stakesKey);
        for(let i=stakes.length-1; i>=0; i--){
          await redis.lpush(stakesKey, JSON.stringify(stakes[i]));
        }
      }
    }

    // 2. BALANCE
    user.balance = Number(user.balance||0)+amt;
    user.availableBalance = Number(user.availableBalance||0)+amt;
    user.totalBalance = Number(user.totalBalance||0)+amt;
    await redis.set(P+'user:'+user.userId, user);

    try{
      await redis.hset(`riot:user:${user.userId}`, { balance: user.totalBalance, totalBalance: user.totalBalance, availableBalance: user.totalBalance })
      await redis.set(`riot:user:${user.userId}:balance`, user.totalBalance)
    }catch{}

    const tx = {
      id: `yield_${Date.now()}`,
      type: 'stake_yield',
      label: 'Stake Yield',
      power,
      stakeId: stakeId || '',
      amount: amt,
      status: 'success',
      date: getUgDMYHM(),
      dateStr: getUgDateTime(),
      fullDate: new Date().toISOString(),
      createdAt: new Date().toISOString(),
      display: `Yield ${power} +${amt.toLocaleString()} UGX`,
      timestamp: Date.now(),
      phone: user.phone,
      userId: user.userId,
      ugandaDate: todayUg
    };
    await redis.lpush(P+'tx:'+user.userId, JSON.stringify(tx));
    await redis.lpush(P+'tx:history:'+user.userId, JSON.stringify(tx));
    await redis.lpush(P+'transactions:'+user.userId, JSON.stringify(tx));

    return NextResponse.json({ success:true, user, tx });
  }catch(e){ 
    return NextResponse.json({ success:false, message:e.message }, {status:500})
  }
}