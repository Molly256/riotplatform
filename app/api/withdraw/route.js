export const runtime='nodejs';
export const dynamic='force-dynamic';
import { NextResponse } from 'next/server';
import { Redis } from '@upstash/redis';
const redis = Redis.fromEnv();
const P = 'rp:';

const getUgDMYHM = () => {
  const datePart = new Date().toLocaleDateString('en-GB', { timeZone: 'Africa/Kampala' });
  const timePart = new Date().toLocaleTimeString('en-GB', { timeZone: 'Africa/Kampala', hour:'2-digit', minute:'2-digit', hour12:false });
  return `${datePart} ${timePart}`;
};
const getUgDateCA = () => new Date().toLocaleDateString('en-CA', { timeZone: 'Africa/Kampala' }); // YYYY-MM-DD
const getUgDateGB = () => new Date().toLocaleDateString('en-GB', { timeZone: 'Africa/Kampala' }); // DD/MM/YYYY

// FIXED: Normalise any tx date to YYYY-MM-DD
const toISODate = (val) => {
  if(!val) return '';
  const s = String(val).trim();
  if(/^\d{4}-\d{2}-\d{2}/.test(s)) return s.slice(0,10);
  const m = s.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})/);
  if(m) return `${m[3]}-${m[2].padStart(2,'0')}-${m[1].padStart(2,'0')}`;
  const d = new Date(s);
  if(!isNaN(d.getTime())) return d.toLocaleDateString('en-CA', { timeZone: 'Africa/Kampala' });
  return '';
};

const parse = s => { if(typeof s==='object') return s; try{return JSON.parse(s)}catch{return null} }

// --- ADDED ONLY: allowed withdraw amounts - MIN stays 2000 ---
const ALLOWED_AMOUNTS = [2000, 10000, 36000, 50000, 85000, 100000, 150000, 200000, 300000, 530000, 750000, 1000000];

