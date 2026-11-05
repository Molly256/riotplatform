"use client";
import { useState, useEffect } from "react";
import BottomNav from "@/components/BottomNav";

export default function MyStakePage() {
  const [tab, setTab] = useState("daily");
  const [myStakes, setMyStakes] = useState({ daily: [], weekend: [], hourly: [] });
  const [showCollect, setShowCollect] = useState(false);
  const [collectItem, setCollectItem] = useState(null);
  const [isCollecting, setIsCollecting] = useState(false);
  const [successMsg, setSuccessMsg] = useState(null);

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
    try { const u = JSON.parse(localStorage.getItem('riot_user') || '{}'); return u.userId || u.id || u.phone || ''; } catch { return ''; }
  };
  const getUgDateStr = () => new Date().toLocaleDateString('en-CA', { timeZone: 'Africa/Kampala' });
  const getUgDateGB = () => new Date().toLocaleDateString('en-GB', { timeZone: 'Africa/Kampala' });

  // FIXED: +1 so stake day = 1/180, midnight Kampala = 2/180, never affected by claim
  const calcDayCount = (ugStakedDate) => {
    if(!ugStakedDate) return 1;
    try {
      const parts = ugStakedDate.split('-');
      if(parts.length !== 3) return 1;
      const [y,m,d] = parts.map(Number);
      const startUTC = Date.UTC(y, m-1, d);
      const todayStr = getUgDateStr();
      const [ty,tm,td] = todayStr.split('-').map(Number);
      const todayUTC = Date.UTC(ty, tm-1, td);
      const diff = Math.floor((todayUTC - startUTC) / 86400000);
      return Math.min(Math.max(diff + 1, 1), 180);
    } catch { return 1; }
  };

  const hasCollectedToday = (item) => {
    if(!item?.lastClaimDate) return false;
    const todayCA = getUgDateStr();
    const todayGB = getUgDateGB();
    const last = String(item.lastClaimDate);
    return last === todayCA || last === todayGB || last.includes(todayCA) || last.includes(todayGB);
  };

  const loadStakes = async () => {
    const uid = getStableUserId();
    if(!uid) return;
    try{
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
    }catch(e){ console.error(e); }
  };

  useEffect(() => { loadStakes(); const i = setInterval(() => loadStakes(), 60000); return () => clearInterval(i); }, []);
  
  const handleReceiveClick = (item) => {
    if (calcDayCount(item.ugStakedDate) > 180) return;
    if (hasCollectedToday(item)) return;
    setCollectItem(item); setShowCollect(true);
  };

  const confirmCollect = async () => {
    if(!collectItem || isCollecting) return;
    setIsCollecting(true);
    const uid = getStableUserId();
    try {
      const res = await fetch("/api/claim-yield", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: uid, stakeId: collectItem.id })
      });
      const data = await res.json();
      if (!res.ok || !data.success) { alert(data.message||"Claim failed"); setShowCollect(false); setIsCollecting(false); return; }
      if (data.user) localStorage.setItem("riot_user", JSON.stringify(data.user));
      await loadStakes();
      setShowCollect(false);
      setSuccessMsg(`Yield collection successful! +${(data.daily||data.tx?.amount||0).toLocaleString()} UGX`);
      setTimeout(()=> setSuccessMsg(null), 3000);
    } catch(e){ alert("Network error, try again"); }
    setIsCollecting(false);
  };

  const currentList = myStakes[tab] || [];
  const tabBtn = (key,label) => (
    <button key={key} onClick={()=>setTab(key)} className={`flex-1 h-[48px] rounded-full text-[15px] font-bold transition ${tab===key?"bg-[#EBA043] text-black shadow":"bg-[#232323] text-white/80"}`}>{label}</button>
  );

  return (
    <div className="min-h-screen w-full bg-[#141414] flex flex-col pb-[110px]">
      {/* FIXED: Medium-long tabs, full width */}
      <div className="flex gap-2 p-4">
        {tabBtn("daily","Daily")}
        {tabBtn("weekend","Weekend")}
        {tabBtn("hourly","Hourly")}
      </div>

      <div className="px-4 flex flex-col gap-3">
        {currentList.length===0 && <div className="text-white/50 text-center py-20">No generators in {tab}. Buy in Shop.</div>}
        {currentList.map((item, idx) => {
          const real = REAL_STAKE_LIST[item.powerLabel || item.power] || { daily: item.daily || 0, stakePower: 0, img: "" };
          const dayCount = calcDayCount(item.ugStakedDate);
          const collectedToday = hasCollectedToday(item);
          const isExpired = dayCount > 180;
          const isReady = !isExpired && !collectedToday;
          return (
            <div key={item.id || idx} className="w-full bg-[#181B22] border border-[#EBA043]/20 rounded-[16px] p-3 flex gap-3">
              <img src={real.img} alt="" className="w-[70px] h-[70px] rounded object-cover bg-[#222]" />
              <div className="flex-1 flex flex-col gap-1">
                <div className="text-white font-bold text-[13px]">{item.powerLabel || item.power} Generator</div>
                <div className="text-white/60 text-[11px]">Daily: {(item.daily || real.daily || 0).toLocaleString()} UGX</div>
                <div className="flex items-center justify-between mt-1">
                  <span className="text-[#EBA043] font-extrabold text-[11px]">{dayCount}/180</span>
                  <span className="text-white/40 text-[10px]">{item.ugStakedDate || ""}</span>
                </div>
                <button onClick={() => handleReceiveClick(item)} disabled={!isReady} className={`w-full h-[36px] mt-2 rounded-[10px] font-extrabold text-[11px] ${isExpired ? "bg-red-900/50 text-white/40" : collectedToday ? "bg-[#3a3a3a] text-white/60" : "bg-[#EBA043] text-black"}`}>
                  {isExpired ? "Expired" : collectedToday ? "All done for today" : "Receive Today's Yield"}
                </button>
              </div>
            </div>
          )
        })}
      </div>

      {successMsg && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-[60] bg-green-600 text-white font-bold text-[13px] px-4 py-3 rounded-full shadow-lg">{successMsg}</div>
      )}

      {showCollect && (
        <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4">
          <div className="bg-[#1E1E1E] rounded-[16px] p-5 w-full max-w-[320px]">
            <div className="text-white font-bold text-center mb-4">Collect {collectItem?.powerLabel} yield?</div>
            <div className="flex gap-3">
              <button onClick={()=>setShowCollect(false)} disabled={isCollecting} className="flex-1 h-[44px] bg-[#333] text-white rounded">Cancel</button>
              <button onClick={confirmCollect} disabled={isCollecting} className="flex-1 h-[44px] bg-[#EBA043] text-black font-bold rounded">{isCollecting ? "Collecting..." : "Confirm"}</button>
            </div>
          </div>
        </div>
      )}

      <BottomNav active="mystake" />
    </div>
  );
}