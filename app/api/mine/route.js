export const runtime='nodejs';
export const dynamic='force-dynamic';
import { NextResponse } from 'next/server';
import { Redis } from '@upstash/redis';
const redis = Redis.fromEnv();
const P = 'rp:';

const parse = s => { if(typeof s==='object') return s; try{return JSON.parse(s)}catch{return null} }
const normalizePhone = p => { if(!p) return ''; let s=String(p).replace(/\s/g,''); if(s.startsWith('+256')) s='0'+s.slice(4); if(s.startsWith('256')) s='0'+s.slice(3); return s }

async function getUserByQueryFast(q){
  if(!q) return null
  const raw = String(q).trim()
  const low = raw.toLowerCase()
  let userId = await redis.get(`${P}phone:${raw}`)
  if(!userId) userId = await redis.get(`${P}phone:${normalizePhone(raw)}`)
  if(!userId) userId = await redis.get(`${P}username:${low}`)
  if(!userId){
    const exists = await redis.exists(`${P}user:${raw}`)
    if(exists) userId = raw
  }
  if(userId){
    const u = await redis.get(`${P}user:${userId}`)
    if(u) return typeof u==='string'? parse(u):u
  }
  // fallback only if fast path fails - pipeline fast
  const all = await redis.smembers(`${P}all_users`)
  const slice = all.slice(0,150)
  if(slice.length===0) return null
  const pipe = redis.pipeline()
  slice.forEach(id=> pipe.get(`${P}user:${id}`))
  const results = await pipe.exec()
  for(const r of results){
    const uObj = typeof r==='string'? parse(r):r
    if(!uObj) continue
    if(String(uObj.phone||'').includes(raw) || normalizePhone(uObj.phone||'').includes(normalizePhone(raw)) || String(uObj.userId||'').toLowerCase()===low) return uObj
  }
  return null
}

const getUgToday = () => {
  const d = new Date(new Date().toLocaleString('en-US', { timeZone: 'Africa/Kampala' }));
  return `${d.getDate()}/${d.getMonth()+1}/${d.getFullYear()}`;
};
const getUgTodayISO = () => new Date().toLocaleDateString('en-CA', { timeZone: 'Africa/Kampala' })
const getUgTodayGB = () => new Date().toLocaleDateString('en-GB', { timeZone: 'Africa/Kampala' })

// FIXED: Normalise ANY date format to YYYY-MM-DD
// "05/11/2026" == "5/11/2026" == "2026-11-05" == "05/11/2026 14:32" == ISO timestamp
const toISODate = (val) => {
  if(!val) return '';
  const s = String(val).trim();
  // Already YYYY-MM-DD or YYYY-MM-DDTHH...
  if(/^\d{4}-\d{2}-\d{2}/.test(s)) return s.slice(0,10);
  // DD/MM/YYYY or D/M/YYYY + optional time "05/11/2026 14:32"
  const m = s.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})/);
  if(m){
    const dd = m[1].padStart(2,'0');
    const mm = m[2].padStart(2,'0');
    return `${m[3]}-${mm}-${dd}`;
  }
  // ISO timestamp - convert to Kampala date
  const d = new Date(s);
  if(!isNaN(d.getTime())){
    return d.toLocaleDateString('en-CA', { timeZone: 'Africa/Kampala' });
  }
  return '';
};

