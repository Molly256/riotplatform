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

export async function POST(req){
  try{
    const { userId, phone, username, amount, holderName, walletNumber, method, fee, receive } = await req.json();
    if(!userId || !amount) return NextResponse.json({error:'Missing fields'},{status:400});

    const amt = Number(amount);
    if(isNaN(amt) || amt <= 0) return NextResponse.json({error:'Invalid amount'},{status:400});

    // ===== RULE 3: MINIMUM WITHDRAW 2,000 UGX =====
    if(amt < 2000){
      return NextResponse.json({error:'Minimum withdraw is 2,000 UGX'},{status:400});
    }

    // ===== RULE 2: ONLY MONDAY - SATURDAY, 9:00AM - 6:00PM UGANDA TIME =====
    // Get Kampala day + hour correctly
    const nowUg = new Date(new Date().toLocaleString('en-US', { timeZone: 'Africa/Kampala' }));
    const day = nowUg.getDay(); // 0=Sunday, 1=Monday ... 6=Saturday
    const hour = nowUg.getHours();
    const minute = nowUg.getMinutes();

    if(day === 0){
      return NextResponse.json({error:'Withdrawals are closed on Sunday. Available Monday to Saturday.'},{status:400});
    }
    // 9:00 to 18:00 - allow 09:00:00 to 17:59:59, block 18:00 and after, block before 09:00
    if(hour < 9 || hour >= 18){
      return NextResponse.json({error:'Withdrawals are only available Monday to Saturday from 9:00AM to 6:00PM Uganda time.'},{status:400});
    }

    const userRaw = await redis.get(`${P}user:${userId}`);
    const user = parse(userRaw);
    if(!user) return NextResponse.json({error:'User not found'},{status:404});
    if(Number(user.totalBalance || user.balance || 0) < amt){
      return NextResponse.json({error:'Insufficient balance'},{status:400});
    }

    // ===== RULE 1: ONLY 1 WITHDRAW PER DAY IF ALREADY SUCCESS =====
    // Check all tx lists for a withdraw today with status success (or pending - to stop spam)
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
      // Block if success OR pending today - pending means they already have one waiting
      if(st !== 'success' && st !== 'pending' && st !== 'approved') return false;
      // Check date via any field
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
      display: `Withdraw pending ${receiveCalc} UGX`
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