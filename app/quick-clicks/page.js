"use client";

import Link from "next/link";
import BottomNav from "@/components/BottomNav";
import { useState } from "react";

export default function QuickClicksPage() {
  const [active, setActive] = useState("quick");

  const items = [
    { label: "Deposit", emoji: "🏦", link: "/deposit" },
    { label: "Withdraw", emoji: "💵", link: "/withdraw" },
    { label: "My stake", emoji: "💎", link: "/stake" },
    { label: "Transactions", emoji: "📑", link: "/transactions" },
    { label: "My team", emoji: "👨‍👩‍👧", link: "/team" },
    { label: "Invite", emoji: "✉️", link: "/invite" },
    { label: "Lucky wheel", emoji: "🎯", link: "/lucky-wheel" },
    { label: "Download app", emoji: "🚀", link: "/download" },
  ];

  return (
    <div className="min-h-screen w-full bg-[#141414] flex flex-col pb-[110px]">
      
      {/* 1. IMAGE - FULL WIDTH + FULL HEIGHT - NO CROP */}
      <div className="w-full bg-[#141414] relative">
        <img 
          src="/riot.png" 
          alt="Riot" 
          className="w-full h-auto object-contain block"
        />
        <Link href="/" className="absolute top-3 left-3 bg-black/50 text-white w-8 h-8 rounded-full flex items-center justify-center backdrop-blur-sm">
          ←
        </Link>
      </div>

      {/* LEAVE SPACE */}
      <div className="w-full h-[18px] bg-[#141414]" />

      {/* 2. HEADER QUICK CLICKS */}
      <div className="w-full bg-[#141414] px-4">
        <h2 className="font-bold text-[17px] text-white mb-4">Quick Clicks</h2>
        <div className="grid grid-cols-4 gap-x-3 gap-y-6">
          {items.map((item) => (
            <Link key={item.label} href={item.link} className="flex flex-col items-center">
              {/* BUTTONS ORANGE/GOLD */}
              <div className="w-[72px] h-[64px] rounded-[16px] bg-[#EBA043] flex items-center justify-center text-[28px] shadow-[0_2px_8px_rgba(235,160,67,0.3)]">
                {item.emoji}
              </div>
              <span className="text-[11px] font-semibold text-white/90 mt-2 leading-none text-center">
                {item.label}
              </span>
            </Link>
          ))}
        </div>
      </div>

      {/* LEAVE A SPACE PUT THE BOTTOMS */}
      <div className="w-full h-[50px] bg-[#141414]" />

      <BottomNav active={active} setActive={setActive} />
    </div>
  );
}