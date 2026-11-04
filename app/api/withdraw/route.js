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

export async function POST(req){
  try{
    const { userId, phone, username, amount, holderName, walletNumber, method, fee, receive } = await req.json();
    if(!userId || !amount) return NextResponse.json({error:'Missing fields'},{status:400});
    
    const user = await redis.get(`${P}user:${userId}`);
    if(!user) return NextResponse.json({error:'User not found'},{status:404});
    if(Number(user.totalBalance || user.balance || 0) < Number(amount)){
      return NextResponse.json({error:'Insufficient balance'},{status:400});
    }

    const dateStr = getUgDMYHM();
    
    const feeCalc = Math.floor(Number(amount)*0.1);
    const receiveCalc = Number(amount) - feeCalc;
    
    const tx = {
      id: `wd_${Date.now()}_${userId}`,
      type: 'withdraw',
      method: method || 'MTN',
      amount: receiveCalc,
      originalAmount: Number(amount),
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
      date: dateStr,
      display: `Withdraw pending ${receiveCalc} UGX`
    };

    const newBal = Number(user.totalBalance || 0) - Number(amount);
    user.totalBalance = newBal;
    user.balance = newBal;
    user.availableBalance = newBal;
    await redis.set(`${P}user:${userId}`, user);
    
    await redis.lpush(`${P}tx:${userId}`, JSON.stringify(tx));
    await redis.set(`${P}pending:withdraw:${tx.id}`, tx);
    await redis.lpush(`${P}pending:withdraws`, tx.id);

    return NextResponse.json({success:true, tx, newBalance: newBal});
  }catch(e){
    return NextResponse.json({error:e.message},{status:500});
  }
}