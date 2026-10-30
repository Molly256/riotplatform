"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";

function BottomNav() {
  const path = usePathname();
  return (
    <div className="fixed bottom-0 left-0 right-0 h-[74px] bg-[#12151C] border-t border-white/[0.05] flex justify-around items-center z-50">
      <Link href="/home" className={`flex flex-col items-center gap-1 ${path==="/home"?"text-[#EBA043]":"text-white/40"}`}>
        <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor"><path d="M12 3L2 12h3v8h5v-6h4v6h5v-8h3L12 3z"/></svg>
        <span className="text-[11px]">Home</span>
      </Link>
      <Link href="/market" className={`flex flex-col items-center gap-1 ${path==="/market"?"text-[#EBA043]":"text-white/40"}`}>
        <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor"><path d="M6 6h4v4H6zM11 6h4v4h-4zM16 6h2v4h-2zM6 11h4v4H6zM11 11h4v4h-4zM16 11h2v4h-2z"/></svg>
        <span className="text-[11px]">Market</span>
      </Link>
      <Link href="/stake" className={`flex flex-col items-center gap-1 ${path==="/stake"?"text-[#EBA043]":"text-white/40"}`}>
        <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor"><rect x="3" y="3" width="8" height="8" rx="2"/><rect x="13" y="3" width="8" height="8" rx="2"/><rect x="3" y="13" width="8" height="8" rx="2"/><rect x="13" y="13" width="8" height="8" rx="2"/></svg>
        <span className="text-[11px]">Stake</span>
      </Link>
      <Link href="/mine" className="flex flex-col items-center gap-1 text-[#EBA043]">
        <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2a5 5 0 100 10A5 5 0 0012 2zm0 12c-4 0-8 2-8 5v3h16v-3c0-3-4-5-8-5z"/></svg>
        <span className="text-[11px] font-bold">My</span>
      </Link>
    </div>
  );
}

export default function MinePage() {
  const [user, setUser] = useState(null);
  const [avatar, setAvatar] = useState(null);

  useEffect(() => {
    const saved = JSON.parse(localStorage.getItem("currentUser") || "null");
    setUser(saved);
    const av = localStorage.getItem("riot_avatar");
    if (av) setAvatar(av);
  }, []);

  const onAvatar = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const rd = new FileReader();
    rd.onload = () => {
      setAvatar(rd.result);
      localStorage.setItem("riot_avatar", rd.result);
    };
    rd.readAsDataURL(file);
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-[#101319] flex items-center justify-center pb-[90px]">
        <div className="text-center">
          <p className="text-white/60">Not logged in</p>
          <Link href="/login" className="mt-3 inline-block px-6 py-2 rounded-full bg-[#EBA043] text-black font-bold">Login</Link>
        </div>
        <BottomNav />
      </div>
    );
  }

  const items = [
    { label: "Total Balance", value: "0.00 UGX" },
    { label: "Total Power Deposited", value: "0.00 UGX" },
    { label: "Total Withdraw", value: "0.00 UGX" },
    { label: "Today's Yield", value: "0.00 UGX" },
    { label: "Total Stake", value: "0.00 UGX" },
    { label: "Total Team Commission", value: "0.00 UGX" },
    { label: "Total Stake Yield", value: "0.00 UGX" },
    { label: "Total Turbocharge", value: "0.00 UGX" },
  ];

  return (
    <div className="min-h-screen bg-[#101319] pb-[90px] pt-4">
      <div className="mx-3 bg-[#1A1E2A] rounded-[20px] pt-8 pb-5 px-3">
        <div className="flex flex-col items-center">
          <label className="relative cursor-pointer">
            <input type="file" accept="image/*" className="hidden" onChange={onAvatar} />
            <div className="w-[88px] h-[88px] rounded-full border-[1.5px] border-dashed border-white/20 flex items-center justify-center overflow-hidden bg-[#242A3A]">
              {avatar ? <img src={avatar} alt="avatar" className="w-full h-full object-cover" /> : <span className="text-[44px] text-[#EBA043]">+</span>}
            </div>
            <div className="absolute bottom-0 right-0 w-[28px] h-[28px] rounded-full bg-[#EBA043] flex items-center justify-center border-[3px] border-[#1A1E2A]">
              <span className="text-black font-black text-[14px]">+</span>
            </div>
          </label>

          <h2 className="mt-4 text-[22px] font-bold text-white">{user.username}</h2>
          <p className="mt-1 text-[14px] text-white/50">ID: {user.userId}</p>
          <Link href="/transactions" className="mt-3 text-[14px] text-[#EBA043]">Transaction History →</Link>
        </div>

        <div className="mt-6 grid grid-cols-2 gap-3">
          {items.map((it, i) => (
            <div key={i} className="h-[88px] rounded-[15px] bg-gradient-to-br from-[#EBA043] to-[#F7C978] flex flex-col items-center justify-center px-1">
              <p className="text-[12px] font-bold text-black text-center">{it.label}</p>
              <p className="mt-1 text-[22px] font-black text-black">{it.value}</p>
            </div>
          ))}
        </div>
      </div>

      <BottomNav />
    </div>
  );
}