export const runtime='nodejs';
export const dynamic='force-dynamic';
import { NextResponse } from 'next/server';
import { Redis } from '@upstash/redis';
const redis = Redis.fromEnv();
const P = 'rp:';

const getUgToday = () => {
  const d = new Date(new Date().toLocaleString('en-US', { timeZone: 'Africa/Kampala' }));
  return `${d.getDate()}/${d.getMonth()+1}/${d.getFullYear()}`;
};

export async function POST(req){
  try{
    const { userId } = await req.json();
    if(!userId) return NextResponse.json({success:false},{status:400});

    const user = await redis.get(`${P}user:${userId}`);
    if(!user) return NextResponse.json({success:false, message:'User not found'},{status:404});

    const txList = await redis.lrange(`${P}tx:${userId}`,0,-1);
    const txs = txList.map(s=>{ try{ return typeof s==='string'?JSON.parse(s):s }catch{ return null }}).filter(Boolean);

    const todayStr = getUgToday();
    
    let totalPowerDeposited = 0;
    let totalWithdraw = 0;
    let totalStake = 0;
    let totalStakeYield = 0;
    let todaysYield = 0;
    let totalTeamCommission = 0;
    let totalTurboWattsEarned = 0;
    let totalTurboExchangeUGX = 0;

    for(const tx of txs){
      const type = (tx.type||'').toString();
      const typeLow = type.toLowerCase();
      const status = (tx.status||'').toLowerCase();
      const amt = Number(tx.amount||0);
      
      // 1. DEPOSIT - from your deposit route: type='deposit'
      if(typeLow==='deposit' && (status==='success' || status==='approved')){
        totalPowerDeposited += amt;
      }

      // 2. WITHDRAW - from your withdraw route: type='withdraw', you store originalAmount = full, amount = receive
      if(typeLow==='withdraw'){
        // count pending+success because you deduct immediately
        if(status==='pending' || status==='success' || status==='approved'){
          const full = Number(tx.originalAmount || tx.amount || 0);
          totalWithdraw += full;
        }
      }

      // 3. STAKE - from stake route: type='Stake'
      if(type==='Stake' && status==='success'){
        totalStake += amt;
      }

      // 4. STAKE YIELD - from yield route: type='Stake Yield'
      if(type==='Stake Yield' && status==='success'){
        totalStakeYield += amt;
        // Today's yield: dateStr format "D/M/YYYY HH:MM" - check startsWith today
        const dStr = (tx.dateStr || tx.date || tx.createdAt || '').toString();
        if(dStr.startsWith(todayStr)){
          todaysYield += amt;
        }
      }

      // 5. TEAM COMMISSION - from stake route: team_a_payout, team_b_payout, team_c_payout
      if(typeLow.includes('team_') && typeLow.includes('payout') && status==='success'){
        totalTeamCommission += amt;
      }

      // 6a. TURBO WATTS - type='turbocharge' amount=2 watts
      if(typeLow==='turbocharge' && status==='success'){
        totalTurboWattsEarned += Number(tx.power || tx.amount || 0);
      }

      // 6b. TURBO EXCHANGE UGX - type='Turbocharge Exchange'
      if(typeLow==='turbocharge exchange' && status==='success'){
        totalTurboExchangeUGX += amt;
      }
    }

    // Also get turbo power from turbocharge key (invite 0.25W)
    let turboKey = await redis.get(`${P}turbocharge:${userId}`);
    const dbTurboPower = Number(turboKey?.totalPower || user.totalChargePower || 0);
    if(dbTurboPower>0 && totalTurboWattsEarned===0){
      totalTurboWattsEarned = dbTurboPower + totalTurboExchangeUGX/1000; // earned = remaining + exchanged
    }

    return NextResponse.json({
      success:true,
      user,
      totals:{
        totalPowerDeposited, // Mine: Total Power Deposited
        totalWithdraw, // Mine: Total Withdraw (originalAmount)
        totalStake, // Mine: Total Stake
        totalStakeYield, // Mine: Total Stake Yield
        todaysYield, // Mine: Today's Yield
        totalTeamCommission, // Mine: Total Team Commission
        totalTurboWattsEarned, // Mine: Total Turbo Watts Earned
        totalTurboExchangeUGX, // Mine: Total Turbo Exchange UGX
        totalChargePower: dbTurboPower, // current remaining W
        totalBalance: Number(user.totalBalance||0),
        availableBalance: Number(user.availableBalance||0),
        balance: Number(user.balance||0)
      }
    });

  }catch(e){
    console.error(e);
    return NextResponse.json({success:false, message:e.message},{status:500});
  }
}