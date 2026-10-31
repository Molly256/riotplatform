"use client";
import { useState, useMemo, useEffect, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { COUNTRIES } from "../lib/countries";

export const dynamic = 'force-dynamic';

export default function RegisterPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [selectedCountry, setSelectedCountry] = useState(COUNTRIES.find(c=>c.code==="+256") || COUNTRIES[0]);
  const [showCountries, setShowCountries] = useState(false);
  const [phone, setPhone] = useState("");
  const [search, setSearch] = useState("");

  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [showConfirmPass, setShowConfirmPass] = useState(false);

  const [codeInput, setCodeInput] = useState("");
  const [showCodeArea, setShowCodeArea] = useState(false);
  const [timer, setTimer] = useState(0);
  const [attempts, setAttempts] = useState(0);
  const [locked, setLocked] = useState(false);
  const [lockUntil, setLockUntil] = useState(0);
  const [toast, setToast] = useState("");
  const [sending, setSending] = useState(false);
  const timerRef = useRef(null);

  const [inviteCode, setInviteCode] = useState("");
  const [isLocked, setIsLocked] = useState(false);

  const filtered = useMemo(() => {
    return COUNTRIES.filter(c=> c.name.toLowerCase().includes(search.toLowerCase()) || c.code.includes(search)).slice(0,50);
  }, [search]);

  useEffect(() => {
    const pending = JSON.parse(localStorage.getItem("pendingRegister") || "null");
    if (pending) {
      setPhone(pending.phone || "");
      setUsername(pending.username || "");
      setEmail(pending.email || "");
      setPassword(pending.password || "");
      setAttempts(pending.attempts || 0);
      setShowCodeArea(pending.showCodeArea || false);
      setCodeInput(pending.codeInput || "");
      if (pending.selectedCountry) setSelectedCountry(pending.selectedCountry);
      const savedLock = pending.lockUntil || 0;
      if (savedLock > Date.now()) {
        setLocked(true);
        setLockUntil(savedLock);
      }
      if (pending.timerEnd && pending.timerEnd > Date.now()) {
        setTimer(Math.ceil((pending.timerEnd - Date.now()) / 1000));
      }
    }
  }, []);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const urlRef = searchParams.get('ref') || searchParams.get('code')
      const code = urlRef ||
                   sessionStorage.getItem('activeInviterCode') || 
                   sessionStorage.getItem('referrer_code') || 
                   localStorage.getItem('referrer_code') ||
                   localStorage.getItem('referredBy')
      if (code) {
        setInviteCode(code.replace(/\D/g,'').slice(0,6))
        setIsLocked(true)
        sessionStorage.setItem('activeInviterCode', code)
        localStorage.setItem('referrer_code', code)
      }
    }
  }, [searchParams]);

  useEffect(() => {
    const data = { phone, username, email, password, attempts, showCodeArea, codeInput, lockUntil, selectedCountry, timerEnd: timer > 0 ? Date.now() + timer * 1000 : 0 };
    localStorage.setItem("pendingRegister", JSON.stringify(data));
  }, [phone, username, email, password, attempts, showCodeArea, codeInput, lockUntil, timer, selectedCountry]);

  useEffect(() => {
    if (timer > 0) {
      timerRef.current = setTimeout(() => setTimer(t => t - 1), 1000);
    } else {
      if (timerRef.current) clearTimeout(timerRef.current);
      if (locked && Date.now() >= lockUntil) {
        setLocked(false);
        setAttempts(0);
        setLockUntil(0);
      }
    }
    return () => clearTimeout(timerRef.current);
  }, [timer, locked, lockUntil]);

  const handleSignUp = async () => {
    if (!phone || phone.length < 7) {
      setToast("Enter valid phone number");
      setTimeout(()=>setToast(""),2000);
      return;
    }
    if (!username || !email || !password) {
      setToast("Fill all fields");
      setTimeout(()=>setToast(""),2000);
      return;
    }
    if (password !== confirmPassword) {
      setToast("Passwords do not match");
      setTimeout(()=>setToast(""),2000);
      return;
    }
    if (!inviteCode || !/^\d{6}$/.test(inviteCode)) {
      setToast("Invite code required - must be 6 digits");
      setTimeout(()=>setToast(""),3000);
      return;
    }

    setSending(true);
    try {
      const fullPhone = selectedCountry.code + phone;

      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone: fullPhone, username, email, password, inviterCode: inviteCode })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Signup failed");

      localStorage.setItem("currentUser", JSON.stringify(data.user));
      localStorage.setItem("user", JSON.stringify(data.user));
      localStorage.setItem("inviteCode", data.user.inviteCode);
      localStorage.setItem("userId", data.user.userId);
      localStorage.removeItem("pendingRegister");
      sessionStorage.removeItem('activeInviterCode');
      sessionStorage.removeItem('referrer_code');
      localStorage.removeItem('referrer_code');
      localStorage.removeItem('referredBy');

      // === FIX: CREATE REGISTRATION REWARD 1000 UGX FOR MINE + TX HISTORY ===
      const now = new Date();
      const ugDate = `${now.getDate()}/${now.getMonth()+1}/${now.getFullYear()} ${String(now.getHours()).padStart(2,'0')}:${String(now.getMinutes()).padStart(2,'0')}`;
      const regTx = {
        type: "Registration Reward",
        amount: 1000,
        date: ugDate,
        dateObj: now.toISOString(),
        status: "Success"
      };
      const existingTxs = JSON.parse(localStorage.getItem("transactions") || "[]");
      const noDup = existingTxs.filter(t => {
        const ty = (t.type||"").toLowerCase();
        return !(ty.includes("regist") || ty.includes("bonus") || ty.includes("welcome") || ty.includes("signup"));
      });
      noDup.unshift(regTx);
      localStorage.setItem("transactions", JSON.stringify(noDup));
      localStorage.setItem("totalBalance", "1000");
      localStorage.setItem("availableBalance", "1000");
      // === END FIX ===

      setToast("Sign up successful");
      setTimeout(() => router.push("/login"), 1200);
    } catch (err) {
      console.log(err);
      let msg = err.message;
      setToast(msg);
      setTimeout(()=>setToast(""),3000);
    }
    setSending(false);
  };

  return (
    <div className="min-h-screen bg-[#141414] flex flex-col items-center">
      <div className="w-full bg-[#141414]">
        <img src="/riot.png" alt="RIOT PLATFORM" className="w-full h-auto object-contain block" />
      </div>

      <div className="w-full max-w-[340px] px-6 pb-10">
        <h2 className="text-[26px] font-black text-white mt-2">Create your account</h2>
        <p className="text-[13px] text-center text-white/60 mt-2">Join RIOT PLATFORM and start staking</p>

        <div className="w-full mt-6 flex flex-col gap-3.5">
          <div className="relative">
            <div className="h-[50px] flex items-center rounded-xl border-[1.5px] border-[#EBA043] bg-[#1E1E1E]">
              <button type="button" onClick={()=>{setShowCountries(!showCountries); setSearch("");}} className="h-full px-3 flex items-center gap-1.5 bg-[#262626] border-r border-[#EBA043]/30 rounded-l-xl shrink-0">
                <span className="text-[18px]">{selectedCountry.flag}</span><span className="text-[12px] font-bold text-white">{selectedCountry.code}</span><span className="text-[8px] text-white">▼</span>
              </button>
              <input value={phone} onChange={e=>setPhone(e.target.value.replace(/[^0-9]/g,""))} placeholder="772 229 389" className="flex-1 h-full bg-transparent px-3 outline-none text-[14px] text-white placeholder:text-white/40" />
            </div>
            {showCountries && (
              <div className="absolute z-50 top-[54px] w-full bg-[#1E1E1E] border border-[#EBA043] rounded-xl shadow-xl overflow-hidden">
                <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search country or code" className="w-full h-[42px] px-3 border-b border-white/10 bg-[#1E1E1E] outline-none text-[13px] text-white placeholder:text-white/40" autoFocus />
                <div className="max-h-[240px] overflow-y-auto">
                  {filtered.map(c=>(
                    <button key={c.name} onClick={()=>{setSelectedCountry(c); setShowCountries(false);}} className="w-full flex items-center gap-2 px-3 py-2.5 hover:bg-[#2A2A2A] text-left">
                      <span className="text-[18px]">{c.flag}</span><span className="text-[13px] flex-1 text-white">{c.name}</span><span className="text-[11px] font-bold text-[#EBA043]">{c.code}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div className="h-[50px] flex items-center gap-3 px-4 rounded-xl border-[1.5px] border-[#EBA043] bg-[#1E1E1E]"><span>👤</span><input value={username} onChange={e=>setUsername(e.target.value)} placeholder="Enter username" className="flex-1 bg-transparent outline-none text-[14px] text-white placeholder:text-white/40" /></div>
          <div className="h-[50px] flex items-center gap-3 px-4 rounded-xl border-[1.5px] border-[#EBA043] bg-[#1E1E1E]"><span>✉️</span><input value={email} onChange={e=>setEmail(e.target.value)} placeholder="Enter email" className="flex-1 bg-transparent outline-none text-[14px] text-white placeholder:text-white/40" /></div>
          
          <div className="h-[50px] flex items-center gap-3 px-4 rounded-xl border-[1.5px] border-[#EBA043] bg-[#1E1E1E]">
            <span>🔒</span>
            <input type={showPass ? "text" : "password"} value={password} onChange={e=>setPassword(e.target.value)} placeholder="Enter password" className="flex-1 bg-transparent outline-none text-[14px] text-white placeholder:text-white/40" />
            <button type="button" onClick={()=>setShowPass(!showPass)} className="text-[18px] shrink-0">{showPass ? "🙈" : "👁️"}</button>
          </div>
          <div className="h-[50px] flex items-center gap-3 px-4 rounded-xl border-[1.5px] border-[#EBA043] bg-[#1E1E1E]">
            <span>🔒</span>
            <input type={showConfirmPass ? "text" : "password"} value={confirmPassword} onChange={e=>setConfirmPassword(e.target.value)} placeholder="Confirm password" className="flex-1 bg-transparent outline-none text-[14px] text-white placeholder:text-white/40" />
            <button type="button" onClick={()=>setShowConfirmPass(!showConfirmPass)} className="text-[18px] shrink-0">{showConfirmPass ? "🙈" : "👁️"}</button>
          </div>

          <div className="h-[50px] flex items-center gap-3 px-4 rounded-xl border-[1.5px] border-[#EBA043] bg-[#1E1E1E]">
            <span>🎟️</span>
            <input 
              value={inviteCode} 
              onChange={e=>{ setInviteCode(e.target.value.replace(/\D/g,'').slice(0,6)); if(isLocked) setIsLocked(false) }} 
              placeholder="Invite code (6 digits)" 
              className="flex-1 bg-transparent outline-none text-[14px] placeholder:text-white/40"
              style={{color: isLocked ? '#EBA043' : '#fff', fontWeight: isLocked ? '900' : '400'}}
            />
            {isLocked && <span className="text-[10px] font-black text-[#EBA043]">LOCKED</span>}
          </div>

          <button onClick={handleSignUp} disabled={sending} className="h-[52px] rounded-xl bg-[#EBA043] text-black font-black text-[18px] mt-1 active:bg-[#D18A32] shadow-[0_4px_12px_rgba(235,160,67,0.3)] disabled:opacity-50">
            {sending ? "Processing..." : "Sign Up"}
          </button>
          <p className="text-center text-[12px] mt-3 text-white">Already have account? <a href="/login" className="text-[#EBA043] font-bold">Login</a></p>
        </div>
      </div>

      {toast && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 bg-black border border-[#EBA043] text-white text-[13px] font-bold px-6 py-3 rounded-[12px] z-[9999]">
          {toast}
        </div>
      )}
    </div>
  );
}