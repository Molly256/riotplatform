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
const getUgDMYHM = () => {
  const d = new Date(new Date().toLocaleString('en-US', { timeZone: 'Africa/Kampala' }));
  return `${d.getDate()}/${d.getMonth()+1}/${d.getFullYear()} ${String(d.getHours()).padStart(2,'0')}:${String(d.getMinutes()).padStart(2,'0')}`;
};

async function processStakeCommissions(buyerId, stakeAmount) {
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
    const stakesCount = await redis.llen(P + 'stakes:' + uplineId);
    if (stakesCount === 0) continue;

    const reward = Math.floor(stakeAmount * rates[i]);
    if (reward <= 0) continue;

    const uplineRaw = await redis.get(P + 'user:' + uplineId);
    const uplineUser = uplineRaw ? (typeof uplineRaw==='string'? parse(uplineRaw):uplineRaw) : null
    if (uplineUser) {
      uplineUser.balance = Number(uplineUser.balance || 0) + reward;
      uplineUser.availableBalance = Number(uplineUser.availableBalance || 0) + reward;
      uplineUser.totalBalance = Number(uplineUser.totalBalance || uplineUser.balance || 0);
      // keep totalBalance in sync
      if(Number(uplineUser.totalBalance) < Number(uplineUser.balance)) uplineUser.totalBalance = uplineUser.balance
      await redis.set(P + 'user:' + uplineId, uplineUser);
      try{ await redis.hset(`riot:user:${uplineId}`, { balance: uplineUser.totalBalance, totalBalance: uplineUser.totalBalance, availableBalance: uplineUser.totalBalance }) }catch{}
    }

    const commTx = {
      id: `comm_${Date.now()}_${i}_${uplineId}`,
      type: i === 0 ? 'team_a_payout' : i === 1 ? 'team_b_payout' : 'team_c_payout',
      label: `Team ${['A','B','C'][i]} Commission`,
      amount: reward,
      display: `Team ${['A','B','C'][i]}: ${buyerId} staked ${stakeAmount.toLocaleString()} UGX`,
      status: 'success',
      timestamp: Date.now(),
      dateStr: timeStr,
      date: timeStr,
      createdAt: timeStr
    };
    await redis.lpush(P + 'tx:' + uplineId, JSON.stringify(commTx));
    await redis.lpush(P + 'tx:history:' + uplineId, JSON.stringify(commTx));

    if (i === 0) {
      const turboKey = P + 'turbocharge:' + uplineId;
      let turbo = await redis.get(turboKey);
      if (!turbo) turbo = { totalPower: 0, members: 0 };
      turbo = typeof turbo==='string'? parse(turbo):turbo
      turbo.totalPower = Number(turbo.totalPower || 0) + 2;
      turbo.lastUpdate = Date.now();
      await redis.set(turboKey, turbo);

      const turboTx = {
        id: `turbo_stake_${Date.now()}_${uplineId}`,
        type: 'turbocharge',
        label: 'Turbocharge 2 watts',
        amount: 2,
        power: 2,
        note: `2 watts from ${buyerId} stake (Team A)`,
        status: 'success',
        timestamp: Date.now(),
        dateStr: timeStr,
        date: timeStr
      };
      await redis.lpush(P + 'tx:' + uplineId + ':history', JSON.stringify(turboTx));
      await redis.lpush(P + 'turbo:' + uplineId + ':history', JSON.stringify(turboTx));
    }
  }
}

export async function POST(req) {
  try {
    const { userId, phone, power, amount, tab } = await req.json();
    const stakeAmount = Number(String(power || amount||'').replace(/,/g,''));
    const query = userId || phone
    if (!query || !stakeAmount) return NextResponse.json({ success: false, message: 'Missing data' }, { status: 400 });

    const user = await getUserByQuery(query)
    if (!user) return NextResponse.json({ success: false, message: 'User not found '+query }, { status: 404 });
    const buyerId = user.userId

    const firstKey = P + 'stake:first:' + buyerId;
    const alreadyStaked = await redis.get(firstKey);

    const curBal = Number(user.totalBalance ?? user.availableBalance ?? user.balance ?? 0);
    if (curBal < stakeAmount) {
      return NextResponse.json({ success: false, error: 'Insufficient Total Balance', message: 'Insufficient Total Balance' }, { status: 400 });
    }

    // DEDUCT - backend only
    user.balance = Number(user.balance || 0) - stakeAmount;
    user.availableBalance = Number(user.availableBalance || 0) - stakeAmount;
    user.totalBalance = Number(user.totalBalance || 0) - stakeAmount;
    // ensure all fields equal after deduct
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
    const stakeData = {
      id: stakeId,
      stakePower: stakeAmount,
      power: stakeAmount,
      amount: stakeAmount,
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
      await processStakeCommissions(buyerId, stakeAmount);
    }

    return NextResponse.json({ success: true, stake: stakeData, user, firstTime: !alreadyStaked });

  } catch (err) {
    console.error(err);
    return NextResponse.json({ success: false, message: err.message }, { status: 500 });
  }
}