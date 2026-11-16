export const runtime='nodejs';
export const dynamic='force-dynamic';
import { NextResponse } from 'next/server';
import { Redis } from '@upstash/redis';
const redis = Redis.fromEnv();
const P = 'rp:';

// FIXED TIME
const getUgDate = () => new Date().toLocaleDateString('en-GB', { timeZone: 'Africa/Kampala' });
const getUgTime = () => new Date().toLocaleTimeString('en-GB', { timeZone: 'Africa/Kampala', hour:'2-digit', minute:'2-digit', hour12:false });
const getUgDateTime = () => `${getUgDate()} ${getUgTime()}`;

export async function POST(req){
  try{
    const { userId, phone, username, amount, walletInput, method, usdtRate, usdtAmount } = await req.json();
    if(!userId || !amount) return NextResponse.json({error:'Missing fields'},{status:400});
    
    const displayTime = getUgDateTime();
    const dateOnly = getUgDate();
    const timeOnly = getUgTime();
    
    // --- CRYPTO ONLY ---
    const isCrypto = method === 'Crypto currency' || method === 'crypto';
    const rate = Number(usdtRate) || 0;
    const usdtAmt = Number(usdtAmount) || (isCrypto && rate ? Number(amount) / rate : 0);

    const tx = {
      id: `dep_${Date.now()}_${userId}`,
      type: 'deposit',
      method: method || 'MTN',
      amount: Number(amount),
      wallet: walletInput,
      userId,
      phone: phone || '',
      username: username || '',
      status: 'pending',
      timestamp: Date.now(),
      displayTime: displayTime, // 04/11/2025 15:32
      date: dateOnly, // 04/11/2025
      time: timeOnly, // 15:32
      dateStr: displayTime,
      createdAt: displayTime,
      // --- CRYPTO ONLY: saved so admin sees USDT ---
      ...(isCrypto ? {
        usdtRate: rate,
        usdtAmount: Number(usdtAmt.toFixed(2)),
        currency: 'USDT',
      } : {}),
      display: isCrypto ? `Deposit pending ${Number(usdtAmt.toFixed(2))} USDT (~${Number(amount).toLocaleString()} UGX)` : `Deposit pending ${amount} UGX`
    };
    
    await redis.lpush(`${P}tx:${userId}`, JSON.stringify(tx));
    await redis.lpush(`${P}transactions:${userId}`, JSON.stringify(tx));
    await redis.set(`${P}pending:deposit:${tx.id}`, tx);
    await redis.lpush(`${P}pending:deposits`, tx.id);
    await redis.sadd(`${P}pending:deposits:ids`, tx.id);
    
    return NextResponse.json({success:true, tx});
  }catch(e){
    return NextResponse.json({error:e.message},{status:500});
  }
}