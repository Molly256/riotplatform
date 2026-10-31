"use client";
import { useState, useEffect } from "react";
import BottomNav from "@/components/BottomNav";

export default function MyTeamPage() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showList, setShowList] = useState(null);
  const [levelInfo, setLevelInfo] = useState({ commission: 0, power: 0, members: [] });

  useEffect(() => {
    const load = async () => {
      const stored = JSON.parse(localStorage.getItem("user") || "{}");
      const userId = stored.userId || localStorage.getItem("userId") || localStorage.getItem("rp_userId");
      if (!userId) { setLoading(false); return; }
      const res = await fetch("/api/myteam", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId })
      });
      const json = await res.json();
      if (json.success) setData(json);
      setLoading(false);
    };
    load();
  }, []);

  const openLevel = (level) => {
    if (!data) return;
    const info = level === 'A' ? data.teamA : level === 'B' ? data.teamB : data.teamC;
    setLevelInfo(info);
    setShowList(level);
  };

  if (loading) return <div className="min-h-screen bg-black flex items-center justify-center text-[#EBA043]">Loading...</div>;

  return (
    <div className="min-h-screen w-full bg-[#0A0A0A] flex flex-col px-[18px] pt-[40px] pb-[90px]">
      <h1 className="text-[#F5A23A] text-[36px] font-bold text-center mb-[32px] tracking-wide">My team</h1>

      <button onClick={() => openLevel('A')} className="w-full bg-[#F5A23A] rounded-[18px] px-[20px] py-[22px] mb-[14px] text-left">
        <p className="text-black text-[26px] font-extrabold leading-[1.1]">Team A commission</p>
        <p className="text-black/70 text-[13px] mt-[4px]">All commission earned from team A members <span className="ml-1">→</span></p>
      </button>

      <button onClick={() => openLevel('B')} className="w-full bg-[#F5A23A] rounded-[18px] px-[20px] py-[22px] mb-[14px] text-left">
        <p className="text-black text-[26px] font-extrabold leading-[1.1]">Team B commission</p>
        <p className="text-black/70 text-[13px] mt-[4px]">All commission earned from team B members <span className="ml-1">→</span></p>
      </button>

      <button onClick={() => openLevel('C')} className="w-full bg-[#F5A23A] rounded-[18px] px-[20px] py-[22px] mb-[28px] text-left">
        <p className="text-black text-[26px] font-extrabold leading-[1.1]">Team C commission</p>
        <p className="text-black/70 text-[13px] mt-[4px]">All commission earned from team C members <span className="ml-1">→</span></p>
      </button>

      <div className="w-full bg-[#151515] rounded-[16px] px-[14px] py-[18px] mb-[14px] flex items-center gap-[12px]">
        <div className="w-[38px] h-[38px] rounded-full border border-[#F5A23A]/50 flex items-center justify-center shrink-0">
          <span className="text-[#F5A23A] text-[18px]">$</span>
        </div>
        <div className="flex-1">
          <div className="flex justify-between items-center">
            <p className="text-[#6B6B6B] text-[14px]">Total team commission</p>
            <p className="text-[#F5A23A] text-[15px] font-bold">{data ? `${data.totalCommission.toLocaleString()} UGX` : "— — —"}</p>
          </div>
          <p className="text-[#4A4A4A] text-[11px] mt-[2px] text-right">Total earned from Teams A · B · C</p>
        </div>
      </div>

      <div className="w-full bg-[#151515] rounded-[16px] px-[14px] py-[18px] flex items-center gap-[12px]">
        <div className="w-[38px] h-[38px] rounded-full border border-[#F5A23A]/50 flex items-center justify-center shrink-0">
          <span className="text-[#F5A23A] text-[18px]">⏻</span>
        </div>
        <div className="flex-1">
          <div className="flex justify-between items-center">
            <p className="text-[#6B6B6B] text-[14px]">Total team power</p>
            <p className="text-[#F5A23A] text-[15px] font-bold">{data ? `${data.totalPower.toLocaleString()} UGX` : "— — —"}</p>
          </div>
          <p className="text-[#4A4A4A] text-[11px] mt-[2px] text-right">Total deposited by Teams A · B · C</p>
        </div>
      </div>

      {showList && (
        <div className="fixed inset-0 z-[100] bg-black flex flex-col">
          <div className="w-full px-4 pt-8 pb-3">
            <div className="flex items-center gap-3">
              <button onClick={() => setShowList(null)} className="text-white text-[28px]">‹</button>
              <h2 className="text-[#F5A23A] text-[20px] font-bold">Team {showList} ({levelInfo.members.length})</h2>
            </div>
            <div className="mt-3 bg-[#F5A23A] rounded-[10px] px-3 py-2 flex justify-between">
              <span className="text-black text-[12px] font-bold">Commission: {levelInfo.commission.toLocaleString()} UGX</span>
              <span className="text-black text-[12px] font-bold">Power: {levelInfo.power.toLocaleString()} UGX</span>
            </div>
            <div className="mt-3 flex justify-between text-white/30 text-[11px] px-2">
              <span>Phone Number</span>
              <span>Staked Amount</span>
            </div>
          </div>
          <div className="flex-1 overflow-y-auto px-4 pb-6">
            {levelInfo.members.length === 0 ? (
              <p className="text-white/30 text-center mt-20">No members in Team {showList}</p>
            ) : (
              <div className="flex flex-col gap-2">
                {levelInfo.members.map((m, i) => (
                  <div key={i} className="w-full bg-[#1A1A1A] border border-[#F5A23A]/20 rounded-[12px] px-4 py-[14px] flex justify-between items-center">
                    <span className="text-white text-[14px]">{m.phone}</span>
                    <span className={`text-[14px] font-bold ${m.staked > 0 ? 'text-[#F5A23A]' : 'text-white/30'}`}>
                      {m.staked > 0 ? `${m.staked.toLocaleString()} UGX` : "0 UGX"}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      <BottomNav />
    </div>
  );
}