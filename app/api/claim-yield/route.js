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
  if(!userId) return null
  const u = await redis.get(`${P}user:${userId}`)
  if(!u) return null
  return typeof u==='string'? parse(u):u
}

const getUgDateCA = () => new Date().toLocaleDateString('en-CA', { timeZone: 'Africa/Kampala' });
const getUgDateGB = () => new Date().toLocaleDateString('en-GB', { timeZone: 'Africa/Kampala' });
const getUgTime = () => new Date().toLocaleTimeString('en-GB', { timeZone: 'Africa/Kampala', hour:'2-digit', minute:'2-digit', hour12:false });
const getUgDMYHM = () => `${getUgDateGB()} ${getUgTime()}`;

export async function POST(req){
  try{
    const { userId, stakeId } = await req.json();
    if(!userId || !stakeId) return NextResponse.json({ success:false, message:'Missing stakeId' }, {status:400});
    const user = await getUserByQuery(userId);
    if(!user) return NextResponse.json({ success:false, message:'User not found' }, {status:404});

    const todayCA = getUgDateCA();
    const todayGB = getUgDateGB();
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

    const last = String(st.lastClaimDate||'');
    if(last === todayCA || last === todayGB){
      return NextResponse.json({ success:false, message:'Already collected today - come back at 00:00 Kampala' }, {status:400});
    }

    // FIXED: Day count = diff + 1, based ONLY on ugStakedDate. Claim does NOT affect it.
    let calcDay = 1;
    if(st.ugStakedDate){
      try{
        const [y,m,d] = st.ugStakedDate.split('-').map(Number);
        const startUTC = Date.UTC(y, m-1, d);
        const [ty,tm,td] = todayCA.split('-').map(Number);
        const todayUTC = Date.UTC(ty, tm-1, td);
        calcDay = Math.floor((todayUTC - startUTC) / 86400000) + 1;
      }catch{ calcDay = 1; }
    }
    if(calcDay > 180){
      return NextResponse.json({ success:false, message:'Generator expired 180/180' }, {status:400});
    }

    // Do NOT use collectedDays for countdown anymore, keep it only for stats
    st.lastClaimDate = todayCA;
    st.lastCollected = new Date().toISOString();
    stakes[idx] = st;

    // FIXED: Use pipeline - no lag, one round trip instead of loop
    const pipe = redis.pipeline();
    pipe.del(stakesKey);
    for(let i=stakes.length-1; i>=0; i--) pipe.lpush(stakesKey, JSON.stringify(stakes[i]));
    pipe.set(`${P}stake:item:${stakeId}`, JSON.stringify(st));

    // FIXED: Today's Yield for Mine page - reset at midnight Kampala, then add
    const prevTodayDate = user.todayYieldDate || user.todayDate || '';
    let todayYield = Number(user.todayYield || user.todayEarning || 0);
    if(prevTodayDate !== todayCA) todayYield = 0;
    todayYield += amt;

    user.balance = Number(user.balance||0)+amt;
    user.availableBalance = Number(user.availableBalance||0)+amt;
    user.totalBalance = Number(user.totalBalance||0)+amt;
    user.balance = user.totalBalance;
    user.availableBalance = user.totalBalance;
    user.todayYield = todayYield;
    user.todayEarning = todayYield;
    user.todayYieldDate = todayCA;
    user.todayDate = todayCA;

    pipe.set(P+'user:'+user.userId, JSON.stringify(user));
    pipe.hset(`riot:user:${user.userId}`, { balance: user.totalBalance, totalBalance: user.totalBalance, availableBalance: user.totalBalance, todayYield, todayEarning: todayYield, todayYieldDate: todayCA });

    // FIXED: Tx time - createdAt = real ISO, displayTime = d/m/yr hr:mins
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
      displayTime,
      date: todayGB,
      time: getUgTime(),
      dateStr: displayTime,
      fullDate: displayTime,
      createdAt: new Date().toISOString(),
      createdAtUg: displayTime,
      ugandaDate: todayCA,
      display: `Yield ${powerLabel} +${amt.toLocaleString()} UGX`,
      timestamp: Date.now(),
      userId: user.userId,
    };
    pipe.lpush(P+'tx:'+user.userId, JSON.stringify(tx));
    pipe.lpush(P+'transactions:'+user.userId, JSON.stringify(tx));
    await pipe.exec();

    return NextResponse.json({ success:true, user, tx, daily: amt });
  }catch(e){ 
    console.error(e);
    return NextResponse.json({ success:false, message:e.message }, {status:500})
  }
}