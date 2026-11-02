export const runtime='nodejs';
export const dynamic='force-dynamic';
import { NextResponse } from 'next/server';
import { Redis } from '@upstash/redis';
const redis = Redis.fromEnv();
const P = 'rp:';

const parse = s => { if(typeof s==='object') return s; try{return JSON.parse(s)}catch{return null} }
const normalizePhone = p => { if(!p) return ''; let s=String(p).replace(/\s/g,''); if(s.startsWith('+256')) s='0'+s.slice(4); if(s.startsWith('256')) s='0'+s.slice(3); return s }

async function getUserByQuery(q){
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
  if(!userId){
    const all = await redis.smembers(`${P}all_users`)
    for(const id of all.slice(0,400)){
      const u = await redis.get(`${P}user:${id}`)
      if(!u) continue
      const uObj = typeof u==='string'? parse(u):u
      if(!uObj) continue
      if(String(uObj.phone||'').includes(raw) || normalizePhone(uObj.phone||'').includes(normalizePhone(raw)) || String(uObj.userId||'').toLowerCase()===low) return uObj
    }
    return null
  }
  const u = await redis.get(`${P}user:${userId}`)
  if(!u) return null
  return typeof u==='string'? parse(u):u
}

const getUgToday = () => {
  const d = new Date(new Date().toLocaleString('en-US', { timeZone: 'Africa/Kampala' }));
  return `${d.getDate()}/${d.getMonth()+1}/${d.getFullYear()}`;
};
const getUgTodayISO = () => new Date().toLocaleDateString('en-CA', { timeZone: 'Africa/Kampala' })

export async function POST(req){
  try{
    const { userId, phone } = await req.json();
    const query = userId || phone
    if(!query) return NextResponse.json({success:false},{status:400});

    const user = await getUserByQuery(query);
    if(!user) return NextResponse.json({success:false, message:'User not found '+query},{status:404});

    const txList = await redis.lrange(`${P}tx:${user.userId}`,0,-1);
    const txs = txList.map(s=>{ try{ return typeof s==='string'?JSON.parse(s):s }catch{ return null }}).filter(Boolean);

    const todayStr = getUgToday();
    const todayISO = getUgTodayISO();
    
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
        // exclude registration bonus 1000 from power deposited
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

      // FIXED: count ALL yield formats - 'Stake Yield' AND 'stake_yield'
      if((typeLow.includes('yield') || typeLow.includes('profit')) && status==='success'){
        totalStakeYield += amt;
        const dStr = (tx.dateStr || tx.date || tx.createdAt || tx.fullDate || '').toString();
        if(dStr.startsWith(todayStr) || dStr.includes(todayISO) || String(tx.ugandaDate||'').includes(todayStr)){
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

    // AUTO-REPAIR old users - if totalBalance never included yields
    let totalBalance = Number(user.totalBalance||user.balance||0)
    const sumIncome = totalPowerDeposited + totalStakeYield + totalTeamCommission + totalTurboExchangeUGX + 1000
    if(totalBalance < sumIncome && sumIncome > 1000){
      totalBalance = sumIncome
      user.totalBalance = totalBalance
      user.balance = totalBalance
      user.availableBalance = totalBalance
      await redis.set(`${P}user:${user.userId}`, user)
      await redis.hset(`riot:user:${user.userId}`, { balance: totalBalance, totalBalance })
    }

    return NextResponse.json({
      success:true,
      user: { ...user, totalBalance, balance: totalBalance },
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
    });

  }catch(e){
    console.error(e);
    return NextResponse.json({success:false, message:e.message},{status:500});
  }
}