"use client";
import { useState } from "react";

export default function LoginPage() {
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [showLinkModal, setShowLinkModal] = useState(null);
  const [linkEmail, setLinkEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [serverOtp, setServerOtp] = useState("");
  const [step, setStep] = useState(1);

  const handleLogin = (e) => {
    e.preventDefault();
    alert(`Logging in as ${identifier}`);
  };

  // FRONT ONLY - NO API
  const startOAuthLink = () => {
    if (!linkEmail) return alert("Enter email you registered with");
    const code = Math.floor(100000 + Math.random()*900000).toString();
    setServerOtp(code);
    setStep(2);
    alert(`TEST MODE - Verification code for ${linkEmail} is: ${code}`);
  };

  const confirmLink = () => {
    if (otp !== serverOtp) return alert("Wrong code");
    alert(`Success! ${showLinkModal} linked to ${linkEmail}.`);
    setShowLinkModal(null);
    setStep(1);
  };

  return (
    <div className="min-h-screen bg-white flex flex-col items-center px-6 pt-8 pb-10">
      <h1 className="text-[28px] font-black text-[#0A84FF] tracking-wide leading-none">RIOT PLATFORM</h1>
      <p className="text-[15px] font-bold text-[#0A84FF] mt-0.5">Stake with us.</p>
      
      <h2 className="text-[22px] font-extrabold mt-6 text-black">Welcome back</h2>
      <p className="text-[12.5px] text-center text-gray-700 mt-1 max-w-[300px] leading-tight">Login to RIOT PLATFORM and continue staking</p>

      <form onSubmit={handleLogin} className="w-full max-w-[320px] mt-5 flex flex-col gap-3">
        <div className="h-[48px] flex items-center gap-3 px-4 rounded-xl border-[1.5px] border-[#0A84FF] bg-[#F1F6FF]">
          <svg className="w-5 h-5 text-[#0A84FF]" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
          <input value={identifier} onChange={e=>setIdentifier(e.target.value)} placeholder="Username or Phone" className="flex-1 bg-transparent outline-none text-[13.5px] placeholder:text-gray-500" />
        </div>

        <div className="h-[48px] flex items-center gap-3 px-4 rounded-xl border-[1.5px] border-[#0A84FF] bg-[#F1F6FF]">
          <svg className="w-5 h-5 text-[#0A84FF]" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
          <input type="password" value={password} onChange={e=>setPassword(e.target.value)} placeholder="Enter password" className="flex-1 bg-transparent outline-none text-[13.5px] placeholder:text-gray-500" />
          <span className="text-[#0A84FF] text-[14px]">👁️</span>
        </div>

        <button type="submit" className="h-[48px] rounded-xl bg-[#0A84FF] text-white font-bold text-[16px] mt-1 shadow-sm">Sign In</button>

        <div className="flex items-center gap-3 mt-1">
          <div className="flex-1 h-[1px] bg-gray-300"/><span className="text-[11px] text-gray-600">Or continue with</span><div className="flex-1 h-[1px] bg-gray-300"/>
        </div>

        <div className="flex gap-3">
          <button type="button" onClick={()=>setShowLinkModal("google")} className="flex-1 h-[42px] rounded-xl border-[1.5px] border-[#0A84FF] bg-white flex items-center justify-center gap-2">
            <img src="https://www.svgrepo.com/show/475656/google-color.svg" className="w-4 h-4" alt="G" /><span className="text-[13px] font-medium">Google</span>
          </button>
          <button type="button" onClick={()=>setShowLinkModal("apple")} className="flex-1 h-[42px] rounded-xl border-[1.5px] border-[#0A84FF] bg-white flex items-center justify-center gap-2">
            <img src="https://www.svgrepo.com/show/452110/apple.svg" className="w-4 h-4" alt="Apple" /><span className="text-[13px] font-medium">Apple</span>
          </button>
        </div>

        <p className="text-center text-[11px] leading-tight mt-2">Don't have account?<br/><a href="/register" className="text-[#0A84FF] font-bold text-[12px]">Create account</a></p>
      </form>

      {showLinkModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center px-6 z-50">
          <div className="w-full max-w-[320px] bg-white rounded-2xl p-6 shadow-2xl border border-[#0A84FF]/20">
            <h3 className="font-black text-[16px] text-black">Link {showLinkModal} to your account</h3>
            <p className="text-[11.5px] mt-1.5 text-gray-600 leading-tight">
              {step===1 ? `Enter the email you registered with on RIOT PLATFORM.` : `We sent code to ${linkEmail}. Enter it below.`}
            </p>
            {step===1 ? (
              <>
                <input value={linkEmail} onChange={e=>setLinkEmail(e.target.value)} placeholder="Enter registered email" className="w-full h-[46px] mt-4 px-4 rounded-xl border-[1.5px] border-[#0A84FF] bg-[#F1F6FF] outline-none text-[13px] placeholder:text-gray-500" />
                <button onClick={startOAuthLink} className="w-full h-[46px] mt-3 rounded-xl bg-[#0A84FF] text-white font-bold text-[14px]">Verify Email</button>
              </>
            ) : (
              <>
                <input value={otp} onChange={e=>setOtp(e.target.value)} placeholder="Enter 6-digit code" className="w-full h-[46px] mt-4 px-4 rounded-xl border-[1.5px] border-[#0A84FF] bg-[#F1F6FF] text-center tracking-[6px] font-bold outline-none text-[14px]" />
                <button onClick={confirmLink} className="w-full h-[46px] mt-3 rounded-xl bg-black text-white font-bold text-[14px]">Link & Continue</button>
              </>
            )}
            <button onClick={()=>{setShowLinkModal(null); setStep(1);}} className="w-full mt-3 text-[11px] text-gray-500">Cancel</button>
          </div>
        </div>
      )}
    </div>
  );
}