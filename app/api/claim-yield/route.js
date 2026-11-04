export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import { Redis } from '@upstash/redis';
const redis = Redis.fromEnv();
const P = 'rp:';

const SERVER_PRICES = {
  "1W": { price: 20000, daily: 1000 },
  "1.5W": { price: 36000, daily: 1500 },
  "1.7W": { price: 50000, daily: 1700 },
  "2.5W": { price: 100000, daily: 2500 },
  "3.0W": { price: 180000, daily: 3000 },
  "3.5kW": { price: 250000, daily: 3500 },
  "4.5kW": { price: 350000, daily: 4500 },
  "5.8kW": { price: 500000, daily: 5800 },
  "8.0kW": { price: 780000, daily: 8000 },
  "10.0kW": { price: 980000, daily: 10000 },
  "14.0MW": { price: 1500000, daily: 14000 },
  "26.0MW": { price: 3000000, daily: 26000 },
  "40.0MW": { price: 5000000, daily: 40000 },
};

const parse = s => { if(typeof s==='object') return s; try{return JSON.parse(s)}catch{return null} }

// FIXED TIME - d/m/yr hr:mins
const getUgDate = () => new Date().toLocaleDateString('en-CA', { timeZone: 'Africa/Kampala' }); // for comparison YYYY-MM-DD
const getUgDateGB = () => new Date().toLocaleDateString('en-GB', { timeZone: 'Africa/Kampala' }); // 04/11/2025
const getUgTime = () => new Date().toLocaleTimeString('en-GB', { timeZone: 'Africa/Kampala', hour:'2-digit', minute:'2-digit', hour12:false });
const getUgDMYHM = () => `${getUgDateGB()} ${getUgTime()}`;

export async function POST(req){
  try{
    const { userId, stakeId } = await req.json();
    if(!userId || !stakeId) return NextResponse.json({ success:false, message:'Missing stakeId' }, {status:400});
    
    const userRaw = await redis.get(`${P}user:${userId}`);
    if(!userRaw) return NextResponse.json({ success:false, message:'User not found' }, {status:404});
    const user = typeof userRaw === 'string' ? parse(userRaw) : userRaw;

    const todayUg = getUgDate();
    const stakesKey = P+'stakes:'+user.userId;
    const stakesRaw = await redis.lrange(stakesKey, 0, 500);
    let stakes = stakesRaw.map(s => typeof s==='string'? parse(s):s).filter(Boolean);
    
    const idx = stakes.findIndex(s => s.id === stakeId);
    if(idx === -1) return NextResponse.json({ success:false, message:'Stake not found' }, {status:404});

    const st = stakes[idx];
    const powerLabel = st.powerLabel || st.power;
    
    const cfg = SERVER_PRICES[powerLabel];
    if(!cfg) return NextResponse.json({ success:false, message:'Invalid generator' }, {status:400});
    const amt = cfg.daily;

    if(st.lastClaimDate === todayUg){
      return NextResponse.json({ success:false, message:'Already collected today - come back at 00:00 Kampala' }, {status:400});
    }

    const calcDay = (() => {
      if(!st.ugStakedDate) return st.collectedDays||0;
      const start = new Date(st.ugStakedDate);
      const today = new Date(todayUg);
      return Math.floor((today - start) / 86400000);
    })();
    if(calcDay >= 180 || (st.collectedDays||0) >= 180){
      return NextResponse.json({ success:false, message:'Generator expired 180/180' }, {status:400});
    }

    st.collectedDays = (st.collectedDays||0)+1;
    st.lastClaimDate = todayUg;
    st.lastCollected = new Date().toISOString();
    stakes[idx] = st;

    await redis.del(stakesKey);
    for(let i=stakes.length-1; i>=0; i--){
      await redis.lpush(stakesKey, JSON.stringify(stakes[i]));
    }
    try{ await redis.set(`${P}stake:item:${stakeId}`, JSON.stringify(st)); }catch{}

    user.balance = Number(user.balance||0)+amt;
    user.availableBalance = Number(user.availableBalance||0)+amt;
    user.totalBalance = Number(user.totalBalance||0)+amt;
    await redis.set(P+'user:'+user.userId, user);

    // FIXED TX - d/m/yr hr:mins
    const displayTime = getUgDMYHM();
    const tx = {
      id: `yield_${Date.now()}`,
      type: 'stake_yield',
      label: 'Stake Yield',
      power: powerLabel,
      powerLabel,
      stakeId,
      amount: amt,
      status: 'success',
      displayTime: displayTime, // 04/11/2025 15:32
      date: getUgDateGB(), // 04/11/2025
      time: getUgTime(), // 15:32
      dateStr: displayTime,
      createdAt: displayTime,
      ugandaDate: todayUg,
      isoDate: todayUg,
      display: `Yield ${powerLabel} +${amt.toLocaleString()} UGX`,
      timestamp: Date.now(),
      userId: user.userId,
    };
    await redis.lpush(P+'tx:'+user.userId, JSON.stringify(tx));
    await redis.lpush(P+'transactions:'+user.userId, JSON.stringify(tx));

    return NextResponse.json({ success:true, user, tx, daily: amt });
  }catch(e){ 
    console.error(e);
    return NextResponse.json({ success:false, message:e.message }, {status:500})
  }
}