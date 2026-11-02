"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import BottomNav from "@/components/BottomNav";

const LANGS = [
  { code: "en", label: "English", flag: "🇬🇧" },
  { code: "sw", label: "Kiswahili", flag: "🇹🇿" },
  { code: "zh-CN", label: "Chinese", flag: "🇨🇳" },
  { code: "lg", label: "Luganda", flag: "🇺🇬" },
  { code: "fr", label: "French", flag: "🇫🇷" },
  { code: "ar", label: "Arabic", flag: "🇸🇦" },
  { code: "es", label: "Spanish", flag: "🇪🇸" },
];

export default function MinePage() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [avatar, setAvatar] = useState(null);
  const [balances, setBalances] = useState({ totalBalance: 0, totalPowerDeposited: 0, totalWithdraw: 0, todaysYield: 0, totalStake: 0, totalTeamCommission: 0, totalStakeYield: 0, totalTurbochargeWatts: 0, totalTurbochargeUGX: 0, totalTurboWattsEarned: 0 });
  const [oldPass, setOldPass] = useState("");
  const [newPass, setNewPass] = useState("");
  const [confPass, setConfPass] = useState("");
  const [toast, setToast] = useState("");
  const [showLangs, setShowLangs] = useState(false);
  const [showLogout, setShowLogout] = useState(false);
  const [currentLang, setCurrentLang] = useState("en");

  useEffect(() => {
    const savedLang = localStorage.getItem("app_language") || localStorage.getItem("app_lang") || "en";
    setCurrentLang(savedLang);
    const saved = JSON.parse(localStorage.getItem("currentUser") || localStorage.getItem("user") || localStorage.getItem("riot_user") || "null");
    setUser(saved);
    const av = localStorage.getItem("riot_avatar");
    if (av) setAvatar(av);

    const q = saved?.userId || saved?.id || localStorage.getItem("userId") || localStorage.getItem("rp_userId") || saved?.phone || "";
    if (!q) return;

    // SINGLE SOURCE OF TRUTH - /api/mine POST (rp:tx + rp:user)
    fetch("/api/mine", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId: q }),
      cache: "no-store"
    })
    .then(r=>r.json())
    .then(d=>{
      if(d.success){
        const u = d.user || {};
        const t = d.totals || {};
        const safe = (v)=> Number(String(v||0).replace(/,/g,'')) || 0;
        // DB totalBalance is king - never go back to 1000 if DB says 2000
        const realBalance = safe(t.totalBalance ?? u.totalBalance ?? u.balance ?? 0);
        setBalances({
          totalBalance: realBalance,
          totalPowerDeposited: safe(t.totalPowerDeposited),
          totalWithdraw: safe(t.totalWithdraw),
          todaysYield: safe(t.todaysYield),
          totalStake: safe(t.totalStake),
          totalTeamCommission: safe(t.totalTeamCommission),
          totalStakeYield: safe(t.totalStakeYield),
          totalTurbochargeWatts: safe(t.totalChargePower ?? t.totalTurbochargeWatts),
          totalTurbochargeUGX: safe(t.totalTurbochargeUGX),
          totalTurboWattsEarned: safe(t.totalTurboWattsEarned ?? t.totalChargePower)
        });
        // sync localStorage FORWARD only (DB -> LS), never LS -> DB
        localStorage.setItem("totalBalance", String(realBalance));
        const merged = { ...saved, ...u, totalBalance: realBalance, balance: realBalance };
        localStorage.setItem("riot_user", JSON.stringify(merged));
        localStorage.setItem("currentUser", JSON.stringify(merged));
        localStorage.setItem("user", JSON.stringify(merged));
      }
    })
    .catch(()=>{});
  }, []);

  const onAvatar = (e)=>{ const file=e.target.files[0]; if(!file) return; const rd=new FileReader(); rd.onload=()=>{ setAvatar(rd.result); localStorage.setItem("riot_avatar", rd.result); }; rd.readAsDataURL(file); };

  const handleSaveCredentials = async ()=>{
    if(!oldPass||!newPass||!confPass){ setToast("Fill all fields"); setTimeout(()=>setToast(""),2000); return; }
    if(newPass!==confPass){ setToast("New passwords don't match"); setTimeout(()=>setToast(""),2500); return; }
    try{
      const userId=user?.userId||localStorage.getItem("userId");
      const res=await fetch("/api/auth/change-password", { method:"POST", headers:{"Content-Type":"application/json"}, body:JSON.stringify({ userId, oldPassword: oldPass, newPassword: newPass }) });
      const data=await res.json();
      if(!res.ok) throw new Error(data.error||"Invalid old password");
      localStorage.setItem("user_password", newPass);
      const curUser=JSON.parse(localStorage.getItem("currentUser")||"{}");
      curUser.password=newPass;
      localStorage.setItem("currentUser", JSON.stringify(curUser));
      localStorage.setItem("user", JSON.stringify(curUser));
      setToast("Saved successful"); setOldPass(""); setNewPass(""); setConfPass("");
      setTimeout(()=>setToast(""),2000);
    }catch(err){ setToast(err.message||"Invalid old password"); setTimeout(()=>setToast(""),2500); }
  };

  const triggerTranslate = (target) => {
    const sel = document.querySelector('.goog-te-combo');
    if(!sel){ setTimeout(()=>triggerTranslate(target),500); return; }
    sel.value = target;
    sel.dispatchEvent(new Event('change'));
  };

  const changeLangGoogle = (code)=>{
    localStorage.setItem("app_language", code);
    localStorage.setItem("app_lang", code);
    setCurrentLang(code);
    setShowLangs(false);
    if(code === "en"){
      document.cookie = 'googtrans=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
      document.cookie = `googtrans=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/; domain=.${window.location.hostname};`;
      localStorage.removeItem("googtrans");
      window.location.reload();
    } else {
      triggerTranslate(code);
    }
  };

  const handleLogout = ()=>{
    localStorage.removeItem("currentUser"); localStorage.removeItem("user"); localStorage.removeItem("userId"); localStorage.removeItem("inviteCode");
    router.push("/login");
  };

  if(!user){ return (<div className="min-h-screen bg-[#101319] flex items-center justify-center pb-[90px]"><div className="text-center"><p className="text-white/60">Not logged in</p><Link href="/login" className="mt-3 inline-block px-6 py-2 rounded-full bg-[#EBA043] text-black font-bold">Login</Link></div><BottomNav /></div>); }

  const items=[
    { label: "Total Balance", value: balances.totalBalance.toLocaleString() + " UGX" },
    { label: "Total Power Deposited", value: balances.totalPowerDeposited.toLocaleString() + " UGX" },
    { label: "Total Withdraw", value: balances.totalWithdraw.toLocaleString() + " UGX" },
    { label: "Today's Yield", value: balances.todaysYield.toLocaleString() + " UGX" },
    { label: "Total Stake", value: balances.totalStake.toLocaleString() + " UGX" },
    { label: "Total Team Commission", value: balances.totalTeamCommission.toLocaleString() + " UGX" },
    { label: "Total Stake Yield", value: balances.totalStakeYield.toLocaleString() + " UGX" },
    { label: "Total Turbocharge", value: balances.totalTurbochargeWatts + " W", sub: balances.totalTurbochargeUGX.toLocaleString() + " UGX earned" },
  ];

  return (
    <div className="min-h-screen bg-[#101319] pb-[90px] pt-4">
      <h1 className="text-[#EBA043] text-[26px] font-bold text-center mb-5">Mine</h1>
      <div className="mx-3 bg-[#1A1E2A] rounded-[20px] pt-8 pb-5 px-3">
        <div className="flex flex-col items-center">
          <label className="relative cursor-pointer">
            <input type="file" accept="image/*" className="hidden" onChange={onAvatar} />
            <div className="w-[88px] h-[88px] rounded-full border-[1.5px] border-dashed border-white/20 flex items-center justify-center overflow-hidden bg-[#242A3A]">
              {avatar ? <img src={avatar} alt="avatar" className="w-full h-full object-cover" /> : <span className="text-[44px] text-[#EBA043]">+</span>}
            </div>
            <div className="absolute bottom-0 right-0 w-[28px] h-[28px] rounded-full bg-[#EBA043] flex items-center justify-center border-[3px] border-[#1A1E2A]"><span className="text-black font-black text-[14px]">+</span></div>
          </label>
          <h2 className="mt-4 text-[22px] font-bold text-white">{user.username}</h2>
          <p className="mt-1 text-[14px] text-white/50">ID: {user.userId}</p>
        </div>
        <div className="mt-6 grid grid-cols-2 gap-3">
          {items.map((it,i)=>(<div key={i} className="h-[88px] rounded-[15px] bg-gradient-to-br from-[#EBA043] to-[#F7C978] flex flex-col items-center justify-center px-1"><p className="text-[12px] font-bold text-black text-center">{it.label}</p><p className="mt-1 text-[22px] font-black text-black">{it.value}</p>{it.sub&&<p className="text-[10px] font-bold text-black/60">{it.sub}</p>}</div>))}
        </div>

        <div className="mt-8">
          <h3 className="text-[#EBA043] text-[18px] font-black mb-3">Credential Modification</h3>
          <div className="flex flex-col gap-3">
            <input type="password" value={oldPass} onChange={e=>setOldPass(e.target.value)} placeholder="Input old password" className="h-[48px] w-full rounded-[12px] bg-[#151A28] border border-white/10 px-4 text-[14px] text-white placeholder:text-white/40 outline-none focus:border-[#EBA043]" />
            <input type="password" value={newPass} onChange={e=>setNewPass(e.target.value)} placeholder="Input new password" className="h-[48px] w-full rounded-[12px] bg-[#151A28] border border-white/10 px-4 text-[14px] text-white placeholder:text-white/40 outline-none focus:border-[#EBA043]" />
            <input type="password" value={confPass} onChange={e=>setConfPass(e.target.value)} placeholder="Confirm new password" className="h-[48px] w-full rounded-[12px] bg-[#151A28] border border-white/10 px-4 text-[14px] text-white placeholder:text-white/40 outline-none focus:border-[#EBA043]" />
            <button onClick={handleSaveCredentials} className="h-[50px] w-full rounded-[12px] bg-[#EBA043] text-black font-black text-[15px]">Save credentials</button>
          </div>
        </div>

        <div className="mt-6">
          <button onClick={()=>setShowLangs(!showLangs)} className="h-[50px] w-full rounded-[12px] bg-[#EBA043] text-black font-black text-[15px]">🌐 Change language</button>
          {showLangs && (
            <div className="mt-3 bg-[#151A28] rounded-[14px] border border-white/10 overflow-hidden">
              {LANGS.map(l=>(
                <button key={l.code} onClick={()=>changeLangGoogle(l.code)} className={"w-full h-[48px] flex items-center justify-between px-4 hover:bg-white/5 " + (currentLang===l.code?"bg-[#EBA043]/10":"")}>
                  <span className="text-white text-[14px] font-bold">{l.flag} {l.label}</span>
                  {currentLang===l.code && <span className="text-[#EBA043]">✓</span>}
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="mt-4">
          <button onClick={()=>setShowLogout(true)} className="h-[50px] w-full rounded-[12px] bg-[#EBA043] text-black font-black text-[15px]">🚪 Logout</button>
        </div>
      </div>

      {showLogout && (
        <div className="fixed inset-0 bg-black/70 z-[1000] flex items-center justify-center p-4">
          <div className="w-full max-w-[320px] bg-[#1A1E2A] rounded-[18px] p-5 border border-white/10">
            <h4 className="text-white text-[16px] font-bold text-center">Confirm Logout?</h4>
            <div className="mt-5 flex gap-3">
              <button onClick={()=>setShowLogout(false)} className="flex-1 h-[44px] rounded-[12px] bg-[#EBA043] text-black font-black text-[14px]">Stay</button>
              <button onClick={handleLogout} className="flex-1 h-[44px] rounded-[12px] bg-[#C1272D] text-white font-black text-[14px]">Confirm</button>
            </div>
          </div>
        </div>
      )}
      {toast && <div className="fixed bottom-[90px] left-1/2 -translate-x-1/2 bg-black border border-[#EBA043] text-white text-[13px] font-bold px-6 py-3 rounded-[12px] z-[9999]">{toast}</div>}
      <BottomNav />
    </div>
  );
}