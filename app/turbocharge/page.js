"use client";
import { useState, useEffect } from "react";
import BottomNav from "@/components/BottomNav";

export default function TurbochargePage() {
  const [active, setActive] = useState("home");
  const [expanded, setExpanded] = useState(true);
  const [recentList, setRecentList] = useState([]);
  const [totalChargePower, setTotalChargePower] = useState(0);
  const [wattsInput, setWattsInput] = useState("");
  const [inviteLink, setInviteLink] = useState("");
  const [teamACount, setTeamACount] = useState(0);

  const TURBO_PER_INVITE = 0.25;
  const APP_BASE_URL = "https://riotplatform-swart.vercel.app";

  useEffect(() => {
    const init = async () => {
      const savedUser = JSON.parse(localStorage.getItem("currentUser") || localStorage.getItem("user") || "{}");
      const code = savedUser?.inviteCode || savedUser?.referralCode || savedUser?.userId;
      if (code) {
        setInviteLink(`${APP_BASE_URL}/r/${code}`);
      } else {
        setInviteLink(`${APP_BASE_URL}/r/------`);
      }

      const savedHistory = JSON.parse(localStorage.getItem("turboHistory") || "[]");
      const savedTotal = parseFloat(localStorage.getItem("totalChargePower") || "0");
      setRecentList(savedHistory);
      setTotalChargePower(savedTotal);

      try {
        const stored = JSON.parse(localStorage.getItem("user") || localStorage.getItem("currentUser") || "{}");
        const userId = stored.userId || localStorage.getItem("userId") || localStorage.getItem("rp_userId");
        if (!userId) return;

        const res = await fetch("/api/myteam", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ userId }),
        });
        const json = await res.json();
        if (!json.success) return;

        const teamA = json.teamA?.members || [];
        setTeamACount(teamA.length);

        const history = teamA.map((m, idx) => ({
          userId: m.userId || m.id || `User ${idx+1}`,
          phone: m.phone,
          watts: TURBO_PER_INVITE,
          date: m.createdAt ? new Date(m.createdAt).toLocaleString() : "Team A invite",
        }));

        const total = history.length * TURBO_PER_INVITE;
        const alreadyTotal = parseFloat(localStorage.getItem("totalChargePower") || "0");
        const alreadyHistoryLen = JSON.parse(localStorage.getItem("turboHistory") || "[]").length;

        if (history.length > 0 && history.length !== alreadyHistoryLen) {
          setRecentList(history);
          if (alreadyTotal === 0) {
            setTotalChargePower(total);
            localStorage.setItem("totalChargePower", total.toString());
          }
          localStorage.setItem("turboHistory", JSON.stringify(history));
          localStorage.setItem("teamACount", teamA.length.toString());
        }
      } catch (e) {
        console.log("myteam fetch error", e);
      }
    };
    init();
  }, []);

  const copyLink = () => {
    navigator.clipboard.writeText(inviteLink);
    alert("Turbocharge link copied");
  };

  const shareTurbocharge = () => {
    if (navigator.share) {
      navigator.share({ title: "Turbocharge", text: "Join with my Turbocharge link", url: inviteLink });
    } else copyLink();
  };

  const ugxValue = wattsInput ? parseFloat(wattsInput) * 1000 : 0;

  // === NEW LOGIC: MUST HAVE 2W+ TO EXCHANGE, NO MAX ===
  const exchangeNow = () => {
    const watts = parseFloat(wattsInput);

    if (totalChargePower < 2) {
      return alert(`Need at least 2W to exchange. You have ${totalChargePower}W. Invite ${(Math.ceil((2 - totalChargePower)/0.25))} more friends.`);
    }
    if (!watts || watts <= 0) return alert("Enter watts");
    if (watts > totalChargePower) return alert(`Not enough power. You have ${totalChargePower}W`);

    const ugx = watts * 1000;
    const newTotalPower = parseFloat((totalChargePower - watts).toFixed(2));
    setTotalChargePower(newTotalPower);
    localStorage.setItem("totalChargePower", newTotalPower.toString());

    const totalBal = parseInt(localStorage.getItem("totalBalance") || "0");
    const availBal = parseInt(localStorage.getItem("availableBalance") || "0");
    localStorage.setItem("totalBalance", (totalBal + ugx).toString());
    localStorage.setItem("availableBalance", (availBal + ugx).toString());

    const txs = JSON.parse(localStorage.getItem("transactions") || "[]");
    const now = new Date();
    const dateStr = `${now.getDate()}/${now.getMonth()+1}/${now.getFullYear()} ${now.getHours()}:${String(now.getMinutes()).padStart(2,'0')}`;
    txs.unshift({ type: "Turbocharge Exchange", amount: ugx, status: "success", date: dateStr, watts });
    localStorage.setItem("transactions", JSON.stringify(txs));

    fetch("/api/transactions/add", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId: JSON.parse(localStorage.getItem("currentUser")||"{}")?.userId, type: "Turbocharge Exchange", amount: ugx, watts })
    }).catch(()=>{});

    setWattsInput("");
    alert(`Success! ${watts}W = ${ugx.toLocaleString()} UGX added to Total Balance`);
  };

  const recentPowerTotal = recentList.reduce((sum, r) => sum + r.watts, 0);
  const canExchange = totalChargePower >= 2;

  return (
    <div className="min-h-screen w-full bg-[#141414] flex flex-col pb-[110px]">
      <div className="w-full bg-[#0A0A0A] border-b border-[#EBA043]/20 rounded-b-[28px] px-4 pt-6 pb-5">
        <h1 className="text-[#EBA043] text-[36px] font-extrabold flex items-center gap-2">
          <span>⚡</span> Turbocharge
        </h1>
        <div className="mt-4 bg-[#1A1A1A] rounded-[14px] p-3 border border-[#EBA043]/15">
          <p className="text-white font-extrabold text-[14px]">Turbocharge — Invite & Earn</p>
          <p className="text-white/60 text-[12px] mt-1">Share your invite link and earn {TURBO_PER_INVITE}W when friends join Team A.</p>
          <p className="text-white/30 text-[11px] mt-3">Turbocharge URL invitation link</p>
          <div className="mt-2 flex gap-2">
            <div className="flex-1 bg-[#0A0A0A] text-white/60 text-[11px] rounded-[10px] px-3 py-2.5 flex items-center overflow-hidden border border-white/10">
              <span className="truncate">{inviteLink}</span>
            </div>
            <button onClick={copyLink} className="bg-white text-black font-bold text-[12px] px-3 rounded-[10px]">Copy</button>
          </div>
          <button onClick={shareTurbocharge} className="w-full mt-3 h-[44px] bg-black border border-[#EBA043]/30 rounded-[12px] text-[#EBA043] font-extrabold text-[14px]">
            Turbocharge
          </button>
        </div>
      </div>

      <div className="w-full px-3 mt-4">
        <button onClick={() => setExpanded(!expanded)} className="w-full h-[46px] bg-[#EBA043] rounded-[14px] flex justify-between items-center px-4">
          <span className="text-black font-extrabold text-[14px]">Recent Turbocharge Power ({recentList.length}) - {recentPowerTotal}W</span>
          <span className={`text-black text-[14px] transition ${expanded ? "rotate-180" : ""}`}>⌄</span>
        </button>

        {expanded && (
          <div className="mt-3 w-full bg-[#1E2128] border border-white/10 rounded-[16px] p-3 max-h-[300px] overflow-y-auto">
            {recentList.length === 0 ? (
              <div className="py-6 text-center">
                <p className="text-white/50 text-[13px]">No Turbocharge yet</p>
                <p className="text-white/30 text-[11px] mt-1">Invite friends to Team A to earn {TURBO_PER_INVITE}W per invite (8 invites = 2W to unlock)</p>
              </div>
            ) : (
              <div className="flex flex-col gap-2">
                {recentList.map((r, i) => (
                  <div key={i} className="flex justify-between items-center bg-black/40 rounded-[10px] px-3 py-2 border border-white/5">
                    <div>
                      <p className="text-white text-[12px]">Received {r.watts}W from {r.phone || r.userId}</p>
                      <p className="text-white/30 text-[10px]">{r.date}</p>
                    </div>
                    <span className="text-[#EBA043] font-bold text-[13px]">+{r.watts}W</span>
                  </div>
                ))}
              </div>
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
            <p className="text-white font-extrabold text-[28px]">{totalChargePower} W</p>
            {!canExchange && (
              <p className="text-[#EBA043] text-[11px] mt-1">Need {(2 - totalChargePower).toFixed(2)}W more to unlock exchange (8 invites total)</p>
            )}

            <div className="mt-3 w-full border-t border-white/10 pt-2">
              <div className="flex justify-between text-white/40 text-[11px] px-2"><span>Watts</span><span>Rate</span><span>UGX</span></div>
              <div className="flex justify-between text-white font-bold text-[12px] mt-1 px-2 pb-2 border-b border-white/10"><span>1</span><span>1000</span><span>1000 UGX</span></div>

              <p className="text-white/40 text-[11px] mt-3">Exchange Watts</p>
              <div className="mt-1 flex items-center bg-black rounded-[10px] border border-white/10 px-3 h-[44px]">
                <input type="number" value={wattsInput} onChange={(e) => setWattsInput(e.target.value)} placeholder={canExchange ? "Enter watts to exchange" : "Need 2W minimum"} className="flex-1 bg-transparent text-white text-[13px] outline-none" disabled={!canExchange} />
                <span className="text-white/50 text-[12px]">{wattsInput || "0"} W</span>
              </div>

              <p className="text-white/60 text-[11px] mt-2">⚡ You will receive: {ugxValue.toLocaleString()} UGX</p>
              <button onClick={exchangeNow} disabled={!canExchange} className={`w-full mt-3 h-[46px] rounded-[12px] font-extrabold text-[14px] ${canExchange ? "bg-[#EBA043] text-black" : "bg-white/10 text-white/30"}`}>
                {canExchange ? "⇄ Exchange Now" : `Need ${(2 - totalChargePower).toFixed(2)}W more to unlock`}
              </button>
            </div>
          </div>
        </div>

        <div className="mt-4 bg-[#1E2128] rounded-[14px] p-4 border border-white/5">
          <p className="text-white font-bold text-[14px]">Note:</p>
          <div className="mt-2 flex flex-col gap-1.5 text-[11px] text-white/70">
            <p>• Turbocharge exchange rate is 1 watt = 1,000 UGX</p>
            <p>• Need at least 2W to unlock exchange</p>
            <p>• Every Team A invite earns you 0.25 watts (even without stake)</p>
            <p>• Only Team A invites give Turbocharge rewards</p>
          </div>
        </div>
      </div>

      <BottomNav active={active} setActive={setActive} />
    </div>
  );
}