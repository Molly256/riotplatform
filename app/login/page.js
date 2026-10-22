"use client";
import { useState } from "react";

export default function LoginPage() {
  const [identifier, setIdentifier] = useState(""); // username OR phone
  const [password, setPassword] = useState("");
  const [showLinkModal, setShowLinkModal] = useState(null); // 'google' or 'apple'
  const [linkEmail, setLinkEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [serverOtp, setServerOtp] = useState("");
  const [step, setStep] = useState(1); // 1=email, 2=otp

  const handleLogin = (e) => {
    e.preventDefault();
    // Your normal login API - checks username/phone + password
    console.log("LOGIN", { identifier, password });
    alert(`Logging in as ${identifier}`);
  };

  // GOOGLE / APPLE FLOW - BASED ON EMAIL ONLY AS YOU SAID
  const startOAuthLink = async () => {
    if (!linkEmail) return alert("Enter email you registered with");
    // Check if email exists in DB
    const res = await fetch(`/api/check-email?email=${linkEmail}`);
    const data = await res.json();
    if (!data.exists) return alert("Email not found. Please register first.");

    // Send verification OTP to that email OR WhatsApp
    const code = Math.floor(100000 + Math.random()*900000).toString();
    setServerOtp(code);
    setStep(2);
    await fetch("/api/send-email-otp", { method:"POST", body: JSON.stringify({ email: linkEmail, code }) });
    alert(`Verification code sent to ${linkEmail} - Code: ${code} (test mode)`);
  };

  const confirmLink = async () => {
    if (otp !== serverOtp) return alert("Wrong code");
    // Now link Google/Apple account to this email
    await fetch("/api/link-oauth", {
      method:"POST",
      headers:{"Content-Type":"application/json"},
      body: JSON.stringify({ email: linkEmail, provider: showLinkModal })
    });
    alert(`Success! ${showLinkModal} linked to ${linkEmail}. Next time you can login directly with ${showLinkModal}.`);
    setShowLinkModal(null);
    setStep(1);
    // Now actually trigger Google/Apple OAuth
    window.location.href = `/api/auth/${showLinkModal}?email=${linkEmail}`;
  };

  return (
    <div className="min-h-screen bg-white flex flex-col items-center px-6 pb-10">
      <div className="h-8" />
      <h1 className="text-[32px] font-black text-[#0A84FF]">RIOT PLATFORM</h1>
      <p className="text-[16px] font-bold text-[#0A84FF]">Stake with us.</p>

      <h2 className="text-[26px] font-black mt-8">Welcome back</h2>
      <p className="text-[13px] text-center max-w-[300px] mt-2">Login to RIOT PLATFORM and continue staking</p>

      <form onSubmit={handleLogin} className="w-full max-w-[340px] mt-6 flex flex-col gap-3.5">
        {/* USERNAME / PHONE */}
        <div className="h-[50px] flex items-center gap-3 px-4 rounded-xl border-[1.5px] border-[#0A84FF] bg-[#F1F6FF]">
          <span>👤</span>
          <input value={identifier} onChange={e=>setIdentifier(e.target.value)} placeholder="Username or Phone" className="flex-1 bg-transparent outline-none text-[14px]" />
        </div>

        {/* PASSWORD */}
        <div className="h-[50px] flex items-center gap-3 px-4 rounded-xl border-[1.5px] border-[#0A84FF] bg-[#F1F6FF]">
          <span>🔒</span>
          <input type="password" value={password} onChange={e=>setPassword(e.target.value)} placeholder="Enter password" className="flex-1 bg-transparent outline-none text-[14px]" />
        </div>

        <div className="text-right"><a className="text-[12px] text-[#0A84FF] font-bold">Forgot password?</a></div>

        <button type="submit" className="h-[52px] rounded-xl bg-[#0A84FF] text-white font-bold text-[18px] mt-1">Sign In</button>

        <div className="flex items-center gap-2 mt-1"><div className="flex-1 h-[1px] bg-gray-300"/><span className="text-[12px]">Or continue with</span><div className="flex-1 h-[1px] bg-gray-300"/></div>

        {/* GOOGLE + APPLE IMAGE BUTTONS */}
        <div className="flex gap-3">
          <button type="button" onClick={()=>setShowLinkModal("google")} className="flex-1 h-[46px] rounded-xl border-[1.5px] border-[#0A84FF] bg-white flex items-center justify-center gap-2">
            <img src="https://www.svgrepo.com/show/475656/google-color.svg" className="w-5 h-5" alt="G" />
            <span className="text-[14px] font-semibold">Google</span>
          </button>
          <button type="button" onClick={()=>setShowLinkModal("apple")} className="flex-1 h-[46px] rounded-xl border-[1.5px] border-[#0A84FF] bg-white flex items-center justify-center gap-2">
            <img src="https://www.svgrepo.com/show/452110/apple.svg" className="w-5 h-5" alt="Apple" />
            <span className="text-[14px] font-semibold">Apple</span>
          </button>
        </div>

        <p className="text-center text-[12px] mt-3">Don't have account?<br/><a href="/register" className="text-[#0A84FF] font-bold">Create account</a></p>
      </form>

      {/* MODAL FOR GOOGLE/APPLE LINKING - EMAIL BASED */}
      {showLinkModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center px-6 z-50">
          <div className="w-full max-w-[340px] bg-white rounded-2xl p-6 shadow-2xl">
            <h3 className="font-black text-[18px]">Link {showLinkModal} to your account</h3>
            <p className="text-[12px] mt-1 text-gray-600">
              {step===1 ? `Enter the email you registered with on RIOT PLATFORM. We'll verify it's you.` : `We sent code to ${linkEmail}. Enter it to link.`}
            </p>

            {step===1 ? (
              <>
                <input value={linkEmail} onChange={e=>setLinkEmail(e.target.value)} placeholder="Enter registered email" className="w-full h-[48px] mt-4 px-4 rounded-xl border-[1.5px] border-[#0A84FF] bg-[#F1F6FF] outline-none text-[14px]" />
                <button onClick={startOAuthLink} className="w-full h-[48px] mt-3 rounded-xl bg-[#0A84FF] text-white font-bold">Verify Email</button>
              </>
            ) : (
              <>
                <input value={otp} onChange={e=>setOtp(e.target.value)} placeholder="Enter 6-digit code" className="w-full h-[48px] mt-4 px-4 rounded-xl border-[1.5px] border-[#0A84FF] bg-[#F1F6FF] text-center tracking-[6px] font-bold outline-none" />
                <button onClick={confirmLink} className="w-full h-[48px] mt-3 rounded-xl bg-black text-white font-bold">Link & Continue with {showLinkModal}</button>
              </>
            )}

            <button onClick={()=>{setShowLinkModal(null); setStep(1);}} className="w-full mt-3 text-[12px] text-gray-500">Cancel</button>
          </div>
        </div>
      )}
    </div>
  );
}