export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import { Redis } from '@upstash/redis';

const redis = Redis.fromEnv();
const P = 'rp:';

async function processStakeCommissions(buyerId, stakeAmount) {
  const rates = [0.10, 0.02, 0.01];
  const timeStr = new Date().toLocaleString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit', hour12: false });

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
    const reward = Math.floor(stakeAmount * rates[i]);
    if (reward <= 0) continue;

    // Get user and add balance
    const uplineUser = await redis.get(P + 'user:' + uplineId);
    if (uplineUser) {
      uplineUser.balance = Number(uplineUser.balance || 0) + reward;
      uplineUser.availableBalance = Number(uplineUser.availableBalance || 0) + reward;
      uplineUser.totalBalance = Number(uplineUser.totalBalance || 0) + reward;
      await redis.set(P + 'user:' + uplineId, uplineUser);
    }

    // TX history for upline: Commission
    const commTx = {
      id: `comm_${Date.now()}_${i}`,
      type: i === 0 ? 'team_a_payout' : i === 1 ? 'team_b_payout' : 'team_c_payout',
      label: `Team ${['A','B','C'][i]} Commission`,
      amount: reward,
      display: `Team ${['A','B','C'][i]}: ${buyerId} staked ${stakeAmount} UGX`,
      status: 'success',
      timestamp: Date.now(),
      dateStr: timeStr
    };
    await redis.lpush(P + 'tx:' + uplineId, JSON.stringify(commTx));
    await redis.lpush(P + 'tx:history:' + uplineId, JSON.stringify(commTx));

    // 2 watts for Team A only
    if (i === 0) {
      const turboKey = P + 'turbocharge:' + uplineId;
      let turbo = await redis.get(turboKey);
      if (!turbo) turbo = { totalPower: 0, members: 0 };
      turbo.totalPower = Number(turbo.totalPower || 0) + 2;
      turbo.lastUpdate = Date.now();
      await redis.set(turboKey, turbo);

      const turboTx = {
        id: `turbo_stake_${Date.now()}`,
        type: 'turbocharge',
        label: 'Turbocharge 2 watts',
        amount: 2,
        power: 2,
        note: `2 watts from ${buyerId} stake (Team A)`,
        status: 'success',
        timestamp: Date.now(),
        dateStr: timeStr
      };
      await redis.lpush(P + 'tx:' + uplineId + ':history', JSON.stringify(turboTx));
      await redis.lpush(P + 'turbo:' + uplineId + ':history', JSON.stringify(turboTx));
    }
  }
}

export async function POST(req) {
  try {
    const { userId, power, amount, tab } = await req.json();
    const stakeAmount = Number(power || amount);
    const buyerId = String(userId);

    if (!buyerId || !stakeAmount) return NextResponse.json({ success: false, message: 'Missing data' }, { status: 400 });

    // One time check
    const firstKey = P + 'stake:first:' + buyerId;
    const alreadyStaked = await redis.get(firstKey);

    // Get user and deduct
    const user = await redis.get(P + 'user:' + buyerId);
    if (!user) return NextResponse.json({ success: false, message: 'User not found' }, { status: 404 });

    if (Number(user.availableBalance || user.balance || 0) < stakeAmount) {
      return NextResponse.json({ success: false, message: 'Insufficient balance' }, { status: 400 });
    }

    // Deduct
    user.balance = Number(user.balance) - stakeAmount;
    user.availableBalance = Number(user.availableBalance) - stakeAmount;
    user.totalBalance = Number(user.totalBalance || user.balance) - 0; // keep total? or also deduct
    // If Total balance = available + locked, we deduct available only, but for UI we sync
    await redis.set(P + 'user:' + buyerId, user);

    // Date format you want: d/m/yr hr:min
    const now = new Date();
    const dateStr = `${now.getDate()}/${now.getMonth()+1}/${now.getFullYear()} ${now.getHours()}:${String(now.getMinutes()).padStart(2,'0')}`;

    // Save My Stake with tab
    const stakeId = `stake_${Date.now()}`;
    const stakeData = {
      id: stakeId,
      stakePower: stakeAmount,
      power: stakeAmount,
      amount: stakeAmount,
      tab: tab || 'daily',
      status: 'active',
      stakedAt: new Date().toISOString(),
      dateStr,
      period: '180 Days'
    };

    await redis.lpush(P + 'stakes:' + buyerId, JSON.stringify(stakeData));
    await redis.set(P + 'stake:item:' + stakeId, stakeData);
    await redis.sadd(P + `stakes:${buyerId}:${tab || 'daily'}`, stakeId);

    // TX history - EXACT FORMAT YOU WANT
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
      tab: tab || 'daily'
    };
    await redis.lpush(P + 'tx:' + buyerId, JSON.stringify(tx));
    await redis.lpush(P + 'tx:history:' + buyerId, JSON.stringify(tx));
    await redis.lpush(P + 'transactions:' + buyerId, JSON.stringify(tx));

    // Pay team only first time
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