export async function POST(req){
  try{
    const { userId, phone, username, amount, holderName, walletNumber, method, fee, receive, usdtRate, usdtAmount, usdtFee, usdtReceive } = await req.json();
    if(!userId || !amount) return NextResponse.json({error:'Missing fields'},{status:400});

    const amt = Number(amount);
    if(isNaN(amt) || amt <= 0) return NextResponse.json({error:'Invalid amount'},{status:400});

    // --- CRYPTO ONLY ---
    const isCrypto = method === 'Crypto currency' || method === 'crypto';
    const rate = Number(usdtRate) || 0;
    const usdtAmt = Number(usdtAmount) || (isCrypto && rate ? amt / rate : 0);

    // ===== RULE 3: MINIMUM - Crypto 1 USDT only, MTN/Airtel 2,000 UGX =====
    if(isCrypto){
      if(!rate || usdtAmt < 1){
        return NextResponse.json({error:'Minimum withdraw for Crypto is 1 USDT'},{status:400});
      }
    } else {
      if(amt < 2000){
        return NextResponse.json({error:'Minimum withdraw is 2,000 UGX'},{status:400});
      }
    }

    // --- ADDED ONLY: allowed amounts ---
    if(!ALLOWED_AMOUNTS.includes(amt)){
      return NextResponse.json({error:'Withdraw amount must be one of: 2,000, 10,000, 36,000, 50,000, 85,000, 100,000, 150,000, 200,000, 300,000, 530,000, 750,000, 1,000,000 UGX'},{status:400});
    }

    // ===== RULE 2: ONLY MONDAY - SATURDAY, 9:00AM - 6:00PM UGANDA TIME =====
    const nowUg = new Date(new Date().toLocaleString('en-US', { timeZone: 'Africa/Kampala' }));
    const day = nowUg.getDay(); // 0=Sunday, 1=Monday ... 6=Saturday
    const hour = nowUg.getHours();

    if(day === 0){
      return NextResponse.json({error:'Withdrawals are closed on Sunday. Available Monday to Saturday.'},{status:400});
    }
    if(hour < 9 || hour >= 18){
      return NextResponse.json({error:'Withdrawals are only available Monday to Saturday from 9:00AM to 6:00PM Uganda time.'},{status:400});
    }

    const userRaw = await redis.get(`${P}user:${userId}`);
    const user = parse(userRaw);
    if(!user) return NextResponse.json({error:'User not found'},{status:404});

    // --- ADDED ONLY: must have staked - REAL KEYS from Stake API ---
    const uid = user.userId || userId;
    const [stakesRaw, firstStake] = await Promise.all([
      redis.lrange(`${P}stakes:${uid}`, 0, -1),
      redis.get(`${P}stake:first:${uid}`)
    ]);
    const hasStaked = (stakesRaw && stakesRaw.length > 0) || !!firstStake;
    if(!hasStaked){
      return NextResponse.json({error:'first stake to withdraw'},{status:400});
    }

    if(Number(user.totalBalance || user.balance || 0) < amt){
      return NextResponse.json({error:'Insufficient balance'},{status:400});
    }

    // ===== RULE 1: ONLY 1 WITHDRAW PER DAY IF ALREADY SUCCESS =====
    const todayCA = getUgDateCA();
    const [txRaw, txRaw2] = await Promise.all([
      redis.lrange(`${P}tx:${userId}`, 0, 500),
      redis.lrange(`${P}transactions:${userId}`, 0, 500).catch(()=>[])
    ]);
    const allTxs = [...txRaw, ...txRaw2].map(s => parse(s)).filter(Boolean);

    const alreadyWithdrawnToday = allTxs.some(tx => {
      const t = String(tx.type || tx.label || '').toLowerCase();
      if(!t.includes('withdraw')) return false;
      const st = String(tx.status || '').toLowerCase();
      if(st !== 'success' && st !== 'pending' && st !== 'approved') return false;
      const candidates = [tx.ugandaDate, tx.date, tx.dateStr, tx.createdAt, tx.displayTime, tx.timestamp ? new Date(Number(tx.timestamp)).toISOString() : ''];
      return candidates.some(c => toISODate(c) === todayCA);
    });

    if(alreadyWithdrawnToday){
      return NextResponse.json({error:'Only 1 withdraw per day is allowed. You already withdrew today.'},{status:400});
    }

    const dateStr = getUgDMYHM();
    const todayGB = getUgDateGB();
    
    const feeCalc = Math.floor(amt * 0.1);
    const receiveCalc = amt - feeCalc;
    const usdtFeeCalc = isCrypto && rate ? Number((feeCalc / rate).toFixed(2)) : 0;
    const usdtReceiveCalc = isCrypto && rate ? Number((receiveCalc / rate).toFixed(2)) : 0;
    
    const tx = {
      id: `wd_${Date.now()}_${userId}`,
      type: 'withdraw',
      method: method || 'MTN',
      amount: receiveCalc,
      originalAmount: amt,
      fee: feeCalc,
      receive: receiveCalc,
      holderName,
      wallet: walletNumber,
      userId,
      phone: phone || user.phone,
      username: username || user.username,
      status: 'pending',
      timestamp: Date.now(),
      dateStr,
      date: todayGB,
      displayTime: dateStr,
      createdAt: new Date().toISOString(),
      createdAtUg: dateStr,
      ugandaDate: todayCA,
      fullDate: dateStr,
      ...(isCrypto ? {
        usdtRate: rate,
        usdtAmount: Number(usdtAmt.toFixed(2)),
        usdtFee: usdtFeeCalc,
        usdtReceive: usdtReceiveCalc,
        currency: 'USDT',
      } : {}),
      display: isCrypto ? `Withdraw pending ${usdtReceiveCalc} USDT (~${receiveCalc} UGX)` : `Withdraw pending ${receiveCalc} UGX`
    };

    const newBal = Number(user.totalBalance || 0) - amt;
    user.totalBalance = newBal;
    user.balance = newBal;
    user.availableBalance = newBal;
    await redis.set(`${P}user:${userId}`, JSON.stringify(user));
    
    await redis.lpush(`${P}tx:${userId}`, JSON.stringify(tx));
    await redis.lpush(`${P}transactions:${userId}`, JSON.stringify(tx));
    await redis.set(`${P}pending:withdraw:${tx.id}`, JSON.stringify(tx));
    await redis.lpush(`${P}pending:withdraws`, tx.id);

    return NextResponse.json({success:true, tx, newBalance: newBal});
  }catch(e){
    return NextResponse.json({error:e.message},{status:500});
  }
}