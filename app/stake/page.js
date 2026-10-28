"use client";
import { useState } from "react";
import BottomNav from "@/components/BottomNav";

export default function StakingPage() {
  const [active, setActive] = useState("stake");
  const [tab, setTab] = useState("daily");

  const stakeList = [
    { img: "/p1.jpg",  power: "1W",     stakePower: 20000,  daily: 1000,  total: 180000,  period: "180 Days" },
    { img: "/p2.jpg",  power: "1.5W",   stakePower: 36000,  daily: 1500,  total: 270000,  period: "180 Days" },
    { img: "/p3.jpg",  power: "1.7W",   stakePower: 50000,  daily: 1700,  total: 306000,  period: "180 Days" },
    { img: "/p4.jpg",  power: "2.5W",   stakePower: 100000, daily: 2500,  total: 450000,  period: "180 Days" },
    { img: "/p5.jpg",  power: "3.0W",   stakePower: 180000, daily: 3000,  total: 540000,  period: "180 Days" },
    { img: "/p6.jpg",  power: "3.5kW",  stakePower: 250000, daily: 3500,  total: 630000,  period: "180 Days" },
    { img: "/p7.jpg",  power: "4.5kW",  stakePower: 350000, daily: 4500,  total: 810000,  period: "180 Days" },
    { img: "/p8.jpg",  power: "5.8kW",  stakePower: 500000, daily: 5800,  total: 1044000, period: "180 Days" },
    { img: "/p9.jpg",  power: "8.0kW",  stakePower: 780000, daily: 8000,  total: 1440000, period: "180 Days" },
    { img: "/p10.jpg", power: "10.0kW", stakePower: 980000, daily: 10000, total: 1800000, period: "180 Days" },
    { img: "/p11.jpg", power: "14.0MW", stakePower: 1500000,daily: 14000, total: 2520000, period: "180 Days" },
    { img: "/p12.jpg", power: "26.0MW", stakePower: 3000000,daily: 26000, total: 4680000, period: "180 Days" },
    { img: "/p13.jpg", power: "40.0MW", stakePower: 5000000,daily: 40000, total: 7200000, period: "180 Days" },
  ];

  return (
    <div className="min-h-screen w-full bg-[#141414] flex flex-col pb-[110px]">
      <div className="w-full pt-8 pb-6">
        <h1 className="text-white text-[38px] font-extrabold text-center">Staking</h1>
      </div>

      <div className="w-full px-3 flex gap-2 mb-5">
        <button onClick={() => setTab("daily")} className={`flex-1 h-[44px] rounded-[14px] font-bold text-[13px] ${tab === "daily" ? "bg-[#EBA043] text-black" : "bg-[#EBA043]/60 text-black/80"}`}>Daily Yield Staking</button>
        <button onClick={() => setTab("weekend")} className={`flex-1 h-[44px] rounded-[14px] font-bold text-[13px] ${tab === "weekend" ? "bg-[#EBA043] text-black" : "bg-[#EBA043]/60 text-black/80"}`}>Weekend Staking</button>
        <button onClick={() => setTab("hourly")} className={`flex-1 h-[44px] rounded-[14px] font-bold text-[13px] ${tab === "hourly" ? "bg-[#EBA043] text-black" : "bg-[#EBA043]/60 text-black/80"}`}>Hourly Staking</button>
      </div>

      {tab === "daily" && (
        <div className="w-full px-3 flex flex-col gap-4">
          {stakeList.map((item, idx) => (
            <div key={idx} className="w-full bg-[#181B22] border border-[#EBA043]/40 rounded-[16px] p-3 flex gap-3">
              <div className="w-[135px] shrink-0">
                <div className="w-full h-[145px] bg-black rounded-[12px] overflow-hidden border border-[#EBA043]/20 relative">
                  <img src={item.img} alt="" className="w-full h-full object-cover" />
                  <div className="absolute top-[6px] left-[6px] bg-black/80 border border-[#EBA043]/60 text-[#EBA043] text-[11px] font-extrabold px-2 py-1 rounded-[8px]">{item.power}</div>
                </div>
              </div>
              <div className="flex-1 flex flex-col justify-between">
                <div>
                  <p className="text-white font-bold text-[13px]">💰 Stake Power {item.stakePower.toLocaleString()} UGX</p>
                  <div className="mt-2.5 flex flex-col gap-2">
                    <div className="flex justify-between"><span className="text-white/60 text-[12px]">📅 Staking Period</span><span className="text-white font-semibold text-[12px]">{item.period}</span></div>
                    <div className="flex justify-between"><span className="text-white/60 text-[12px]">📈 Daily Yield</span><span className="text-white font-semibold text-[12px]">{item.daily.toLocaleString()} UGX</span></div>
                    <div className="flex justify-between"><span className="text-white/60 text-[12px]">✨ Total Yield</span><span className="text-white font-semibold text-[12px]">{item.total.toLocaleString()} UGX</span></div>
                    <div className="flex justify-between"><span className="text-white/60 text-[12px]">🛡️ Stake Limit</span><span className="text-white font-semibold text-[12px]">1x</span></div>
                  </div>
                </div>
                <button className="w-full mt-3 h-[36px] bg-[#EBA043] rounded-[10px] text-black font-extrabold text-[13px]">STAKE POWER</button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* WEEKEND - Coming soon orange gold */}
      {tab === "weekend" && (
        <div className="w-full flex-1 flex items-center justify-center mt-20">
          <h2 className="text-[#EBA043] text-[24px] font-extrabold tracking-wide">Coming soon......</h2>
        </div>
      )}

      {/* HOURLY - Coming soon orange gold */}
      {tab === "hourly" && (
        <div className="w-full flex-1 flex items-center justify-center mt-20">
          <h2 className="text-[#EBA043] text-[24px] font-extrabold tracking-wide">Coming soon......</h2>
        </div>
      )}

      <BottomNav active={active} setActive={setActive} />
    </div>
  );
}