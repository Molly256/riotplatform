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

const normalizeEarn = (raw) => {
  try{
    const o = typeof raw === 'string' ? JSON.parse(raw) : raw;
    if(!o) return null;
    // fix old broken items that have undefined
    const watts = Number(o.watts ?? o.bonus ?? o.power ?? o.amount ?? o.W ?? o.w ?? 0.25);
    if(!watts || isNaN(watts)) return null;
    const from = o.from || o.fromUser || o.invitee || o.inviteePhone || o.phone || o.username || o.userId || o.inviteeId || "friend";
    const date = o.date || o.createdAt || o.timestamp || o.fullDate || o.dateStr || new Date().toISOString();
    const type = o.type || (watts >= 2 ? 'first_stake' : 'invite');
    // skip undefined display
    let display = o.display;
    if(!display || display.includes('undefined')){
      display = type === 'first_stake' || watts >= 2 
        ? `🔥 Received ${watts}W - First Stake Bonus from ${from}` 
        : `Received ${watts}W from ${from}`;
    }
    return { watts, from, date, display, type, createdAt: date };
  }catch{ return null; }
}

export async function GET(req){
  try{
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get('userId');
    if(!userId) return NextResponse.json({success:false}, {status:400});
    
    const turbo = await redis.get(`${P}turbocharge:${userId}`);
    const user = await redis.get(`${P}user:${userId}`);
    
    // Available = goes to 0 after exchange
    const available = Number(turbo?.totalPower ?? user?.totalChargePower ?? user?.turboAvailable ?? 0);
    
    let earnHistory = [];
    try{
      const raw = await redis.lrange(`${P}turbo:${userId}:earn_history`,0,-1);
      earnHistory = raw.map(normalizeEarn).filter(Boolean);
      if(earnHistory.length===0){
        const old = await redis.lrange(`${P}turbo:${userId}:history`,0,-1);
        earnHistory = old.map(normalizeEarn).filter(h=> h && h.type!=='turbocharge_exchange').filter(Boolean);
      }
    }catch{}

    // FIX: lifetime = actual sum of history, not broken user field
    const sumEarned = earnHistory.reduce((s, r) => s + Number(r.watts||0), 0);
    // lifetime is total ever earned (adds new to old, never resets)
    const lifetime = Number(user?.turboLifetime ?? user?.totalTurboWatts ?? turbo?.lifetime ?? sumEarned ?? 0);
    // if user field is 0 but history shows 0.25, use history
    const finalLifetime = lifetime > 0 ? lifetime : sumEarned;
    const finalAvailable = available > 0 ? available : (sumEarned - Number(user?.turboExchangedTotal||0) > 0 ? sumEarned - Number(user?.turboExchangedTotal||0) : available);

    // Repair: if available is 0 but history says 0.25 and never exchanged, restore available
    let correctedAvailable = available;
    if(earnHistory.length > 0 && available === 0 && Number(user?.turboExchangedTotal||0) === 0){
      correctedAvailable = sumEarned;
      // save fix
      try{
        await redis.set(`${P}turbocharge:${userId}`, { totalPower: correctedAvailable, lifetime: finalLifetime, lastUpdate: Date.now() });
        if(user){
          user.totalChargePower = correctedAvailable;
          user.turboAvailable = correctedAvailable;
          user.turboLifetime = finalLifetime;
          user.totalTurboWatts = finalLifetime;
          await redis.set(`${P}user:${userId}`, user);
        }
      }catch{}
    }

    return NextResponse.json({ 
      success:true, 
      totalPower: correctedAvailable,
      available: correctedAvailable,
      lifetime: finalLifetime,
      totalTurboWatts: finalLifetime,
      history: earnHistory,
      totalPowerUg: correctedAvailable*1000,
      lifetimeUgx: finalLifetime*1000
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

    user.balance = Number(user.balance||0) + ugx;
    user.availableBalance = Number(user.availableBalance||0) + ugx;
    user.totalBalance = Number(user.totalBalance||0) + ugx;
    user.totalChargePower = newPower;
    user.turboAvailable = newPower;
    user.turboExchangedTotal = Number((Number(user.turboExchangedTotal||0) + wattsNum).toFixed(2));
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
      newPower,
      lifetime: Number(user.turboLifetime||0),
      ugx, 
      user 
    });
  }catch(e){
    return NextResponse.json({ success:false, message:e.message }, {status:500});
  }
}