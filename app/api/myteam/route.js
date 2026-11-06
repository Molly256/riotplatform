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

    let teamAIds = [];
    let teamBIds = [];
    let teamCIds = [];

    // LAG FIX ONLY: fetch A/B/C together
    try {
      const [a, b, c] = await Promise.all([
        redis.smembers(`${P}team:${userId}:A`),
        redis.smembers(`${P}team:${userId}:B`),
        redis.smembers(`${P}team:${userId}:C`),
      ]);
      if(a?.length) teamAIds = a;
      if(b?.length) teamBIds = b;
      if(c?.length) teamCIds = c;
    } catch {}

    // Fallback: find all users where parent is userId (for old data) - SAME LOGIC
    if(teamAIds.length===0){
      try{
        const keys = await redis.keys(`${P}parent:*`);
        const sliced = keys.slice(0,5000);
        // LAG FIX ONLY: mget instead of get one-by-one, same slice
        if(sliced.length){
          const vals = await redis.mget(...sliced);
          sliced.forEach((k, i) => {
            const p = vals[i];
            if(String(p)===String(userId)){
              const childId = k.replace(`${P}parent:`, '');
              teamAIds.push(childId);
            }
          });
        }
      }catch{}
    }

    // Build Team B (children of Team A) - SAME LOGIC
    if(teamBIds.length===0 && teamAIds.length>0){
      // LAG FIX ONLY: get all B children in parallel
      const allBChildren = await Promise.all(
        teamAIds.map(aId => redis.smembers(`${P}team:${aId}:A`).catch(()=>[]))
      );
      let needFallback = false;
      allBChildren.forEach((bChildren) => {
        if(bChildren?.length){
          for(const bc of bChildren) if(!teamBIds.includes(bc)) teamBIds.push(bc);
        } else {
          needFallback = true;
        }
      });
      // SAME fallback as before, but done ONCE not per member
      if(needFallback){
        try{
          const keys = await redis.keys(`${P}parent:*`);
          const sliced = keys.slice(0,2000);
          if(sliced.length){
            const vals = await redis.mget(...sliced);
            sliced.forEach((k, i) => {
              const p = vals[i];
              if(teamAIds.includes(String(p))){
                const childId = k.replace(`${P}parent:`, '');
                if(!teamBIds.includes(childId)) teamBIds.push(childId);
              }
            });
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

      if(ids.length === 0) return { members, count: ids.length, commission: levelCommission, power: levelPower };

      // LAG FIX ONLY: fetch all users + stakes in parallel, same order
      const pipe = redis.pipeline();
      ids.forEach((mid) => {
        pipe.get(`${P}user:${mid}`);
        pipe.lrange(`${P}stakes:${mid}`,0,-1);
      });
      const results = await pipe.exec();

      for(let idx = 0; idx < ids.length; idx++){
        const mid = ids[idx];
        const user = results[idx*2];
        const stakesRaw = (results[idx*2+1] || []).catch ? [] : (results[idx*2+1] || []);
        // Upstash pipeline returns raw values, handle both shapes
        const stakesList = Array.isArray(stakesRaw) ? stakesRaw : [];
        if(!user) {
          members.push({ userId: String(mid), phone: String(mid), staked: 0, createdAt: null });
          continue;
        }
        let stakedTotal = 0;
        for(const s of stakesList){
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

    // LAG FIX ONLY: A/B/C together, not one-by-one
    const [teamA, teamB, teamC] = await Promise.all([
      buildLevel(teamAIds, 'team_a_payout'),
      buildLevel(teamBIds, 'team_b_payout'),
      buildLevel(teamCIds, 'team_c_payout'),
    ]);

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