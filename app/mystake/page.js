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

  useEffect(() => {
    const saved = JSON.parse(localStorage.getItem("myStakes") || '{"daily":[],"weekend":[],"hourly":[]}');
    setMyStakes(saved);
  }, []);

  const powerFull = (short) => {
    if (!short) return "";
    if (short.includes("MW")) return short.replace("MW", " MegaWatt").replace(".0", "");
    if (short.includes("kW")) return short.replace("kW", " KiloWatt").replace(".0", "");
    if (short.includes("W")) return short.replace("W", " Watt");
    return short;
  };

  const handleReceiveClick = (item, indexInTab) => {
    setCollectItem(item);
    setCollectIndex(indexInTab);
    setShowCollect(true);
  };

  const confirmCollect = () => {
    const amount = collectItem.daily;
    const now = new Date();
    const dateStr = `${now.getDate()}/${now.getMonth()+1}/${now.getFullYear()} ${now.getHours()}:${String(now.getMinutes()).padStart(2,'0')}`;

    const todayYield = parseInt(localStorage.getItem("todaysYield") || "0");
    const totalYield = parseInt(localStorage.getItem("totalStakeYield") || "0");
    const totalBal = parseInt(localStorage.getItem("totalBalance") || "0");
    const availBal = parseInt(localStorage.getItem("availableBalance") || "0");

    localStorage.setItem("todaysYield", (todayYield + amount).toString());
    localStorage.setItem("totalStakeYield", (totalYield + amount).toString());
    localStorage.setItem("totalBalance", (totalBal + amount).toString());
    localStorage.setItem("availableBalance", (availBal + amount).toString());

    const txs = JSON.parse(localStorage.getItem("transactions") || "[]");
    txs.unshift({ type: "Today's yield", amount: amount, status: "success", date: dateStr });
    localStorage.setItem("transactions", JSON.stringify(txs));

    const updated = { ...myStakes };
    const itemInState = updated[tab][collectIndex];
    if (itemInState.collectedDays < 180) {
      itemInState.collectedDays += 1;
      itemInState.countdown = `${itemInState.collectedDays}/180`;
      itemInState.lastCollected = new Date().toISOString();
    }
    setMyStakes(updated);
    localStorage.setItem("myStakes", JSON.stringify(updated));
    setShowCollect(false);
  };

  const currentList = myStakes[tab] || [];

  return (
    <div className="min-h-screen w-full bg-[#141414] flex flex-col pb-[110px]">
      <div className="w-full bg-[#EBA043] pt-8 pb-6">
        <h1 className="text-black text-[26px] font-extrabold text-center">My stake</h1>
      </div>

      <div className="w-full px-3 flex gap-2 my-5">
        <button onClick={() => setTab("daily")} className={`flex-1 h-[44px] rounded-[14px] font-bold text-[13px] ${tab === "daily" ? "bg-[#EBA043] text-black" : "bg-[#EBA043]/60 text-black/80"}`}>Daily Yield Staking</button>
        <button onClick={() => setTab("weekend")} className={`flex-1 h-[44px] rounded-[14px] font-bold text-[13px] ${tab === "weekend" ? "bg-[#EBA043] text-black" : "bg-[#EBA043]/60 text-black/80"}`}>Weekend Staking</button>
        <button onClick={() => setTab("hourly")} className={`flex-1 h-[44px] rounded-[14px] font-bold text-[13px] ${tab === "hourly" ? "bg-[#EBA043] text-black" : "bg-[#EBA043]/60 text-black/80"}`}>Hourly Staking</button>
      </div>

      <div className="w-full px-3 flex flex-col gap-4">
        {currentList.length === 0 ? (
          <div className="w-full flex flex-col items-center mt-20">
            <p className="text-white/50 text-[14px]">No staked generators in {tab}</p>
          </div>
        ) : (
          currentList.map((item, idx) => (
            <div key={idx} className="w-full bg-[#181B22] border border-[#EBA043]/40 rounded-[16px] p-3 flex gap-3">
              <div className="w-[125px] shrink-0 flex flex-col gap-2">
                <div className="w-full h-[135px] bg-black rounded-[12px] overflow-hidden border border-[#EBA043]/20 relative">
                  <img src={item.img} alt="" className="w-full h-full object-cover" />
                  <div className="absolute top-[6px] left-[6px] bg-black/80 border border-[#EBA043]/60 text-[#EBA043] text-[11px] font-extrabold px-2 py-1 rounded-[8px]">{item.power}</div>
                </div>
                <button onClick={() => handleReceiveClick(item, idx)} className={`w-full h-[36px] rounded-[10px] font-extrabold text-[11px] ${item.collectedDays >= 180 ? "bg-[#3a3a3a] text-white/40" : "bg-[#EBA043] text-black"}`} disabled={item.collectedDays >= 180}>
                  {item.collectedDays >= 180 ? "Completed" : "Receive stake yield"}
                </button>
              </div>
              <div className="flex-1 flex flex-col justify-start pt-1">
                <div className="flex flex-col gap-[10px]">
                  <div className="flex justify-between items-center"><span className="text-[12px]">💰</span><span className="text-white/60 text-[11px]">Stake power</span><span className="text-white font-bold text-[11px]">{item.stakePower.toLocaleString()} UGX</span></div>
                  <div className="flex justify-between items-center"><span className="text-[12px]">📅</span><span className="text-white/60 text-[11px]">Stake validity</span><span className="text-white font-bold text-[11px]">180 days</span></div>
                  <div className="flex justify-between items-center"><span className="text-[12px]">⚡</span><span className="text-white/60 text-[11px]">Power output</span><span className="text-white font-bold text-[11px]">{powerFull(item.power)}</span></div>
                  <div className="flex justify-between items-center"><span className="text-[12px]">📈</span><span className="text-white/60 text-[11px]">Stake yield</span><span className="text-white font-bold text-[11px]">{item.daily.toLocaleString()} UGX</span></div>
                  <div className="flex justify-between items-center border-t border-white/10 pt-2 mt-1"><span className="text-[12px]">⏳</span><span className="text-white/60 text-[11px]">Stake validity countdown</span><span className="text-[#EBA043] font-extrabold text-[11px]">{item.countdown || "0/180 days"}</span></div>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {showCollect && collectItem && (
        <div className="fixed inset-0 z-[1000] bg-black/70 flex items-center justify-center px-6">
          <div className="w-full max-w-[320px] bg-black border border-[#EBA043]/60 rounded-[18px] p-6 flex flex-col items-center">
            <p className="text-[#EBA043] text-[14px] font-bold text-center">Tap to collect stake yield of</p>
            <p className="text-[#EBA043] text-[20px] font-extrabold mt-2">💎 {collectItem.daily.toLocaleString()} UGX</p>
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