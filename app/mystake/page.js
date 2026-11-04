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
    try { const u = JSON.parse(localStorage.getItem('riot_user') || '{}'); return u.userId || u.id || ''; } catch { return ''; }
  };
  const getUgDateStr = () => new Date().toLocaleDateString('en-CA', { timeZone: 'Africa/Kampala' });

  // FIXED: Day count based on DATE not collection
  const calcDayCount = (ugStakedDate) => {
    if(!ugStakedDate) return 0;
    try {
      const start = new Date(ugStakedDate);
      const today = new Date(getUgDateStr());
      const diff = Math.floor((today - start) / 86400000);
      return Math.min(Math.max(diff, 0), 180);
    } catch { return 0; }
  };

  const loadStakes = async () => {
    const uid = getStableUserId();
    if(!uid) return;
    const res = await fetch("/api/my-stake", { method:"POST", headers:{"Content-Type":"application/json"}, body:JSON.stringify({ userId: uid }) });
    const d = await res.json();
    if(d.success){
      const raw = Array.isArray(d.stakes) ? d.stakes : [];
      setMyStakes({ 
        daily: raw.filter(s=> (s.tab||'daily')==='daily'), 
        weekend: raw.filter(s=> s.tab==='weekend'), 
        hourly: raw.filter(s=> s.tab==='hourly') 
      });
    }
  };

  useEffect(() => { loadStakes(); }, []);
  
  // Midnight reset every 60s - gold button at 00:00 Kampala
  useEffect(() => {
    const i = setInterval(() => loadStakes(), 60000);
    return () => clearInterval(i);
  }, []);

  const hasCollectedToday = (item) => item?.lastClaimDate === getUgDateStr();

  const handleReceiveClick = (item, idx) => {
    if (calcDayCount(item.ugStakedDate) >= 180) return;
    if (hasCollectedToday(item)) return;
    setCollectItem(item); setCollectIndex(idx); setShowCollect(true);
  };

  const confirmCollect = async () => {
    if(!collectItem) return;
    const uid = getStableUserId();
    try {
      // SECURE: Only send stakeId, backend knows daily from powerLabel
      const res = await fetch("/api/claim-yield", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: uid, stakeId: collectItem.id })
      });
      const data = await res.json();
      if (!res.ok || !data.success) { alert(data.message||"Claim failed"); setShowCollect(false); return; }
      if (data.user) localStorage.setItem("riot_user", JSON.stringify(data.user));
      await loadStakes();
    } catch {}
    setShowCollect(false);
  };

  const currentList = myStakes[tab] || [];
  return (
    <div className="min-h-screen w-full bg-[#141414] flex flex-col pb-[110px]">
      {/* ... your same JSX ... */}
      {currentList.map((item, idx) => {
        const real = REAL_STAKE_LIST[item.powerLabel || item.power] || {};
        const dayCount = calcDayCount(item.ugStakedDate); // 1/180 even if not collected
        const collectedToday = hasCollectedToday(item);
        const isExpired = dayCount >= 180;
        const isReady = !isExpired && !collectedToday;
        return (
          <div key={item.id} className="w-full bg-[#181B22] border border-[#EBA043]/20 rounded-[16px] p-3 flex gap-3">
            {/* ... same ... */}
            <button onClick={() => handleReceiveClick(item, idx)} disabled={!isReady} className={`w-full h-[36px] rounded-[10px] font-extrabold text-[11px] ${isExpired ? "bg-red-900/50 text-white/40" : collectedToday ? "bg-[#3a3a3a] text-white/60" : "bg-[#EBA043] text-black"}`}>
              {isExpired ? "Expired" : collectedToday ? "All done for today" : "Receive Today's Yield"}
            </button>
            {/* Countdown now uses dayCount not collectedDays */}
            <span className="text-[#EBA043] font-extrabold text-[11px]">{dayCount}/180</span>
          </div>
        )
      })}
    </div>
  );
}