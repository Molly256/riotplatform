"use client";
import { useState, useEffect } from "react";
import BottomNav from "@/components/BottomNav";

export default function TurbochargePage() {
  const [active, setActive] = useState("home");
  const [expanded, setExpanded] = useState(false);
  const [recentPower, setRecentPower] = useState(0);
  const [totalChargePower, setTotalChargePower] = useState(0);
  const [wattsInput, setWattsInput] = useState("");
  const [inviteLink, setInviteLink] = useState("");
  const [teamACount, setTeamACount] = useState(0);

  useEffect(() => {
    const savedRecent = parseInt(localStorage.getItem("recentTurboPower") || "0");
    const savedTotal = parseInt(localStorage.getItem("totalChargePower") || "0");
    const savedTeamA = parseInt(localStorage.getItem("teamACount") || "0");
    setRecentPower(savedRecent);
    setTotalChargePower(savedTotal);
    setTeamACount(savedTeamA);

    let code = localStorage.getItem("inviteCode");
    if (!code) {
      code = "TB-" + Math.random().toString(36).substring(2, 8).toUpperCase();
      localStorage.setItem("inviteCode", code);
    }
    setInviteLink(`https://turbocharge.app/invite/${code}`);
  }, []);

  const copyLink = () => {
    navigator.clipboard.writeText(inviteLink);
    alert("Turbocharge link copied");
  };

  // Simulate share - when user taps Turbocharge button
  const shareTurbocharge = () => {
    if (navigator.share) {
      navigator.share({ title: "Turbocharge", text: "Join with my Turbocharge link", url: inviteLink });
    } else {
      copyLink();
    }
  };

  const collectPower = () => {
    if (recentPower <= 0) return;
    const newTotal = totalChargePower + recentPower;
    setTotalChargePower(newTotal);
    localStorage.setItem("totalChargePower", newTotal.toString());
    setRecentPower(0);
    localStorage.setItem("recentTurboPower", "0");
  };

  const ugxValue = wattsInput ? parseFloat(wattsInput) * 1000 : 0;

  const exchangeNow = () => {
    const watts = parseFloat(wattsInput);
    if (!watts || watts <= 0) return alert("Enter watts");
    if (watts > 2) return alert("Exchange limit is 2 watts");
    if (watts > totalChargePower) return alert("Not enough power");

    const ugx = watts * 1000;
    const newTotalPower = totalChargePower - watts;
    setTotalChargePower(newTotalPower);
    localStorage.setItem("totalChargePower", newTotalPower.toString());

    const totalBal = parseInt(localStorage.getItem("totalBalance") || "0");
    const availBal = parseInt(localStorage.getItem("availableBalance") || "0");
    localStorage.setItem("totalBalance", (totalBal + ugx).toString());
    localStorage.setItem("availableBalance", (availBal + ugx).toString());

    const txs = JSON.parse(localStorage.getItem("transactions") || "[]");
    const now = new Date();
    const dateStr = `${now.getDate()}/${now.getMonth()+1}/${now.getFullYear()} ${now.getHours()}:${String(now.getMinutes()).padStart(2,'0')}`;
    txs.unshift({ type: "Turbocharge Exchange", amount: ugx, status: "success", date: dateStr });
    localStorage.setItem("transactions", JSON.stringify(txs));

    setWattsInput("");
    alert(`Exchanged ${watts} W = ${ugx.toLocaleString()} UGX`);
  };

  // This function you call when someone registers via Team A
  // Example: after referral success -> call addTurboReward()
  // For testing, you can call it manually

  return (
    <div className="min-h-screen w-full bg-[#141414] flex flex-col pb-[110px]">
      <div className="w-full bg-[#EBA043] rounded-b-[28px] px-4 pt-6 pb-5">
        <h1 className="text-black text-[36px] font-extrabold flex items-center gap-2">
          <span>⚡</span> Turbocharge
        </h1>
        <div className="mt-4 bg-black/10 rounded-[14px] p-3 border border-black/10">
          <p className="text-black font-extrabold text-[14px]">Turbocharge — Invite & Earn</p>
          <p className="text-black/70 text-[12px] mt-1">Share your invite link and earn Turbocharge power when friends join Team A.</p>
          <p className="text-black/50 text-[11px] mt-3">Turbocharge URL invitation link</p>
          <div className="mt-2 flex gap-2">
            <div className="flex-1 bg-black/80 text-white/80 text-[11px] rounded-[10px] px-3 py-2.5 flex items-center overflow-hidden">
              <span className="truncate">{inviteLink}</span>
            </div>
            <button onClick={copyLink} className="bg-white text-black font-bold text-[12px] px-3 rounded-[10px]">Copy</button>
          </div>
          <button onClick={shareTurbocharge} className="w-full mt-3 h-[44px] bg-black rounded-[12px] text-[#EBA043] font-extrabold text-[14px]">
            Turbocharge
          </button>
        </div>
      </div>

      <div className="w-full px-3 mt-4">
        <button onClick={() => setExpanded(!expanded)} className="w-full h-[46px] bg-[#EBA043] rounded-[14px] flex justify-between items-center px-4">
          <span className="text-black font-extrabold text-[14px]">Recent Turbocharge Power</span>
          <span className={`text-black text-[14px] transition ${expanded ? "rotate-180" : ""}`}>⌄</span>
        </button>

        {expanded && (
          <div className="mt-3 w-full bg-[#1E2128] border border-white/10 rounded-[16px] p-3">
            {recentPower === 0 ? (
              <div className="py-6 text-center">
                <p className="text-white/50 text-[13px]">No Turbocharge yet</p>
                <p className="text-white/30 text-[11px] mt-1">Invite friends to Team A to earn 0.2W per invite</p>
              </div>
            ) : (
              <>
                <div className="flex justify-between items-start">
                  <div className="flex gap-2">
                    <div className="w-[28px] h-[28px] bg-[#EBA043]/20 rounded-full flex items-center justify-center">⚡</div>
                    <div>
                      <p className="text-white/60 text-[11px]">Available Turbocharge Power</p>
                      <p className="text-[#EBA043] font-extrabold text-[18px]">{recentPower} W</p>
                      <p className="text-white/40 text-[10px] mt-1">Earned from {teamACount} Team A invited friends</p>
                    </div>
                  </div>
                  <span className="border border-[#EBA043]/50 text-[#EBA043] text-[10px] px-2 py-1 rounded-[8px]">Active</span>
                </div>
                <button onClick={collectPower} className="w-full mt-3 h-[40px] bg-transparent border border-[#EBA043] rounded-[12px] text-[#EBA043] font-bold text-[13px]">
                  ↓ Collect Power
                </button>
              </>
            )}
          </div>
        )}
      </div>

      <div className="w-full px-3 mt-4">
        <div className="w-full bg-[#1E2128] border border-white/10 rounded-[16px] overflow-hidden">
          <div className="bg-[#EBA043] h-[44px] flex items-center px-4">
            <h2 className="text-black font-extrabold text-[15px]">⇄ Charge Exchange Bureau</h2>
          </div>
          <div className="p-4">
            <p className="text-white/50 text-[11px]">Total charge power available</p>
            <p className="text-white font-extrabold text-[20px]">{totalChargePower} W</p>

            <div className="mt-3 w-full border-t border-white/10 pt-2">
              <div className="flex justify-between text-white/40 text-[11px] px-2"><span>Watts</span><span>Rate</span><span>UGX</span></div>
              <div className="flex justify-between text-white font-bold text-[12px] mt-1 px-2 pb-2 border-b border-white/10"><span>1</span><span>1000</span><span>1000 UGX</span></div>

              <p className="text-white/40 text-[11px] mt-3">Exchange Watts</p>
              <div className="mt-1 flex items-center bg-black rounded-[10px] border border-white/10 px-3 h-[44px]">
                <input type="number" value={wattsInput} onChange={(e) => setWattsInput(e.target.value)} placeholder="Enter watts to exchange" className="flex-1 bg-transparent text-white text-[13px] outline-none" />
                <span className="text-white/50 text-[12px]">{wattsInput || "0"} W</span>
              </div>

              <p className="text-white/60 text-[11px] mt-2">⚡ You will receive: {ugxValue.toLocaleString()} UGX</p>
              <p className="text-white/40 text-[11px]">Auto: <span className="text-white font-bold">You will receive UGX {ugxValue.toLocaleString()}</span></p>

              <button onClick={exchangeNow} className="w-full mt-3 h-[46px] bg-[#EBA043] rounded-[12px] text-black font-extrabold text-[14px]">⇄ Exchange Now</button>
            </div>
          </div>
        </div>

        <div className="mt-4 bg-[#1E2128] rounded-[14px] p-4 border border-white/5">
          <p className="text-white font-bold text-[14px]">Note:</p>
          <div className="mt-2 flex flex-col gap-1.5 text-[11px] text-white/70">
            <p>• Turbocharge exchange rate is 1 watt = 1,000 UGX</p>
            <p>• Turbocharge exchange limit is 2 watts</p>
            <p>• Every Team A invite earns you 0.2 watts</p>
            <p>• Only Team A invites give Turbocharge rewards</p>
          </div>
        </div>
      </div>

      <BottomNav active={active} setActive={setActive} />
    </div>
  );
}