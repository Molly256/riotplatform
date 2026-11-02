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

export async function GET(req){
  try{
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get('userId');
    if(!userId) return NextResponse.json({success:false}, {status:400});
    
    const turbo = await redis.get(`${P}turbocharge:${userId}`);
    const user = await redis.get(`${P}user:${userId}`);
    
    // Available = Total charge power available (goes to 0 after exchange)
    const available = Number(turbo?.totalPower ?? user?.totalChargePower ?? user?.turboAvailable ?? 0);
    
    // Lifetime = Total Turbocharge for Mine page (adds new to old, never resets)
    const lifetime = Number(user?.turboLifetime ?? user?.totalTurboWatts ?? turbo?.lifetime ?? 0);
    
    // History = ALL tx ever earned (0.25W + 2W) - NOT exchange tx
    let earnHistory = [];
    try{
      const raw = await redis.lrange(`${P}turbo:${userId}:earn_history`,0,-1);
      earnHistory = raw.map(r=>{ try{ return typeof r==='string'?JSON.parse(r):r }catch{ return null } }).filter(Boolean);
      // fallback to old key
      if(earnHistory.length===0){
        const old = await redis.lrange(`${P}turbo:${userId}:history`,0,-1);
        earnHistory = old.map(r=>{ try{ return typeof r==='string'?JSON.parse(r):r }catch{ return null } })
        .filter(h=> h && h.type!=='turbocharge_exchange').filter(Boolean);
      }
    }catch{}

    return NextResponse.json({ 
      success:true, 
      totalPower: available,
      available,
      lifetime,
      totalTurboWatts: lifetime,
      history: earnHistory,
      totalPowerUg: available*1000,
      lifetimeUgx: lifetime*1000
    });
  }catch(e){ return NextResponse.json({success:false, message:e.message}) }
}

export async function POST(req){
  try{
    const { userId, watts } = await req.json();
    if(!userId || !watts) return NextResponse.json({success:false, message:'Missing fields'},{status:400});
    const wattsNum = Number(watts);
    if(wattsNum < 0.25) return NextResponse.json({success:false, message:'Min 0.25W'}, {status:400});

    const user = await redis.get(`${P}user:${userId}`);
    if(!user) return NextResponse.json({success:false, message:'User not found'}, {status:404});
    
    let turbo = await redis.get(`${P}turbocharge:${userId}`);
    let currentPower = Number(turbo?.totalPower ?? user.totalChargePower ?? user.turboAvailable ?? 0);

    if(currentPower < wattsNum) return NextResponse.json({success:false, message:`Not enough power. Have ${currentPower}W`}, {status:400});

    const ugx = Math.floor(wattsNum * 1000);
    const newPower = Number((currentPower - wattsNum).toFixed(2));

    // FIX: Only available goes to 0, lifetime keeps growing for Mine page
    user.balance = Number(user.balance||0) + ugx;
    user.availableBalance = Number(user.availableBalance||0) + ugx;
    user.totalBalance = Number(user.totalBalance||0) + ugx;
    user.totalChargePower = newPower;
    user.turboAvailable = newPower;
    // lifetime stays as is, exchanged total increases
    user.turboExchangedTotal = Number((Number(user.turboExchangedTotal||0) + wattsNum).toFixed(2));
    // totalTurboWatts = lifetime for Mine page display (1 big number)
    if(!user.turboLifetime) user.turboLifetime = Number(user.totalTurboWatts||0);
    
    await redis.set(`${P}user:${userId}`, user);
    await redis.set(`${P}turbocharge:${userId}`, { 
      totalPower: newPower, 
      lifetime: Number(user.turboLifetime||0),
      lastUpdate: Date.now() 
    });

    const dateStr = getUgDMYHM();
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

    return NextResponse.json({ 
      success:true, 
      newPower, // this will be 0 after full exchange
      lifetime: Number(user.turboLifetime||0), // for Mine page - adds new to old
      ugx, 
      user 
    });
  }catch(e){
    return NextResponse.json({ success:false, message:e.message }, {status:500});
  }
}