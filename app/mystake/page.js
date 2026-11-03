"use client";
import { useState, useEffect } from "react";
import BottomNav from "@/components/BottomNav";

export default function MyStakePage() {
  const [active, setActive] = useState("mystake");
  const [tab, setTab] = useState("daily");
  const [myStakes, setMyStakes] = useState({ daily: [], weekend: [], hourly: [] });
  const [showCollect, setShowCollect] = useState(false);
  const [collectItem, setCollectItem] = useState(null);
  const [collectIndex, setCollectIndex] = useState(null);
  const [nowTick, setNowTick] = useState(Date.now());

  const REAL_STAKE_LIST = {
    "1W": { stakePower: 20000, daily: 1000, img: "/p1.jpg" },
    "1.5W": { stakePower: 36000, daily: 1500, img: "/p2.jpg" },
    "1.7W": { stakePower: 50000, daily: 1700, img: "/p3.jpg" },
    "2.5W": { stakePower: 100000, daily: 2500, img: "/p4.jpg" },
    "3.0W": { stakePower: 180000, daily: 3000, img: "/p5.jpg" },
    "3.5kW": { stakePower: 250000, daily: 3500, img: "/p6.jpg" },
    "4.5kW": { stakePower: 350000, daily: 4500, img: "/p7.jpg" },
    "5.8kW": { stakePower: 500000, daily: 5800, img: "/p8.jpg" },
    "8.0kW": { stakePower: 780000, daily: 8000, img: "/p9.jpg" },
    "10.0kW": { stakePower: 980000, daily: 10000, img: "/p10.jpg" },
    "14.0MW": { stakePower: 1500000, daily: 14000, img: "/p11.jpg" },
    "26.0MW": { stakePower: 3000000, daily: 26000, img: "/p12.jpg" },
    "40.0MW": { stakePower: 5000000, daily: 40000, img: "/p13.jpg" },
  };

  const getStableUserId = () => {
    try { const u = JSON.parse(localStorage.getItem('riot_user') || '{}'); return u.userId || ''; } catch { return ''; }
  };
  const getUgDateObj = (d = new Date()) => new Date(d.toLocaleString("en-US", { timeZone: "Africa/Kampala" }));
  const getUgandaDateString = (d = new Date()) => {
    const ug = getUgDateObj(d);
    return `${ug.getFullYear()}-${String(ug.getMonth()+1).padStart(2,'0')}-${String(ug.getDate()).padStart(2,'0')}`;
  };

  useEffect(() => {
    const uid = getStableUserId();
    if(!uid) return;
    fetch("/api/mine", { method:"POST", headers:{"Content-Type":"application/json"}, body:JSON.stringify({ userId: uid }) })
      .then(r=>r.json()).then(d=>{
        if(d.success){
          const rawStakes = d.stakes || [];
          setMyStakes({ daily: rawStakes.filter(s=> (s.tab||'daily')==='daily'), weekend: [], hourly: [] });
          if(d.user) localStorage.setItem("riot_user", JSON.stringify(d.user));
        }
      }).catch(()=>{});
  }, []);

  useEffect(() => {
    const i = setInterval(()=> setNowTick(Date.now()), 60000);
    return ()=> clearInterval(i);
  }, []);

  const hasCollectedTodayUganda = (item) => {
    if (!item.lastClaimDate) return false;
    return item.lastClaimDate === getUgandaDateString(new Date());
  };

  const handleReceiveClick = (item, idx) => {
    if (item.collectedDays >= 180) return;
    if (hasCollectedTodayUganda(item)) return;
    setCollectItem(item);
    setCollectIndex(idx);
    setShowCollect(true);
  };

  const confirmCollect = async () => {
    const uid = getStableUserId();
    try {
      const res = await fetch("/api/claim-yield", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: uid, amount: collectItem.daily, power: collectItem.powerLabel || collectItem.power, stakeId: collectItem.id })
      });
      const data = await res.json();
      if (!res.ok || !data.success) { alert(data.message||"Claim failed"); setShowCollect(false); return; }
      if (data.user) localStorage.setItem("riot_user", JSON.stringify(data.user));
      const updated = [...myStakes.daily];
      updated[collectIndex] = {
        ...updated[collectIndex],
        lastClaimDate: getUgandaDateString(new Date()),
        collectedDays: (updated[collectIndex].collectedDays||0)+1,
      };
      setMyStakes({ ...myStakes, daily: updated });
    } catch {}
    setShowCollect(false);
  };

  const currentList = myStakes[tab] || [];

  return (
    <div className="min-h-screen w-full bg-[#141414] flex flex-col pb-[110px]">
      {/* HEADER - BLACK BG + ORANGE GOLD CAPS */}
      <div className="w-full bg-[#141414] pt-10 pb-6 border-b border-white/10">
        <h1 className="text-[#EBA043] text-[28px] font-black tracking-[1px] text-center uppercase">MY STAKE</h1>
      </div>

      <div className="w-full px-3 flex gap-2 my-5">
        <button onClick={() => setTab("daily")} className={`flex-1 h-[44px] rounded-[14px] font-bold text-[13px] ${tab === "daily" ? "bg-[#EBA043] text-black" : "bg-[#EBA043]/60 text-black/80"}`}>Daily Yield Staking</button>
        <button onClick={() => setTab("weekend")} className={`flex-1 h-[44px] rounded-[14px] font-bold text-[13px] ${tab === "weekend" ? "bg-[#EBA043] text-black" : "bg-[#EBA043]/60 text-black/80"}`}>Weekend Staking</button>
        <button onClick={() => setTab("hourly")} className={`flex-1 h-[44px] rounded-[14px] font-bold text-[13px] ${tab === "hourly" ? "bg-[#EBA043] text-black" : "bg-[#EBA043]/60 text-black/80"}`}>Hourly Staking</button>
      </div>

      <div className="w-full px-3 flex flex-col gap-4">
        {currentList.length === 0 ? (
          <div className="w-full flex flex-col items-center mt-20"><p className="text-white/50 text-[14px]">No staked generators in {tab}</p></div>
        ) : (
          currentList.map((item, idx) => {
            const real = REAL_STAKE_LIST[item.powerLabel || item.power] || item;
            void nowTick;
            const collectedToday = hasCollectedTodayUganda(item);
            const isExpired = (item.collectedDays||0) >= 180;
            const isReady = !isExpired && !collectedToday;
            return (
              <div key={item.id || idx} className="w-full bg-[#181B22] border border-[#EBA043]/20 rounded-[16px] p-3 flex gap-3">
                <div className="w-[125px] shrink-0 flex flex-col gap-2">
                  <div className="w-full h-[135px] bg-black rounded-[12px] overflow-hidden border border-[#EBA043]/20 relative">
                    <img src={real.img || item.img} alt="" className="w-full h-full object-cover" />
                    <div className="absolute top-[6px] left-[6px] bg-black/80 border border-[#EBA043]/60 text-[#EBA043] text-[11px] font-extrabold px-2 py-1 rounded-[8px]">{item.powerLabel || item.power}</div>
                  </div>
                  <button onClick={() => handleReceiveClick(item, idx)} disabled={!isReady} className={`w-full h-[36px] rounded-[10px] font-extrabold text-[11px] ${isExpired ? "bg-red-900/50 text-white/40" : collectedToday ? "bg-[#3a3a3a] text-white/60" : "bg-[#EBA043] text-black"}`}>
                    {isExpired ? "Expired" : collectedToday ? "All done for today" : "Receive Today's Yield"}
                  </button>
                </div>
                <div className="flex-1 flex flex-col justify-start pt-1">
                  <div className="flex flex-col gap-[10px]">
                    <div className="flex justify-between items-center"><span className="text-white/60 text-[11px]">Stake power</span><span className="text-white font-bold text-[11px]">{(real.stakePower || item.stakePower).toLocaleString()} UGX</span></div>
                    <div className="flex justify-between items-center"><span className="text-white/60 text-[11px]">Stake yield</span><span className="text-white font-bold text-[11px]">{(real.daily || item.daily).toLocaleString()} UGX</span></div>
                    <div className="flex justify-between items-center border-t border-white/10 pt-2 mt-1"><span className="text-white/60 text-[11px]">Countdown</span><span className="text-[#EBA043] font-extrabold text-[11px]">{item.collectedDays||0}/180</span></div>
                  </div>
                </div>
              </div>
            )
          })
        )}
      </div>

      {showCollect && collectItem && (
        <div className="fixed inset-0 z-[1000] bg-black/70 flex items-center justify-center px-6">
          <div className="w-full max-w-[320px] bg-black border border-[#EBA043]/60 rounded-[18px] p-6 flex flex-col items-center">
            <p className="text-[#EBA043] text-[14px] font-bold text-center">Collect yield</p>
            <p className="text-[#EBA043] text-[20px] font-extrabold mt-2">💎 {(REAL_STAKE_LIST[collectItem.powerLabel || collectItem.power]?.daily || collectItem.daily).toLocaleString()} UGX</p>
            <p className="text-white/40 text-[11px] mt-1">Day {(collectItem.collectedDays||0)+1}/180</p>
            <div className="flex gap-4 mt-6 w-full">
              <button onClick={confirmCollect} className="flex-1 h-[42px] bg-[#EBA043] rounded-[10px] text-black font-extrabold text-[13px]">Collect</button>
              <button onClick={() => setShowCollect(false)} className="flex-1 h-[42px] bg-white/10 rounded-[10px] text-white font-bold text-[13px]">Cancel</button>
            </div>
          </div>
        </div>
      )}
      <BottomNav active={active} setActive={setActive} />
    </div>
  );
}