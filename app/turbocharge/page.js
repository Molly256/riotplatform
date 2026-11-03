"use client";
import { useState, useEffect } from "react";
import BottomNav from "@/components/BottomNav";

export default function TurbochargePage() {
  const [active, setActive] = useState("home");
  const [expanded, setExpanded] = useState(true);
  const [recentList, setRecentList] = useState([]);
  const [totalChargePower, setTotalChargePower] = useState(0);
  const [lifetimePower, setLifetimePower] = useState(0);
  const [wattsInput, setWattsInput] = useState("");
  const [inviteLink, setInviteLink] = useState("");
  const [loading, setLoading] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [lastExchanged, setLastExchanged] = useState({watts:0, ugx:0});

  const TURBO_PER_INVITE = 0.25;
  const FIRST_STAKE_BONUS = 2;
  const APP_BASE_URL = "https://riotplatfom.com";

  const getUserId = () => {
    try {
      const saved = JSON.parse(localStorage.getItem("currentUser") || localStorage.getItem("user") || "{}");
      return saved.userId || localStorage.getItem("userId") || localStorage.getItem("rp_userId");
    } catch { return null; }
  };

  useEffect(() => {
    const init = async () => {
      const savedUser = JSON.parse(localStorage.getItem("currentUser") || localStorage.getItem("user") || "{}");
      const code = savedUser?.inviteCode || savedUser?.referralCode || savedUser?.userId;
      if (code) setInviteLink(`${APP_BASE_URL}/r/${code}`);
      else setInviteLink(`${APP_BASE_URL}/r/------`);

      const userId = getUserId();
      if (!userId) return;

      try {
        // FIX: single source of truth - includes ALL history (0.25W + 2W bonus)
        const turboRes = await fetch(`/api/turbocharge?userId=${userId}`);
        const turboJson = await turboRes.json();
        if (turboJson.success) {
          setTotalChargePower(Number(turboJson.available||turboJson.totalPower||0));
          setLifetimePower(Number(turboJson.lifetime||0));
          // history is ALL tx ever earned, not reset on exchange
          if(turboJson.history && turboJson.history.length>0){
            setRecentList(turboJson.history);
          } else {
            // fallback: build from teamA if history empty (migration)
            const res = await fetch("/api/myteam", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ userId }) });
            const json = await res.json();
            const teamA = json.teamA?.members || [];
            const history = teamA.map((m, idx) => ({
              type: m.hasStaked ? 'first_stake' : 'invite',
              watts: m.hasStaked ? FIRST_STAKE_BONUS : TURBO_PER_INVITE,
              from: m.phone || m.userId,
              date: m.createdAt,
              display: m.hasStaked ? `🔥 Received ${FIRST_STAKE_BONUS}W - First Stake Bonus from ${m.phone||m.userId}` : `Received ${TURBO_PER_INVITE}W from ${m.phone||m.userId}`
            }));
            setRecentList(history);
          }
        }
      } catch (e) { console.log(e); }
    };
    init();
  }, []);

  const copyLink = () => {
    navigator.clipboard.writeText(inviteLink);
  };

  const shareTurbocharge = () => {
    if (navigator.share) navigator.share({ title: "Turbocharge", url: inviteLink });
    else copyLink();
  };

  const ugxValue = wattsInput ? parseFloat(wattsInput) * 1000 : 0;

  const exchangeNow = async () => {
    const watts = parseFloat(wattsInput || totalChargePower);
    const userId = getUserId();
    if (!userId) return alert("Login again");
    if (totalChargePower < 0.25) return alert(`You have ${totalChargePower}W. Invite more friends.`);
    if (!watts || watts <= 0) return alert("Enter watts");
    if (watts > totalChargePower) return alert(`Not enough power. You have ${totalChargePower}W`);

    setLoading(true);
    try {
      const res = await fetch("/api/turbocharge", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, watts })
      });
      const json = await res.json();
      if (!json.success) return alert(json.message || "Exchange failed");

      // FIX: ONLY available goes to 0, lifetime keeps adding for Mine page
      setTotalChargePower(json.newPower); // should be 0 if exchanged all
      setLifetimePower(json.lifetime);
      setLastExchanged({watts, ugx: json.ugx});
      
      // update cache for Mine page
      const cur = JSON.parse(localStorage.getItem("currentUser") || localStorage.getItem("user") || "{}");
      cur.totalBalance = json.user.totalBalance;
      cur.availableBalance = json.user.availableBalance;
      cur.turboAvailable = json.newPower;
      cur.turboLifetime = json.lifetime;
      cur.totalTurboWatts = json.lifetime;
      localStorage.setItem("currentUser", JSON.stringify(cur));
      localStorage.setItem("user", JSON.stringify(cur));

      setWattsInput("");
      setShowSuccess(true); // ORANGE GOLD POPUP
    } catch (e) { alert("Network error: " + e.message); }
    finally { setLoading(false); }
  };

  const recentPowerTotal = recentList.reduce((sum, r) => sum + Number(r.watts||0), 0);
  const canExchange = totalChargePower > 0;

  return (
    <div className="min-h-screen w-full bg-[#141414] flex flex-col pb-[110px]">
      <div className="w-full bg-[#0A0A0A] border-b border-[#EBA043]/20 rounded-b-[28px] px-4 pt-6 pb-5">
        <h1 className="text-[#EBA043] text-[36px] font-extrabold flex items-center gap-2"><span>⚡</span> Turbocharge</h1>
        <div className="mt-4 bg-[#1A1A1A] rounded-[14px] p-3 border border-[#EBA043]/15">
          <p className="text-white font-extrabold text-[14px]">Turbocharge — Invite & Earn</p>
          <p className="text-white/60 text-[12px] mt-1">Share your invite link and earn {TURBO_PER_INVITE}W when friends join Team A + {FIRST_STAKE_BONUS}W when they stake first time.</p>
          <p className="text-white/30 text-[11px] mt-3">Turbocharge URL invitation link</p>
          <div className="mt-2 flex gap-2">
            <div className="flex-1 bg-[#0A0A0A] text-white/60 text-[11px] rounded-[10px] px-3 py-2.5 flex items-center overflow-hidden border border-white/10"><span className="truncate">{inviteLink}</span></div>
            <button onClick={copyLink} className="bg-white text-black font-bold text-[12px] px-3 rounded-[10px]">Copy</button>
          </div>
          <button onClick={shareTurbocharge} className="w-full mt-3 h-[44px] bg-black border border-[#EBA043]/30 rounded-[12px] text-[#EBA043] font-extrabold text-[14px]">Turbocharge</button>
        </div>
      </div>

      <div className="w-full px-3 mt-4">
        <button onClick={() => setExpanded(!expanded)} className="w-full h-[46px] bg-[#EBA043] rounded-[14px] flex justify-between items-center px-4">
          <span className="text-black font-extrabold text-[14px]">Recent Turbocharge Power ({recentList.length}) - {recentPowerTotal}W</span>
          <span className={`text-black text-[14px] transition ${expanded ? "rotate-180" : ""}`}>⌄</span>
        </button>

        {expanded && (
          <div className="mt-3 w-full bg-[#1E2128] border border-white/10 rounded-[16px] p-3 max-h-[400px] overflow-y-auto">
            {recentList.length === 0 ? (
              <div className="py-6 text-center"><p className="text-white/50 text-[13px]">No Turbocharge yet</p><p className="text-white/30 text-[11px] mt-1">Invite friends to earn {TURBO_PER_INVITE}W + {FIRST_STAKE_BONUS}W first stake bonus</p></div>
            ) : (
              <div className="flex flex-col gap-2">
                {recentList.map((r, i) => (
                  <div key={i} className="flex justify-between items-center bg-black/40 rounded-[10px] px-3 py-2 border border-white/5">
                    <div>
                      <p className="text-white text-[12px]">{r.display || (r.type==='first_stake' ? `🔥 Received ${r.watts}W - First Stake Bonus from ${r.from}` : `Received ${r.watts}W from ${r.from}`)}</p>
                      <p className="text-white/30 text-[10px]">{r.date ? new Date(r.date).toLocaleString() : ""}</p>
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
          <div className="bg-[#EBA043] h-[44px] flex items-center px-4"><h2 className="text-black font-extrabold text-[15px]">⇄ Charge Exchange Bureau</h2></div>
          <div className="p-4">
            <p className="text-white/50 text-[11px]">Total charge power available</p>
            <p className="text-white font-extrabold text-[28px]">{totalChargePower} W</p>
            <p className="text-white/30 text-[10px]">Lifetime: {lifetimePower}W total ever earned</p>

            <div className="mt-3 w-full border-t border-white/10 pt-2">
              <div className="flex justify-between text-white/40 text-[11px] px-2"><span>Watts</span><span>Rate</span><span>UGX</span></div>
              <div className="flex justify-between text-white font-bold text-[12px] mt-1 px-2 pb-2 border-b border-white/10"><span>1</span><span>1000</span><span>1000 UGX</span></div>
              <p className="text-white/40 text-[11px] mt-3">Exchange Watts</p>
              <div className="mt-1 flex items-center bg-black rounded-[10px] border border-white/10 px-3 h-[44px]">
                <input type="number" value={wattsInput} onChange={(e) => setWattsInput(e.target.value)} placeholder={canExchange ? "Enter watts to exchange" : "0"} className="flex-1 bg-transparent text-white text-[13px] outline-none" disabled={loading} />
                <span className="text-white/50 text-[12px]">{wattsInput || "0"} W</span>
              </div>
              <p className="text-white/60 text-[11px] mt-2">⚡ You will receive: {ugxValue.toLocaleString()} UGX</p>
              <button onClick={exchangeNow} disabled={!canExchange || loading} className={`w-full mt-3 h-[46px] rounded-[12px] font-extrabold text-[14px] ${canExchange ? "bg-[#EBA043] text-black" : "bg-white/10 text-white/30"}`}>{loading ? "Processing..." : "⇄ Exchange Now"}</button>
            </div>
          </div>
        </div>
      </div>

      {/* ORANGE GOLD SUCCESS POPUP */}
      {showSuccess && (
        <div className="fixed inset-0 z-[9999] bg-black/80 flex items-center justify-center px-6">
          <div className="w-full max-w-[340px] bg-[#EBA043] rounded-[22px] p-7 flex flex-col items-center shadow-[0_0_40px_rgba(235,160,67,0.5)]">
            <p className="text-[48px]">🎉</p>
            <p className="text-black font-black text-[20px] mt-2 text-center">Congratulations 🎉</p>
            <p className="text-black font-bold text-[14px] mt-3 text-center">Turbocharge power exchange successfully</p>
            <p className="text-black/80 font-black text-[13px] mt-2 text-center">{lastExchanged.watts}W = {lastExchanged.ugx.toLocaleString()} UGX added to Balance</p>
            <button onClick={()=>setShowSuccess(false)} className="mt-6 w-full py-3 bg-black text-[#EBA043] font-black rounded-[12px]">OK, Great!</button>
          </div>
        </div>
      )}

      <BottomNav active={active} setActive={setActive} />
    </div>
  );
}