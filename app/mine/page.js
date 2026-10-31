"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import BottomNav from "@/components/BottomNav";

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