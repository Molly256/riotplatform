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
    "1W": { stakePower: 20000, daily: 1000 },
    "1.5W": { stakePower: 36000, daily: 1500 },
    "1.7W": { stakePower: 50000, daily: 1700 },
    "2.5W": { stakePower: 100000, daily: 2500 },
    "3.0W": { stakePower: 180000, daily: 3000 },
    "3.5kW": { stakePower: 250000, daily: 3500 },
    "4.5kW": { stakePower: 350000, daily: 4500 },
    "5.8kW": { stakePower: 500000, daily: 5800 },
    "8.0kW": { stakePower: 780000, daily: 8000 },
    "10.0kW": { stakePower: 980000, daily: 10000 },
    "14.0MW": { stakePower: 1500000, daily: 14000 },
    "26.0MW": { stakePower: 3000000, daily: 26000 },
    "40.0MW": { stakePower: 5000000, daily: 40000 },
  };

  // === UGANDA TIME HELPERS (EAT = UTC+3) ===
  const getUgandaDate = (date = new Date()) => {
    return new Date(date.toLocaleString("en-US", { timeZone: "Africa/Kampala" }));
  };
  const getUgandaDateString = (date = new Date()) => {
    const ug = getUgandaDate(date);
    return `${ug.getFullYear()}-${ug.getMonth()+1}-${ug.getDate()}`; // e.g. 2026-5-13
  };
  const isSameUgandaDay = (dateStr1, dateStr2) => {
    return dateStr1 === dateStr2;
  };

  useEffect(() => {
    const saved = JSON.parse(localStorage.getItem("myStakes") || '{"daily":[],"weekend":[],"hourly":[]}');
    const fixed = { ...saved };
    Object.keys(fixed).forEach(tabKey => {
      fixed[tabKey] = fixed[tabKey].map(s => {
        const real = REAL_STAKE_LIST[s.power];
        if (s.collectedDays >= 180) return { ...s, expired: true, countdown: "Expired", daily: real?.daily || s.daily };
        if (real) return { ...s, daily: real.daily, stakePower: real.stakePower, total: real.daily*180, expired: false };
        return s;
      });
    });
    setMyStakes(fixed);
    if (JSON.stringify(fixed) !== JSON.stringify(saved)) localStorage.setItem("myStakes", JSON.stringify(fixed));

    // Tick every minute to auto-unlock at midnight Uganda time
    const interval = setInterval(() => setNowTick(Date.now()), 60000);
    return () => clearInterval(interval);
  }, []);

  const powerFull = (short) => {
    if (!short) return "";
    if (short.includes("MW")) return short.replace("MW", " MegaWatt").replace(".0", "");
    if (short.includes("kW")) return short.replace("kW", " KiloWatt").replace(".0", "");
    if (short.includes("W")) return short.replace("W", " Watt");
    return short;
  };

  // === CHECK IF COLLECTED TODAY IN UGANDA TIME ===
  const hasCollectedTodayUganda = (item) => {
    if (!item.lastCollected) return false;
    const lastUgandaDay = getUgandaDateString(new Date(item.lastCollected));
    const todayUgandaDay = getUgandaDateString(new Date());
    return isSameUgandaDay(lastUgandaDay, todayUgandaDay);
  };

  const canCollect = (item) => {
    if (item.expired || item.collectedDays >= 180) return false;
    return !hasCollectedTodayUganda(item);
  };

  const handleReceiveClick = (item, indexInTab) => {
    const real = REAL_STAKE_LIST[item.power];
    if (!real) return alert("Invalid stake");
    if (item.expired || item.collectedDays >= 180) return alert("Generator expired after 180 days");
    if (hasCollectedTodayUganda(item)) return alert("All done for today - come back at 00:00 Uganda time");
    setCollectItem({ ...item, daily: real.daily, stakePower: real.stakePower });
    setCollectIndex(indexInTab);
    setShowCollect(true);
  };

  const confirmCollect = () => {
    const real = REAL_STAKE_LIST[collectItem.power];
    const amount = real.daily;
    const power = collectItem.power;
    const now = new Date();
    const dateStr = `${now.getDate()}/${now.getMonth()+1}/${now.getFullYear()} ${now.getHours()}:${String(now.getMinutes()).padStart(2,'0')}`;

    const currentInState = myStakes[tab][collectIndex];
    if (hasCollectedTodayUganda(currentInState)) {
      alert("Already collected today");
      setShowCollect(false);
      return;
    }

    localStorage.setItem("todaysYield", (parseInt(localStorage.getItem("todaysYield")||"0")+amount).toString());
    localStorage.setItem("totalStakeYield", (parseInt(localStorage.getItem("totalStakeYield")||"0")+amount).toString());
    localStorage.setItem("totalBalance", (parseInt(localStorage.getItem("totalBalance")||"0")+amount).toString());
    localStorage.setItem("availableBalance", (parseInt(localStorage.getItem("availableBalance")||"0")+amount).toString());

    const txs = JSON.parse(localStorage.getItem("transactions") || "[]");
    txs.unshift({ 
      type: "Stake Yield", power, stakePower: real.stakePower, amount,
      status: "success", date: dateStr, dateObj: now.toISOString(),
      ugandaDate: getUgandaDateString(now),
      collectedDays: (currentInState.collectedDays||0)+1
    });
    localStorage.setItem("transactions", JSON.stringify(txs));

    const updated = { ...myStakes };
    const item = updated[tab][collectIndex];
    item.collectedDays += 1;

    if (item.collectedDays >= 180) {
      item.expired = true;
      item.countdown = "Expired";
      item.expiredAt = now.toISOString();
      const txs2 = JSON.parse(localStorage.getItem("transactions") || "[]");
      txs2.unshift({ type: "Stake Expired", power, status: "expired", date: dateStr, dateObj: now.toISOString(), message: `${power} expired - Total ${(real.daily*180).toLocaleString()} UGX` });
      localStorage.setItem("transactions", JSON.stringify(txs2));
    } else {
      item.countdown = `${item.collectedDays}/180`;
      item.lastCollected = now.toISOString();
      item.lastCollectedUgandaDate = getUgandaDateString(now);
      item.expired = false;
    }
    item.daily = real.daily;
    item.stakePower = real.stakePower;

    setMyStakes(updated);
    localStorage.setItem("myStakes", JSON.stringify(updated));
    setShowCollect(false);
    
    if (item.collectedDays >= 180) {
      alert(`🎉 ${power} completed 180 days! Expired.`);
    }
  };

  const currentList = myStakes[tab] || [];

  return (
    <div className="min-h-screen w-full bg-[#141414] flex flex-col pb-[110px]">
      <div className="w-full bg-[#EBA043] pt-8 pb-6">
        <h1 className="text-black text-[26px] font-extrabold text-center">My stake</h1>
        <p className="text-black/60 text-[11px] text-center mt-1">Uganda Time: {getUgandaDate().toLocaleString("en-UG", { timeZone: "Africa/Kampala" })}</p>
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
            const real = REAL_STAKE_LIST[item.power] || item;
            const collectedToday = hasCollectedTodayUganda(item);
            const isExpired = item.expired || item.collectedDays >= 180;
            const isReady = !isExpired && !collectedToday;
            return (
              <div key={idx} className={`w-full bg-[#181B22] border rounded-[16px] p-3 flex gap-3 ${isExpired ? "border-red-500/40 opacity-60" : collectedToday ? "border-white/10 opacity-80" : "border-[#EBA043]/40"}`}>
                <div className="w-[125px] shrink-0 flex flex-col gap-2">
                  <div className="w-full h-[135px] bg-black rounded-[12px] overflow-hidden border border-[#EBA043]/20 relative">
                    <img src={item.img} alt="" className="w-full h-full object-cover" />
                    <div className="absolute top-[6px] left-[6px] bg-black/80 border border-[#EBA043]/60 text-[#EBA043] text-[11px] font-extrabold px-2 py-1 rounded-[8px]">{item.power}</div>
                    {isExpired && <div className="absolute inset-0 bg-black/70 flex items-center justify-center"><span className="bg-red-600 text-white font-black text-[12px] px-3 py-1 rounded-full">EXPIRED</span></div>}
                    {collectedToday && !isExpired && <div className="absolute inset-0 bg-black/50 flex items-center justify-center"><span className="bg-white/20 text-white font-bold text-[10px] px-2 py-1 rounded-full">DONE TODAY</span></div>}
                  </div>
                  <button onClick={() => handleReceiveClick(item, idx)} disabled={!isReady} className={`w-full h-[36px] rounded-[10px] font-extrabold text-[11px] ${isExpired ? "bg-red-900/50 text-white/40" : collectedToday ? "bg-[#3a3a3a] text-white/60" : "bg-[#EBA043] text-black"}`}>
                    {isExpired ? "Expired" : collectedToday ? "All done for today" : "Receive stake yield"}
                  </button>
                </div>
                <div className="flex-1 flex flex-col justify-start pt-1">
                  <div className="flex flex-col gap-[10px]">
                    <div className="flex justify-between items-center"><span className="text-[12px]">💰</span><span className="text-white/60 text-[11px]">Stake power</span><span className="text-white font-bold text-[11px]">{real.stakePower.toLocaleString()} UGX</span></div>
                    <div className="flex justify-between items-center"><span className="text-[12px]">📅</span><span className="text-white/60 text-[11px]">Stake validity</span><span className="text-white font-bold text-[11px]">180 days</span></div>
                    <div className="flex justify-between items-center"><span className="text-[12px]">⚡</span><span className="text-white/60 text-[11px]">Power output</span><span className="text-white font-bold text-[11px]">{powerFull(item.power)}</span></div>
                    <div className="flex justify-between items-center"><span className="text-[12px]">📈</span><span className="text-white/60 text-[11px]">Stake yield</span><span className="text-white font-bold text-[11px]">{real.daily.toLocaleString()} UGX</span></div>
                    <div className="flex justify-between items-center border-t border-white/10 pt-2 mt-1"><span className="text-[12px]">⏳</span><span className="text-white/60 text-[11px]">{isExpired ? "Status" : "Countdown"}</span><span className={`font-extrabold text-[11px] ${isExpired ? "text-red-400" : collectedToday ? "text-white/40" : "text-[#EBA043]"}`}>{isExpired ? "Expired" : collectedToday ? "All done - Resets 00:00" : item.countdown || "0/180"}</span></div>
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
            <p className="text-[#EBA043] text-[14px] font-bold text-center">Tap to collect stake yield of</p>
            <p className="text-[#EBA043] text-[20px] font-extrabold mt-2">💎 {REAL_STAKE_LIST[collectItem.power]?.daily.toLocaleString()} UGX</p>
            <p className="text-white/40 text-[11px] mt-1">Uganda Date: {getUgandaDateString()} - Day {(myStakes[tab][collectIndex]?.collectedDays||0)+1}/180</p>
            <div className="flex gap-4 mt-6 w-full">
              <button onClick={confirmCollect} className="flex-1 h-[42px] bg-[#EBA043] rounded-[10px] text-black font-extrabold text-[13px]">Collect</button>
              <button onClick={() => setShowCollect(false)} className="flex-1 h-[42px] bg-white/10 border border-[#EBA043]/40 rounded-[10px] text-white font-bold text-[13px]">Cancel</button>
            </div>
          </div>
        </div>
      )}

      <BottomNav active={active} setActive={setActive} />
    </div>
  );
}