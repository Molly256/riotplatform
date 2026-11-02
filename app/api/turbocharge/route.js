export const runtime='nodejs';
export const dynamic='force-dynamic';
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
    const { userId, watts } = await req.json();
    if(!userId || !watts) return NextResponse.json({success:false},{status:400});
    const wattsNum = Number(watts);
    if(wattsNum < 2) return NextResponse.json({success:false, message:'Min 2W'}, {status:400});

    // Get current turbo power from DB
    let turbo = await redis.get(`${P}turbocharge:${userId}`);
    let currentPower = Number(turbo?.totalPower || 0);
    
    // Fallback: calculate from turbo history + myteam invites if turbo key empty
    if(currentPower===0){
      try{
        const teamRes = await redis.smembers(`${P}teamA:${userId}`) || [];
        // or count from tx:history turbo
        const hist = await redis.lrange(`${P}turbo:${userId}:history`,0,-1);
        if(hist?.length) currentPower = hist.length * 0.25;
      }catch{}
    }

    // Also check user.totalChargePower
    const user = await redis.get(`${P}user:${userId}`);
    if(!user) return NextResponse.json({success:false, message:'User not found'}, {status:404});
    
    const dbPower = Number(user.totalChargePower || turbo?.totalPower || 0);
    if(dbPower>0) currentPower = dbPower;

    if(currentPower < wattsNum) return NextResponse.json({success:false, message:`Not enough power. Have ${currentPower}W`}, {status:400});

    const ugx = wattsNum * 1000;
    const newPower = Number((currentPower - wattsNum).toFixed(2));

    // Update user balances
    user.balance = Number(user.balance||0) + ugx;
    user.availableBalance = Number(user.availableBalance||0) + ugx;
    user.totalBalance = Number(user.totalBalance||0) + ugx;
    user.totalChargePower = newPower;
    await redis.set(`${P}user:${userId}`, user);

    // Update turbocharge key
    await redis.set(`${P}turbocharge:${userId}`, { totalPower: newPower, lastUpdate: Date.now() });

    const dateStr = getUgDMYHM();
    // TX for Mine + Transactions page
    const tx = {
      id: `turbo_ex_${Date.now()}_${userId}`,
      type: 'Turbocharge Exchange',
      label: 'Turbocharge Exchange',
      amount: ugx,
      watts: wattsNum,
      power: wattsNum,
      status: 'success',
      date: dateStr,
      dateStr,
      createdAt: dateStr,
      timestamp: Date.now(),
      display: `Turbo ${wattsNum}W = ${ugx} UGX`
    };

    await redis.lpush(`${P}tx:${userId}`, JSON.stringify(tx));
    await redis.lpush(`${P}tx:history:${userId}`, JSON.stringify(tx));
    await redis.lpush(`${P}turbo:${userId}:history`, JSON.stringify({ ...tx, type: 'turbocharge_exchange' }));

    // Sync riot:user if exists
    try{
      const riotKey = `riot:user:${userId}`;
      const r = await redis.hgetall(riotKey);
      if(r && Object.keys(r).length){
        await redis.hincrbyfloat(riotKey, 'balance', ugx);
        await redis.hincrbyfloat(riotKey, 'availableBalance', ugx);
      }
    }catch{}

    return NextResponse.json({ success:true, newPower, ugx, user });
  }catch(e){
    return NextResponse.json({ success:false, message:e.message }, {status:500});
  }
}

// GET current power
export async function GET(req){
  try{
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get('userId');
    if(!userId) return NextResponse.json({success:false}, {status:400});
    const turbo = await redis.get(`${P}turbocharge:${userId}`);
    const user = await redis.get(`${P}user:${userId}`);
    const power = Number(turbo?.totalPower || user?.totalChargePower || 0);
    return NextResponse.json({ success:true, totalPower: power });
  }catch(e){ return NextResponse.json({success:false}) }
}