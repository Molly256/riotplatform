export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import { Redis } from '@upstash/redis';
const redis = Redis.fromEnv();
const P = 'rp:';

export async function POST(req) {
  try {
    const { userId } = await req.json();
    if (!userId) return NextResponse.json({ success: false }, { status: 400 });

    // Get all users who have parent = userId (Team A direct invites)
    // Scan approach - use your existing parent keys + team keys
    let teamAIds = [];
    let teamBIds = [];
    let teamCIds = [];

    // Try new team keys first
    try {
      const a = await redis.smembers(`${P}team:${userId}:A`);
      if(a?.length) teamAIds = a;
      const b = await redis.smembers(`${P}team:${userId}:B`);
      if(b?.length) teamBIds = b;
      const c = await redis.smembers(`${P}team:${userId}:C`);
      if(c?.length) teamCIds = c;
    } catch {}

    // Fallback: find all users where parent is userId (for old data)
    if(teamAIds.length===0){
      try{
        // Get all parent keys (expensive but ok for small)
        const keys = await redis.keys(`${P}parent:*`);
        for(const k of keys.slice(0,5000)){
          const p = await redis.get(k);
          if(String(p)===String(userId)){
            const childId = k.replace(`${P}parent:`, '');
            teamAIds.push(childId);
          }
        }
      }catch{}
    }

    // Build Team B (children of Team A)
    if(teamBIds.length===0 && teamAIds.length>0){
      for(const aId of teamAIds){
        try{
          const bChildren = await redis.smembers(`${P}team:${aId}:A`).catch(()=>[]);
          if(bChildren?.length){
            for(const bc of bChildren) if(!teamBIds.includes(bc)) teamBIds.push(bc);
          } else {
            // fallback via parent scan for B
            const keys = await redis.keys(`${P}parent:*`);
            for(const k of keys.slice(0,2000)){
              const p = await redis.get(k);
              if(teamAIds.includes(String(p))){
                const childId = k.replace(`${P}parent:`, '');
                if(!teamBIds.includes(childId)) teamBIds.push(childId);
              }
            }
          }
        }catch{}
      }
    }

    const allTxRaw = await redis.lrange(`${P}tx:${userId}`, 0, 1000);
    const allTx = allTxRaw.map(t=>{ try{ return typeof t==='string'?JSON.parse(t):t }catch{ return null }}).filter(Boolean);

    const buildLevel = async (ids, commType) => {
      let levelPower = 0;
      let levelCommission = 0;
      const members = [];
      
      for(const tx of allTx) if(tx.type===commType) levelCommission += Number(tx.amount||0);

      for(const mid of ids){
        const user = await redis.get(`${P}user:${mid}`);
        if(!user) {
          members.push({ userId: String(mid), phone: String(mid), staked: 0, createdAt: null });
          continue;
        }
        const stakesRaw = await redis.lrange(`${P}stakes:${mid}`,0,-1).catch(()=>[]);
        let stakedTotal = 0;
        for(const s of stakesRaw){
          try{ const o=typeof s==='string'?JSON.parse(s):s; stakedTotal+=Number(o.stakePower||o.amount||o.power||0); }catch{}
        }
        levelPower+=stakedTotal;
        members.push({
          userId: String(mid),
          phone: user.phone || String(mid),
          staked: stakedTotal,
          createdAt: user.createdAt || user.joinedAt || null,
          username: user.username || ''
        });
      }
      return { members, count: ids.length, commission: levelCommission, power: levelPower };
    };

    const teamA = await buildLevel(teamAIds, 'team_a_payout');
    const teamB = await buildLevel(teamBIds, 'team_b_payout');
    const teamC = await buildLevel(teamCIds, 'team_c_payout');

    // Turbo power calc: 0.25W per Team A member (even without stake)
    const turboPower = teamA.count * 0.25;

    return NextResponse.json({
      success: true,
      teamA: { ...teamA, members: teamA.members.map(m=>({...m, watts:0.25})) },
      teamB,
      teamC,
      totalCommission: teamA.commission + teamB.commission + teamC.commission,
      totalPower: teamA.power + teamB.power + teamC.power,
      turboPower,
    });

  } catch (err) {
    console.error(err);
    return NextResponse.json({ success: false, message: err.message }, { status: 500 });
  }
}