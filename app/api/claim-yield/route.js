export const runtime = 'nodejs';
import { NextResponse } from 'next/server';
import { Redis } from '@upstash/redis';
const redis = Redis.fromEnv();
const P = 'rp:';
const getUgDMYHM = () => {
  const d = new Date(new Date().toLocaleString('en-US', { timeZone: 'Africa/Kampala' }));
  return `${d.getDate()}/${d.getMonth()+1}/${d.getFullYear()} ${String(d.getHours()).padStart(2,'0')}:${String(d.getMinutes()).padStart(2,'0')}`;
};

export async function POST(req){
  try{
    const { userId, amount, power } = await req.json();
    if(!userId || !amount) return NextResponse.json({ success:false, message:'Missing' }, {status:400});
    
    const user = await redis.get(P+'user:'+userId);
    if(!user) return NextResponse.json({ success:false, message:'User not found' }, {status:404});
    
    const amt = Number(amount);
    user.balance = Number(user.balance||0)+amt;
    user.availableBalance = Number(user.availableBalance||0)+amt;
    user.totalBalance = Number(user.totalBalance||0)+amt;
    await redis.set(P+'user:'+userId, user);

    // sync riot:user:{id} if exists (your Mine reads riot_user)
    try{
      const riotKey = `riot:user:${userId}`;
      const rUser = await redis.hgetall(riotKey);
      if(rUser && Object.keys(rUser).length){
        await redis.hincrbyfloat(riotKey, 'balance', amt);
        await redis.hincrbyfloat(riotKey, 'availableBalance', amt);
      }
    }catch{}

    const dateStr = getUgDMYHM();
    const tx = {
      id: `yield_${Date.now()}`,
      type: 'Stake Yield',
      power,
      amount: amt,
      status: 'success',
      date: dateStr,
      dateStr: dateStr,
      createdAt: dateStr,
      display: `Yield ${power} +${amt.toLocaleString()} UGX`,
      timestamp: Date.now()
    };
    await redis.lpush(P+'tx:'+userId, JSON.stringify(tx));
    await redis.lpush(P+'tx:history:'+userId, JSON.stringify(tx));
    await redis.lpush(P+'transactions:'+userId, JSON.stringify(tx));

    return NextResponse.json({ success:true, user });
  }catch(e){ 
    console.error(e);
    return NextResponse.json({ success:false, message:e.message }, {status:500})
  }
}