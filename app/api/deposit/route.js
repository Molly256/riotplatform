export const runtime='nodejs';
export const dynamic='force-dynamic';
import { NextResponse } from 'next/server';
import { Redis } from '@upstash/redis';
const redis = Redis.fromEnv();
const P = 'rp:';

export async function POST(req){
  try{
    const { userId, phone, username, amount, walletInput, method } = await req.json();
    if(!userId || !amount) return NextResponse.json({error:'Missing fields'},{status:400});
    
    const d = new Date(new Date().toLocaleString('en-US', { timeZone: 'Africa/Kampala' }));
    const dateStr = `${d.getDate()}/${d.getMonth()+1}/${d.getFullYear()} ${String(d.getHours()).padStart(2,'0')}:${String(d.getMinutes()).padStart(2,'0')}`;
    
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
      dateStr,
      date: dateStr,
      display: `Deposit pending ${amount} UGX`
    };
    
    await redis.lpush(`${P}tx:${userId}`, JSON.stringify(tx));
    await redis.set(`${P}pending:deposit:${tx.id}`, tx);
    await redis.lpush(`${P}pending:deposits`, tx.id);
    await redis.sadd(`${P}pending:deposits:ids`, tx.id);
    
    return NextResponse.json({success:true, tx});
  }catch(e){
    return NextResponse.json({error:e.message},{status:500});
  }
}