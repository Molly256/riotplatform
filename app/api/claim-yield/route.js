export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
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
      if(String(uObj.phone||'').includes(raw) || normalizePhone(uObj.phone||'').includes(normalizePhone(raw))) return uObj
    }
    return null
  }
  const u = await redis.get(`${P}user:${userId}`)
  if(!u) return null
  return typeof u==='string'? parse(u):u
}

const getUgDMYHM = () => {
  const d = new Date(new Date().toLocaleString('en-US', { timeZone: 'Africa/Kampala' }));
  return `${d.getDate()}/${d.getMonth()+1}/${d.getFullYear()} ${String(d.getHours()).padStart(2,'0')}:${String(d.getMinutes()).padStart(2,'0')}`;
};
const getUgDate = () => new Date().toLocaleDateString('en-CA', { timeZone: 'Africa/Kampala' })
const getUgDateTime = () => new Date().toLocaleString('en-CA', { timeZone: 'Africa/Kampala', hour12:false }).replace(',','').slice(0,19)

export async function POST(req){
  try{
    const { userId, phone, amount, power } = await req.json();
    const query = userId || phone
    if(!query || !amount) return NextResponse.json({ success:false, message:'Missing' }, {status:400});
    
    const user = await getUserByQuery(query);
    if(!user) return NextResponse.json({ success:false, message:'User not found '+query }, {status:404});
    
    const amt = Number(String(amount).replace(/,/g,''));

    // ADD TO ALL BALANCE FIELDS
    user.balance = Number(user.balance||0)+amt;
    user.availableBalance = Number(user.availableBalance||0)+amt;
    user.totalBalance = Number(user.totalBalance||0)+amt;
    await redis.set(P+'user:'+user.userId, user);

    // sync riot:user:{id} - FIXED to update totalBalance too
    try{
      await redis.hset(`riot:user:${user.userId}`, { 
        balance: user.totalBalance, 
        totalBalance: user.totalBalance,
        availableBalance: user.totalBalance 
      })
      await redis.set(`riot:user:${user.userId}:balance`, user.totalBalance)
      await redis.set(`riot:user:${user.userId}:totalBalance`, user.totalBalance)
    }catch{}

    const dateStr = getUgDMYHM();
    const nowISO = new Date().toISOString()
    const tx = {
      id: `yield_${Date.now()}`,
      type: 'stake_yield', // lowercase contains yield - Mine API counts it
      label: 'Stake Yield',
      header: 'Stake Yield',
      title: 'Stake Yield',
      power,
      amount: amt,
      status: 'success',
      date: dateStr,
      dateStr: getUgDateTime(),
      fullDate: nowISO,
      createdAt: nowISO,
      display: `Yield ${power} +${amt.toLocaleString()} UGX`,
      timestamp: Date.now(),
      phone: user.phone,
      userId: user.userId,
      ugandaDate: getUgDate()
    };
    await redis.lpush(P+'tx:'+user.userId, JSON.stringify(tx));
    await redis.lpush(P+'tx:history:'+user.userId, JSON.stringify(tx));
    await redis.lpush(P+'transactions:'+user.userId, JSON.stringify(tx));
    await redis.lpush(P+'tx:'+user.phone+':'+getUgDate(), JSON.stringify(tx));

    return NextResponse.json({ success:true, user, tx });
  }catch(e){ 
    console.error(e);
    return NextResponse.json({ success:false, message:e.message }, {status:500})
  }
}