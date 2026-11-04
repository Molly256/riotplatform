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
  if(!userId){
    const all = await redis.smembers(`${P}all_users`)
    for(const id of all.slice(0,500)){
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

const getUgDate = () => new Date().toLocaleDateString('en-CA', { timeZone: 'Africa/Kampala' });
// FIXED TIME ONLY - d/m/yr hr:mins with leading zeros
const getUgDMYHM = () => {
  const datePart = new Date().toLocaleDateString('en-GB', { timeZone: 'Africa/Kampala' });
  const timePart = new Date().toLocaleTimeString('en-GB', { timeZone: 'Africa/Kampala', hour:'2-digit', minute:'2-digit', hour12:false });
  return `${datePart} ${timePart}`;
};

async function processStakeCommissions(buyerId, stakeAmount, buyerPhone) {
  const rates = [0.10, 0.02, 0.01];
  const timeStr = getUgDMYHM();
  const parentId = await redis.get(P + 'parent:' + buyerId) || await redis.get(P + 'user:' + buyerId + ':inviter');
  if (!parentId) return;
  const chain = [];
  let current = String(parentId);
  for (let i = 0; i < 3; i++) {
    if (!current) break;
    chain.push(current);
    const nextParent = await redis.get(P + 'parent:' + current) || await redis.get(P + 'user:' + current + ':inviter');
    current = nextParent ? String(nextParent) : null;
  }
  for (let i = 0; i < chain.length; i++) {
    const uplineId = chain[i];
    const uplineHasStaked = await redis.get(P + 'stake:first:' + uplineId);
    if (!uplineHasStaked) continue;
    const uplineStakesRaw = await redis.lrange(P + 'stakes:' + uplineId, 0, -1);
    let uplineTotal = 0;
    for (const s of uplineStakesRaw) {
      try { const obj = typeof s === 'string' ? JSON.parse(s) : s; uplineTotal += Number(obj.stakePower || obj.amount || 0); } catch {}
    }
    if (uplineTotal === 0) continue;
    const usableAmount = Math.min(uplineTotal, stakeAmount);
    const reward = Math.floor(usableAmount * rates[i]);
    if (reward <= 0) continue;
    const uplineRaw = await redis.get(P + 'user:' + uplineId);
    const uplineUser = uplineRaw ? (typeof uplineRaw==='string'? parse(uplineRaw):uplineRaw) : null
    if (uplineUser) {
      uplineUser.balance = Number(uplineUser.balance || 0) + reward;
      uplineUser.availableBalance = Number(uplineUser.availableBalance || 0) + reward;
      uplineUser.totalBalance = Number(uplineUser.totalBalance || uplineUser.balance || 0);
      if(Number(uplineUser.totalBalance) < Number(uplineUser.balance)) uplineUser.totalBalance = uplineUser.balance
      await redis.set(P + 'user:' + uplineId, uplineUser);
      try{ await redis.hset(`riot:user:${uplineId}`, { balance: uplineUser.totalBalance, totalBalance: uplineUser.totalBalance, availableBalance: uplineUser.totalBalance }) }catch{}
    }
    const commTx = {
      id: `comm_${Date.now()}_${i}_${uplineId}`,
      type: i === 0 ? 'team_a_payout' : i === 1 ? 'team_b_payout' : 'team_c_payout',
      label: `Team ${['A','B','C'][i]} Commission`,
      amount: reward,
      display: `Team ${['A','B','C'][i]}: ${buyerId} staked ${stakeAmount.toLocaleString()} UGX (MIN ${usableAmount.toLocaleString()}) -> ${reward.toLocaleString()} UGX`,
      status: 'success',
      timestamp: Date.now(),
      dateStr: timeStr,
      date: timeStr,
      createdAt: timeStr
    };
    await redis.lpush(P + 'tx:' + uplineId, JSON.stringify(commTx));
    await redis.lpush(P + 'tx:history:' + uplineId, JSON.stringify(commTx));
    if (i === 0) {
      const upline = await redis.get(P + 'user:' + uplineId);
      const uplineObj = typeof upline==='string'? parse(upline):upline;
      if(uplineObj){
        const curAvail = Number(uplineObj.totalChargePower || uplineObj.turboAvailable || 0);
        const curLife = Number(uplineObj.turboLifetime || uplineObj.totalTurboWatts || 0);
        uplineObj.totalChargePower = Number((curAvail + 2).toFixed(2));
        uplineObj.turboAvailable = uplineObj.totalChargePower;
        uplineObj.turboLifetime = Number((curLife + 2).toFixed(2));
        uplineObj.totalTurboWatts = uplineObj.turboLifetime;
        await redis.set(P + 'user:' + uplineId, uplineObj);
        await redis.set(P + 'turbocharge:' + uplineId, { totalPower: uplineObj.totalChargePower, lifetime: uplineObj.turboLifetime, lastUpdate: Date.now() });
      }
      const turboEarn = {
        id: `turbo_earn_${Date.now()}_${uplineId}`,
        type: 'first_stake',
        watts: 2,
        from: buyerPhone || buyerId,
        power: 2,
        date: timeStr,
        dateStr: timeStr,
        timestamp: Date.now(),
        display: `🔥 Received 2W - First Stake Bonus from ${buyerPhone||buyerId}`
      };
      await redis.lpush(P + 'turbo:' + uplineId + ':earn_history', JSON.stringify(turboEarn));
      await redis.lpush(P + 'turbo:' + uplineId + ':history', JSON.stringify(turboEarn));
    }
  }
}

export async function POST(req) {
  try {
    const { userId, phone, powerLabel, tab } = await req.json();
    
    if (!powerLabel || !SERVER_PRICES[powerLabel]) {
      return NextResponse.json({ success: false, message: 'Invalid generator' }, { status: 400 });
    }
    
    const { price: stakeAmount, daily: dailyYield } = SERVER_PRICES[powerLabel];
    const query = userId || phone
    if (!query) return NextResponse.json({ success: false, message: 'Missing data' }, { status: 400 });

    const user = await getUserByQuery(query)
    if (!user) return NextResponse.json({ success: false, message: 'User not found '+query }, { status: 404 });
    const buyerId = user.userId

    const existingStakes = await redis.lrange(P + 'stakes:' + buyerId, 0, -1);
    for (const s of existingStakes) {
      try {
        const obj = typeof s === 'string' ? JSON.parse(s) : s;
        const existingLabel = obj.powerLabel || obj.power;
        if (existingLabel === powerLabel) {
          return NextResponse.json({ success: false, message: 'Already staked this generator' }, { status: 400 });
        }
      } catch {}
    }

    const firstKey = P + 'stake:first:' + buyerId;
    const alreadyStaked = await redis.get(firstKey);
    const curBal = Number(user.totalBalance ?? user.availableBalance ?? user.balance ?? 0);
    if (curBal < stakeAmount) {
      return NextResponse.json({ success: false, error: 'Insufficient Total Balance', message: 'Insufficient Total Balance' }, { status: 400 });
    }

    user.balance = Number(user.balance || 0) - stakeAmount;
    user.availableBalance = Number(user.availableBalance || 0) - stakeAmount;
    user.totalBalance = Number(user.totalBalance || 0) - stakeAmount;
    if(user.totalBalance <0) user.totalBalance=0
    user.balance = user.totalBalance
    user.availableBalance = user.totalBalance
    await redis.set(P + 'user:' + buyerId, user);

    try {
      await redis.hset(`riot:user:${buyerId}`, { balance: user.totalBalance, totalBalance: user.totalBalance, availableBalance: user.totalBalance })
      await redis.set(`riot:user:${buyerId}:balance`, user.totalBalance)
    } catch {}

    const dateStr = getUgDMYHM();
    const ugDate = getUgDate();
    const stakeId = `stake_${Date.now()}`;
    const label = powerLabel;

    const stakeData = {
      id: stakeId,
      stakePower: stakeAmount,
      power: label,
      powerLabel: label,
      amount: stakeAmount,
      daily: dailyYield,
      tab: tab || 'daily',
      status: 'active',
      stakedAt: new Date().toISOString(),
      ugStakedDate: ugDate,
      lastClaimDate: '',
      collectedDays: 0,
      countdown: '0/180',
      canClaimToday: true,
      dateStr,
      date: dateStr,
      period: '180 Days'
    };

    await redis.lpush(P + 'stakes:' + buyerId, JSON.stringify(stakeData));
    await redis.set(P + 'stake:item:' + stakeId, stakeData);
    await redis.sadd(P + `stakes:${buyerId}:${tab || 'daily'}`, stakeId);

    const tx = {
      id: stakeId,
      type: 'Stake',
      label: 'Stake',
      amount: stakeAmount,
      display: `Stake success ${stakeAmount.toLocaleString()} UGX`,
      status: 'success',
      timestamp: Date.now(),
      dateStr: dateStr,
      date: dateStr,
      createdAt: new Date().toISOString(),
      fullDate: new Date().toISOString(),
      tab: tab || 'daily',
      phone: user.phone,
      userId: buyerId
    };
    await redis.lpush(P + 'tx:' + buyerId, JSON.stringify(tx));
    await redis.lpush(P + 'tx:history:' + buyerId, JSON.stringify(tx));
    await redis.lpush(P + 'transactions:' + buyerId, JSON.stringify(tx));

    if (!alreadyStaked) {
      await redis.set(firstKey, Date.now());
      await processStakeCommissions(buyerId, stakeAmount, user.phone);
    }

    return NextResponse.json({ success: true, stake: stakeData, user, firstTime: !alreadyStaked });

  } catch (err) {
    console.error(err);
    return NextResponse.json({ success: false, message: err.message }, { status: 500 });
  }
}