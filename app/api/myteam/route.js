export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import { Redis } from '@upstash/redis';

const redis = Redis.fromEnv();
const P = 'rp:';

export async function POST(req) {
  try {
    const { userId } = await req.json();
    if (!userId) return NextResponse.json({ success: false, message: 'userId required' }, { status: 400 });

    const levels = [
      { key: 'A', prefix: `${P}team:${userId}:A`, commType: 'team_a_payout' },
      { key: 'B', prefix: `${P}team:${userId}:B`, commType: 'team_b_payout' },
      { key: 'C', prefix: `${P}team:${userId}:C`, commType: 'team_c_payout' },
    ];

    let totalCommission = 0;
    let totalPower = 0;
    const result = {};

    const allTxRaw = await redis.lrange(`${P}tx:${userId}`, 0, 1000);
    const allTx = allTxRaw.map(t => {
      try { return typeof t === 'string' ? JSON.parse(t) : t; } catch { return null; }
    }).filter(Boolean);

    for (const lvl of levels) {
      const memberIds = await redis.smembers(lvl.prefix);
      let levelPower = 0;
      let levelCommission = 0;
      const members = [];

      for (const tx of allTx) {
        if (tx.type === lvl.commType) levelCommission += Number(tx.amount || 0);
      }

      for (const mid of memberIds) {
        const user = await redis.get(`${P}user:${mid}`);
        if (!user) continue;

        const stakesRaw = await redis.lrange(`${P}stakes:${mid}`, 0, -1);
        let stakedTotal = 0;
        if (stakesRaw && stakesRaw.length) {
          for (const s of stakesRaw) {
            try {
              const obj = typeof s === 'string' ? JSON.parse(s) : s;
              stakedTotal += Number(obj.stakePower || obj.amount || obj.power || 0);
            } catch {}
          }
        }

        levelPower += stakedTotal;

        members.push({
          userId: String(mid),
          phone: user.phone || String(mid),
          staked: stakedTotal,
        });
      }

      result[lvl.key] = {
        count: memberIds.length,
        members,
        commission: levelCommission,
        power: levelPower,
      };

      totalCommission += levelCommission;
      totalPower += levelPower;
    }

    return NextResponse.json({
      success: true,
      teamA: result.A,
      teamB: result.B,
      teamC: result.C,
      totalCommission,
      totalPower,
    });

  } catch (err) {
    return NextResponse.json({ success: false, message: err.message }, { status: 500 });
  }
}