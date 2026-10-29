"use client";
import { useState, useMemo, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { COUNTRIES } from "../lib/countries";

export const dynamic = 'force-dynamic';

export default function RegisterPage() {
  const router = useRouter();
  const [selectedCountry, setSelectedCountry] = useState(COUNTRIES.find(c=>c.code==="+256") || COUNTRIES[0]);
  const [showCountries, setShowCountries] = useState(false);
  const [phone, setPhone] = useState("");
  const [search, setSearch] = useState("");

  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [codeInput, setCodeInput] = useState("");
  const [showCodeArea, setShowCodeArea] = useState(false);
  const [timer, setTimer] = useState(0);
  const [attempts, setAttempts] = useState(0);
  const [locked, setLocked] = useState(false);
  const [lockUntil, setLockUntil] = useState(0);
  const [toast, setToast] = useState("");
  const [sending, setSending] = useState(false);
  const timerRef = useRef(null);

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

  // SEND REAL SMS TO USER'S NUMBER
  const handleVerify = async () => {
    if (!phone || phone.length < 7) {
      setToast("Enter valid phone number");
      setTimeout(()=>setToast(""),2000);
      return;
    }
    if (locked) {
      setToast("Try again after 30 minutes");
      setTimeout(()=>setToast(""),2000);
      return;
    }

    setSending(true);
    try {
      const fullPhone = selectedCountry.code + phone;
      const res = await fetch("/api/send-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone: fullPhone })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to send");

      setAttempts(a => a + 1);
      setShowCodeArea(true);
      setTimer(60);
      setToast(`SMS code sent to ${fullPhone} - check your phone`);
    } catch (err) {
      setToast(err.message || "Failed to send SMS");
      if (err.message.includes("30 minutes")) {
        const until = Date.now() + 30 * 60 * 1000;
        setLockUntil(until);
        setLocked(true);
      }
    }
    setSending(false);
    setTimeout(()=>setToast(""),4000);
  };

  const handleResend = () => {
    if (timer > 0 || locked || sending) return;
    handleVerify();
  };

  // VERIFY CODE FROM REDIS THEN REGISTER
  const handleSignUp = async () => {
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
    if (!showCodeArea || !codeInput) {
      setToast("Verify your number first");
      setTimeout(()=>setToast(""),2000);
      return;
    }

    setSending(true);
    try {
      const fullPhone = selectedCountry.code + phone;

      // Step 1: Verify OTP from Upstash Redis
      const verifyRes = await fetch("/api/verify-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone: fullPhone, code: codeInput })
      });
      const verifyData = await verifyRes.json();
      if (!verifyRes.ok) throw new Error(verifyData.error || "Wrong code");

      // Step 2: Create user in your DB (your existing register logic)
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone: fullPhone, username, email, password })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Signup failed");

      localStorage.setItem("currentUser", JSON.stringify(data.user));
      localStorage.setItem("inviteCode", data.user.inviteCode);
      localStorage.setItem("userId", data.user.userId);
      localStorage.removeItem("pendingRegister");

      setToast("Signup success");
      setTimeout(() => router.push("/login"), 1200);
    } catch (err) {
      setToast(err.message);
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

          {!showCodeArea ? (
            <button onClick={handleVerify} disabled={sending} className="h-[44px] rounded-xl bg-[#EBA043] text-black font-bold text-[13px] active:bg-[#D18A32] disabled:opacity-50">
              {sending ? "Sending SMS..." : "Please verify your number"}
            </button>
          ) : (
            <div className="w-full bg-[#1E1E1E] border border-[#EBA043]/40 rounded-xl p-3">
              <p className="text-[11px] text-white/70">Code sent via SMS to {selectedCountry.code}{phone}. Check your phone and paste below</p>
              <div className="mt-2 flex gap-2">
                <button onClick={handleResend} disabled={timer > 0 || locked || sending} className={`w-[110px] h-[46px] rounded-xl font-bold text-[12px] shrink-0 ${timer > 0 || locked || sending ? "bg-[#3a3a3a] text-white/40" : "bg-[#EBA043] text-black"}`}>
                  {locked ? "Locked" : timer > 0 ? `${timer}s` : "Resend SMS"}
                </button>
                <input value={codeInput} onChange={e=>setCodeInput(e.target.value.replace(/[^0-9]/g,""))} placeholder="Paste 6-digit SMS code" className="flex-1 h-[46px] bg-black border border-white/10 rounded-xl px-3 text-white text-[13px] outline-none" />
              </div>
              {locked ? (
                <p className="text-[11px] text-red-400 mt-2">Try again after 30 minutes - {Math.ceil((lockUntil - Date.now())/60000)}m left</p>
              ) : (
                <p className="text-[10px] text-white/40 mt-1">Attempts: {attempts}/3 - {selectedCountry.code}{phone}</p>
              )}
            </div>
          )}

          <div className="h-[50px] flex items-center gap-3 px-4 rounded-xl border-[1.5px] border-[#EBA043] bg-[#1E1E1E]"><span>👤</span><input value={username} onChange={e=>setUsername(e.target.value)} placeholder="Enter username" className="flex-1 bg-transparent outline-none text-[14px] text-white placeholder:text-white/40" /></div>
          <div className="h-[50px] flex items-center gap-3 px-4 rounded-xl border-[1.5px] border-[#EBA043] bg-[#1E1E1E]"><span>✉️</span><input value={email} onChange={e=>setEmail(e.target.value)} placeholder="Enter email" className="flex-1 bg-transparent outline-none text-[14px] text-white placeholder:text-white/40" /></div>
          <div className="h-[50px] flex items-center gap-3 px-4 rounded-xl border-[1.5px] border-[#EBA043] bg-[#1E1E1E]"><span>🔒</span><input type="password" value={password} onChange={e=>setPassword(e.target.value)} placeholder="Enter password" className="flex-1 bg-transparent outline-none text-[14px] text-white placeholder:text-white/40" /></div>
          <div className="h-[50px] flex items-center gap-3 px-4 rounded-xl border-[1.5px] border-[#EBA043] bg-[#1E1E1E]"><span>🔒</span><input type="password" value={confirmPassword} onChange={e=>setConfirmPassword(e.target.value)} placeholder="Confirm password" className="flex-1 bg-transparent outline-none text-[14px] text-white placeholder:text-white/40" /></div>

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