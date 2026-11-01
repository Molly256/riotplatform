"use client";
import { useState, useEffect } from "react";
import BottomNav from "@/components/BottomNav";

const P = 'riot:'
const getUgandaDate = () => new Date().toLocaleDateString('en-CA', { timeZone: 'Africa/Kampala' }); // YYYY-MM-DD
const getUgandaDateTime = () => new Date().toLocaleString('en-GB', { timeZone: 'Africa/Kampala', hour12: false }); // d/m/yr hr:mins
const getUgandaDMY = () => {
  const d = new Date(new Date().toLocaleString('en-US', { timeZone: 'Africa/Kampala' }));
  const day = d.getDate();
  const month = d.getMonth()+1;
  const year = d.getFullYear();
  const hr = String(d.getHours()).padStart(2,'0');
  const min = String(d.getMinutes()).padStart(2,'0');
  return `${day}/${month}/${year} ${hr}:${min}`;
};

export default function StakingPage() {
  const [active, setActive] = useState("stake");
  const [tab, setTab] = useState("daily");
  const [showConfirm, setShowConfirm] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);
  const [selectedIdx, setSelectedIdx] = useState(null);
  const [outOfStock, setOutOfStock] = useState([]);
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState('');
  const [balance, setBalance] = useState(0);

  useEffect(() => {
    const savedStock = JSON.parse(localStorage.getItem("outOfStock_daily") || "[]");
    setOutOfStock(savedStock);
    const u = JSON.parse(localStorage.getItem('riot_user') || localStorage.getItem('booksforward_user') || localStorage.getItem('user') || '{}');
    const b = Number(u.availableBalance || u.balance || localStorage.getItem("availableBalance") || 0);
    setBalance(b);
  }, []);

  const showToast = (m) => { setToast(m); setTimeout(()=>setToast(''), 3000); }

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

  const handleStakeClick = (item, idx) => {
    if (outOfStock.includes(idx)) return;
    // CHECK BALANCE BEFORE CONFIRM
    const u = JSON.parse(localStorage.getItem('riot_user') || localStorage.getItem('booksforward_user') || localStorage.getItem('user') || '{}');
    const curBal = Number(u.availableBalance || u.balance || 0);
    if (curBal < item.stakePower) {
      showToast(`Insufficient Total Balance! Need ${item.stakePower.toLocaleString()} UGX`);
      return;
    }
    setSelectedItem(item);
    setSelectedIdx(idx);
    setShowConfirm(true);
  };

  const confirmYes = async () => {
    if (loading) return;
    setLoading(true);
    try {
      const amount = selectedItem.stakePower;
      const storedUser = JSON.parse(localStorage.getItem("riot_user") || localStorage.getItem('booksforward_user') || localStorage.getItem("user") || "{}");
      const phone = storedUser.phone;
      const userId = storedUser.userId || storedUser.id || storedUser.phone;

      const res = await fetch("/api/stake", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, phone, power: amount, amount, tab })
      });
      const data = await res.json();

      if (!res.ok || !data.success) {
        if (data.error?.includes('Insufficient')) showToast('Insufficient Total Balance');
        else showToast(data.message || data.error || "Stake failed");
        setLoading(false); setShowConfirm(false); return;
      }

      // === DEDUCT IMMEDIATELY FROM Mine Total balance field ===
      const updatedUser = data.user;
      // update all storage keys Mine page reads
      localStorage.setItem("riot_user", JSON.stringify(updatedUser));
      localStorage.setItem("booksforward_user", JSON.stringify(updatedUser));
      localStorage.setItem("user", JSON.stringify(updatedUser));
      localStorage.setItem("availableBalance", String(updatedUser.availableBalance));
      localStorage.setItem("totalBalance", String(updatedUser.balance || updatedUser.availableBalance));
      localStorage.setItem("balance", String(updatedUser.balance || updatedUser.availableBalance));
      setBalance(Number(updatedUser.availableBalance));

      // === SAVE MY STAKE WITH TODAY ENABLED ===
      const myStakes = JSON.parse(localStorage.getItem("myStakes") || '{"daily":[],"weekend":[],"hourly":[]}');
      const ugDate = getUgandaDate(); // for yield reset check
      const newStake = {
        ...selectedItem,
        stakedAt: new Date().toISOString(),
        ugStakedDate: ugDate,
        idx: selectedIdx,
        collectedDays: 0,
        lastClaimDate: '', // empty means today's yield button ENABLED immediately
        countdown: "1/180",
        canClaimToday: true
      };
      myStakes[tab].push(newStake);
      localStorage.setItem("myStakes", JSON.stringify(myStakes));

      // === TX HISTORY WITH d/m/yr hr:mins ===
      const txs = JSON.parse(localStorage.getItem("transactions") || "[]");
      const dmy = getUgandaDMY();
      txs.unshift({ type: "Stake", amount, status: "success", date: dmy, dateStr: dmy, tab, display: `Stake success ${amount.toLocaleString()} UGX` });
      localStorage.setItem("transactions", JSON.stringify(txs));

      const newStock = [...outOfStock, selectedIdx];
      setOutOfStock(newStock);
      localStorage.setItem("outOfStock_daily", JSON.stringify(newStock));

      setShowConfirm(false);
      setShowSuccess(true);
      setTimeout(() => setShowSuccess(false), 1800);

    } catch (e) {
      showToast("Stake error: " + e.message);
      setShowConfirm(false);
    } finally { setLoading(false); }
  };

  return (
    <div className="min-h-screen w-full bg-[#141414] flex flex-col pb-[110px]">
      {toast && <div className="fixed top-4 left-1/2 -translate-x-1/2 z-[9999] bg-red-600 text-white px-4 py-2 rounded-full font-bold text-xs">{toast}</div>}
      <div className="w-full pt-8 pb-6">
        <h1 className="text-white text-[38px] font-extrabold text-center">Staking</h1>
        <p className="text-center text-[#EBA043] text-[12px] font-bold mt-1">Total Balance: {balance.toLocaleString()} UGX</p>
      </div>

      <div className="w-full px-3 flex gap-2 mb-5">
        <button onClick={() => setTab("daily")} className={`flex-1 h-[44px] rounded-[14px] font-bold text-[13px] ${tab === "daily" ? "bg-[#EBA043] text-black" : "bg-[#EBA043]/60 text-black/80"}`}>Daily Yield Staking</button>
        <button onClick={() => setTab("weekend")} className={`flex-1 h-[44px] rounded-[14px] font-bold text-[13px] ${tab === "weekend" ? "bg-[#EBA043] text-black" : "bg-[#EBA043]/60 text-black/80"}`}>Weekend Staking</button>
        <button onClick={() => setTab("hourly")} className={`flex-1 h-[44px] rounded-[14px] font-bold text-[13px] ${tab === "hourly" ? "bg-[#EBA043] text-black" : "bg-[#EBA043]/60 text-black/80"}`}>Hourly Staking</button>
      </div>

      {tab === "daily" && (
        <div className="w-full px-3 flex flex-col gap-4">
          {stakeList.map((item, idx) => {
            const isOut = outOfStock.includes(idx);
            return (
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
                    </div>
                  </div>
                  <button onClick={() => handleStakeClick(item, idx)} disabled={isOut} className={`w-full mt-3 h-[36px] rounded-[10px] font-extrabold text-[13px] ${isOut ? "bg-[#3a3a3a] text-white/60" : "bg-[#EBA043] text-black"}`}>{isOut ? "Out of Stock" : "STAKE POWER"}</button>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {tab !== "daily" && (<div className="w-full flex-1 flex items-center justify-center mt-20"><h2 className="text-[#EBA043] text-[24px] font-extrabold">Coming soon......</h2></div>)}

      {showConfirm && (
        <div className="fixed inset-0 z-[1000] bg-black/70 flex items-center justify-center px-6">
          <div className="w-full max-w-[320px] bg-black border border-[#EBA043]/60 rounded-[18px] p-6 flex flex-col items-center">
            <p className="text-[#EBA043] text-[16px] font-bold text-center">Stake {selectedItem?.stakePower.toLocaleString()} UGX?</p>
            <p className="text-white/60 text-xs mt-2">Will deduct from Total Balance</p>
            <div className="flex gap-4 mt-6">
              <button onClick={confirmYes} disabled={loading} className="w-[90px] h-[38px] bg-[#EBA043] rounded-[10px] text-black font-extrabold text-[14px]">{loading ? "..." : "Yes"}</button>
              <button onClick={() => setShowConfirm(false)} className="w-[90px] h-[38px] bg-white/20 rounded-[10px] text-white font-extrabold text-[14px]">No</button>
            </div>
          </div>
        </div>
      )}

      {showSuccess && (
        <div className="fixed inset-0 z-[1001] bg-black/60 flex items-center justify-center px-6">
          <div className="w-full max-w-[300px] bg-[#EBA043] rounded-[16px] p-5 flex items-center justify-center">
            <p className="text-black text-[16px] font-extrabold text-center">Staked successfully</p>
          </div>
        </div>
      )}

      <BottomNav active={active} setActive={setActive} />
    </div>
  );
}