export async function POST(req){
  try{
    const { userId, phone } = await req.json();
    const query = userId || phone
    if(!query) return NextResponse.json({success:false},{status:400});
    const user = await getUserByQueryFast(query);
    if(!user) return NextResponse.json({success:false, message:'User not found '+query},{status:404});

    // FAST: 0,500 not 0,-1 - same result for you since <500 txs
    const txList = await redis.lrange(`${P}tx:${user.userId}`,0,500);
    const txs = txList.map(s=>{ try{ return typeof s==='string'?JSON.parse(s):s }catch{ return null }}).filter(Boolean);

    const todayStr = getUgToday();
    const todayISO = getUgTodayISO();
    const todayGB = getUgTodayGB();
    
    let totalPowerDeposited = 0;
    let totalWithdraw = 0;
    let totalStake = 0;
    let totalStakeYield = 0;
    let todaysYield = 0;
    let totalTeamCommission = 0;
    let totalTurboWattsEarned = 0;
    let totalTurboExchangeUGX = 0;

    for(const tx of txs){
      const type = (tx.type||tx.label||'').toString();
      const typeLow = type.toLowerCase();
      const status = (tx.status||'').toLowerCase();
      const amt = Number(String(tx.amount||0).replace(/,/g,''))||0;
      
      if((typeLow==='deposit' || typeLow.includes('system increase')) && (status==='success' || status==='approved')){
        if(!typeLow.includes('regist') && !typeLow.includes('bonus') && !typeLow.includes('reward')) totalPowerDeposited += amt;
      }

      if(typeLow==='withdraw' || typeLow.includes('withdraw')){
        if(status==='pending' || status==='success' || status==='approved'){
          const full = Number(tx.originalAmount || tx.amount || 0);
          totalWithdraw += full;
        }
      }

      if((type==='Stake' || typeLow==='stake') && status==='success'){
        totalStake += amt;
      }

      if((typeLow.includes('yield') || typeLow.includes('profit')) && status==='success'){
        totalStakeYield += amt;
        // FIXED: Check ALL date fields, normalised to ISO. Old check failed because "05/11/2026" != "5/11/2026"
        const candidates = [
          tx.ugandaDate,
          tx.date,
          tx.dateStr,
          tx.createdAt,
          tx.createdAtUg,
          tx.fullDate,
          tx.timestamp ? new Date(Number(tx.timestamp)).toISOString() : ''
        ];
        const isToday = candidates.some(c => toISODate(c) === todayISO);
        if(isToday){
          todaysYield += amt;
        }
      }

      if(typeLow.includes('team_') && typeLow.includes('payout') && status==='success'){
        totalTeamCommission += amt;
      }
      if(typeLow.includes('team') && typeLow.includes('commission') && status==='success'){
        totalTeamCommission += amt;
      }

      if(typeLow==='turbocharge' && status==='success'){
        totalTurboWattsEarned += Number(tx.power || tx.amount || 0);
      }

      if(typeLow.includes('turbocharge exchange') && status==='success'){
        totalTurboExchangeUGX += amt;
      }
    }

    let turboKey = await redis.get(`${P}turbocharge:${user.userId}`);
    const dbTurboPower = Number(turboKey?.totalPower || user.totalChargePower || 0);
    if(dbTurboPower>0 && totalTurboWattsEarned===0){
      totalTurboWattsEarned = dbTurboPower + totalTurboExchangeUGX/1000;
    }

    const sumIncome = totalPowerDeposited + totalStakeYield + totalTeamCommission + totalTurboExchangeUGX + 1000
    const correctBalance = Math.max(0, sumIncome - totalStake - totalWithdraw)
    
    let totalBalance = Number(user.totalBalance||user.balance||0)
    
    if(Math.abs(totalBalance - correctBalance) > 0.5){
      if(totalBalance < sumIncome || totalBalance > correctBalance){
        totalBalance = correctBalance
        user.totalBalance = totalBalance
        user.balance = totalBalance
        user.availableBalance = totalBalance
        await redis.set(`${P}user:${user.userId}`, user)
        try{ await redis.hset(`riot:user:${user.userId}`, { balance: totalBalance, totalBalance, availableBalance: totalBalance }) }catch{}
      }
    }

    return NextResponse.json({
      success:true,
      user: { ...user, totalBalance, balance: totalBalance, availableBalance: totalBalance },
      totals:{
        totalPowerDeposited,
        totalWithdraw,
        totalStake,
        totalStakeYield,
        todaysYield,
        totalTeamCommission,
        totalTurboWattsEarned,
        totalTurboExchangeUGX,
        totalTurbochargeUGX: totalTurboExchangeUGX,
        totalTurbochargeWatts: dbTurboPower,
        totalChargePower: dbTurboPower,
        totalBalance,
        availableBalance: totalBalance,
        balance: totalBalance
      }
    }, { headers: { 'Cache-Control': 'no-store' } });

  }catch(e){
    console.error(e);
    return NextResponse.json({success:false, message:e.message},{status:500});
  }
}