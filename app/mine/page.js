"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import BottomNav from "@/components/BottomNav";

export default function MinePage() {
  const [user, setUser] = useState(null);
  const [avatar, setAvatar] = useState(null);
  const [balances, setBalances] = useState({
    totalBalance: 0,
    totalPowerDeposited: 0,
    totalWithdraw: 0,
    todaysYield: 0,
    totalStake: 0,
    totalTeamCommission: 0,
    totalStakeYield: 0,
    totalTurbochargeWatts: 0,
    totalTurbochargeUGX: 0,
    totalTurboWattsEarned: 0,
  });

  useEffect(() => {
    const saved = JSON.parse(localStorage.getItem("currentUser") || localStorage.getItem("user") || "null");
    setUser(saved);
    const av = localStorage.getItem("riot_avatar");
    if (av) setAvatar(av);

    let txs = JSON.parse(localStorage.getItem("transactions") || "[]");

    // === FIX OLD USERS: auto-create registration 1000 if missing ===
    const hasReg = txs.some(t=>{
      const ty = (t.type||"").toLowerCase();
      return ty.includes("regist") || ty.includes("bonus") || ty.includes("reward") || ty.includes("welcome") || ty.includes("signup");
    });
    if(!hasReg){
      const now = new Date();
      const ugDate = `${now.getDate()}/${now.getMonth()+1}/${now.getFullYear()} ${String(now.getHours()).padStart(2,'0')}:${String(now.getMinutes()).padStart(2,'0')}`;
      txs.unshift({ type: "Registration Reward", amount: 1000, date: ugDate, dateObj: now.toISOString(), status: "Success" });
      localStorage.setItem("transactions", JSON.stringify(txs));
      const curBal = parseFloat(localStorage.getItem("totalBalance")||"0");
      if(curBal < 1000){
        localStorage.setItem("totalBalance","1000");
        localStorage.setItem("availableBalance","1000");
      }
    }

    const todayStr = new Date().toLocaleDateString();
    let totalPowerDeposited = 0;
    let totalWithdraw = 0;
    let todaysYield = 0;
    let totalStake = 0;
    let totalTeamCommission = 0;
    let totalStakeYield = 0;
    let totalTurbochargeUGX = 0;
    let totalRegistrationReward = 0;

    txs.forEach(t => {
      const amount = parseFloat(t.amount || 0) || 1000;
      const type = (t.type || "").toLowerCase();
      const date = t.date || "";
      if (type.includes("regist") || type.includes("bonus") || type.includes("reward") || type.includes("signup") || type.includes("welcome")) {
        totalRegistrationReward += amount;
      }
      if (type.includes("deposit") || type.includes("power deposited") || type.includes("recharge")) {
        totalPowerDeposited += amount;
      }
      if (type.includes("withdraw")) totalWithdraw += amount;
      if (type.includes("team") && type.includes("commission")) totalTeamCommission += amount;
      if (type.includes("stake yield") || type.includes("daily yield")) {
        totalStakeYield += amount;
        if (date.includes(todayStr) || (t.dateObj && new Date(t.dateObj).toLocaleDateString() === todayStr)) todaysYield += amount;
      }
      if (date.startsWith(todayStr) && type.includes("yield")) todaysYield += amount;
      if (type.includes("stake") && !type.includes("yield")) totalStake += amount;
      if (type.includes("turbocharge exchange")) totalTurbochargeUGX += amount;
    });

    if (todaysYield === 0) {
      txs.filter(t => t.date && t.date.includes(new Date().getDate() + "/" + (new Date().getMonth()+1))).forEach(t => {
        if ((t.type||"").toLowerCase().includes("yield")) todaysYield += parseFloat(t.amount||0);
      });
    }

    const totalBalanceLS = parseFloat(localStorage.getItem("totalBalance") || "0");
    const availableBalance = parseFloat(localStorage.getItem("availableBalance") || "0");
    const calculatedTotal = totalPowerDeposited + totalTeamCommission + totalStakeYield + totalTurbochargeUGX + totalRegistrationReward;
    let totalBalance = calculatedTotal > 0 ? calculatedTotal : totalBalanceLS;
    if(totalBalance < 1000) totalBalance = 1000;

    const totalChargePower = parseFloat(localStorage.getItem("totalChargePower") || "0");
    const turboHistory = JSON.parse(localStorage.getItem("turboHistory") || "[]");
    const totalTurboWattsEarned = turboHistory.length > 0 ? turboHistory.length * 0.25 : totalChargePower + (totalTurbochargeUGX/1000);

    setBalances({
      totalBalance,
      availableBalance,
      totalPowerDeposited,
      totalWithdraw,
      todaysYield,
      totalStake,
      totalTeamCommission,
      totalStakeYield,
      totalTurbochargeWatts: totalChargePower,
      totalTurbochargeUGX,
      totalTurboWattsEarned,
    });
  }, []);

  const onAvatar = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const rd = new FileReader();
    rd.onload = () => { setAvatar(rd.result); localStorage.setItem("riot_avatar", rd.result); };
    rd.readAsDataURL(file);
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-[#101319] flex items-center justify-center pb-[90px]">
        <div className="text-center"><p className="text-white/60">Not logged in</p><Link href="/login" className="mt-3 inline-block px-6 py-2 rounded-full bg-[#EBA043] text-black font-bold">Login</Link></div><BottomNav />
      </div>
    );
  }

  const items = [
    { label: "Total Balance", value: `${balances.totalBalance.toLocaleString()} UGX` },
    { label: "Total Power Deposited", value: `${balances.totalPowerDeposited.toLocaleString()} UGX` },
    { label: "Total Withdraw", value: `${balances.totalWithdraw.toLocaleString()} UGX` },
    { label: "Today's Yield", value: `${balances.todaysYield.toLocaleString()} UGX` },
    { label: "Total Stake", value: `${balances.totalStake.toLocaleString()} UGX` },
    { label: "Total Team Commission", value: `${balances.totalTeamCommission.toLocaleString()} UGX` },
    { label: "Total Stake Yield", value: `${balances.totalStakeYield.toLocaleString()} UGX` },
    { label: "Total Turbocharge", value: `${balances.totalTurbochargeWatts} W`, sub: `${balances.totalTurbochargeUGX.toLocaleString()} UGX earned` },
  ];

  return (
    <div className="min-h-screen bg-[#101319] pb-[90px] pt-4">
      <h1 className="text-[#EBA043] text-[26px] font-bold text-center mb-5">Mine</h1>
      <div className="mx-3 bg-[#1A1E2A] rounded-[20px] pt-8 pb-5 px-3">
        <div className="flex flex-col items-center">
          <label className="relative cursor-pointer">
            <input type="file" accept="image/*" className="hidden" onChange={onAvatar} />
            <div className="w-[88px] h-[88px] rounded-full border-[1.5px] border-dashed border-white/20 flex items-center justify-center overflow-hidden bg-[#242A3A]">
              {avatar ? <img src={avatar} alt="avatar" className="w-full h-full object-cover" /> : <span className="text-[44px] text-[#EBA043]">+</span>}
            </div>
            <div className="absolute bottom-0 right-0 w-[28px] h-[28px] rounded-full bg-[#EBA043] flex items-center justify-center border-[3px] border-[#1A1E2A]"><span className="text-black font-black text-[14px]">+</span></div>
          </label>
          <h2 className="mt-4 text-[22px] font-bold text-white">{user.username}</h2>
          <p className="mt-1 text-[14px] text-white/50">ID: {user.userId}</p>
        </div>
        <div className="mt-6 grid grid-cols-2 gap-3">
          {items.map((it, i) => (
            <div key={i} className="h-[88px] rounded-[15px] bg-gradient-to-br from-[#EBA043] to-[#F7C978] flex flex-col items-center justify-center px-1">
              <p className="text-[12px] font-bold text-black text-center">{it.label}</p>
              <p className="mt-1 text-[22px] font-black text-black">{it.value}</p>
              {it.sub && <p className="text-[10px] font-bold text-black/60">{it.sub}</p>}
            </div>
          ))}
        </div>
      </div>
      <BottomNav />
    </div>
  );
}