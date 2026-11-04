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
    for(const id of all.slice(0,500)){
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

export async function POST(req){
  try{
    const { userId, phone } = await req.json().catch(()=>({}));
    const query = userId || phone;
    if(!query) return NextResponse.json({success:true, stakes:[]});

    const user = await getUserByQuery(query);
    if(!user) return NextResponse.json({success:true, stakes:[]});

    const uid = user.userId;
    const raw = await redis.lrange(`${P}stakes:${uid}`, 0, -1);
    
    const stakes = raw.map(s => {
      try { return typeof s === 'string' ? JSON.parse(s) : s; } 
      catch { return null; }
    }).filter(Boolean);

    return NextResponse.json({success:true, stakes}, {headers:{'Cache-Control':'no-store'}});
  }catch(e){
    return NextResponse.json({success:false, stakes:[], error:e.message},{status:500});
  }
}