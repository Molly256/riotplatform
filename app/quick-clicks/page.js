"use client";

import Link from "next/link";
import BottomNav from "@/components/BottomNav";
import { useState } from "react";

export default function QuickClicksPage() {
  const [active, setActive] = useState("quick");

  const items = [
    { label: "Deposit", emoji: "🏦", link: "/deposit" },
    { label: "Withdraw", emoji: "💵", link: "/withdraw" },
    { label: "My stake", emoji: "💎", link: "/mystake" },
    { label: "Transactions", emoji: "📑", link: "/transactions" },
    { label: "My team", emoji: "👨‍👩‍👧", link: "/team" },
    { label: "Turbocharge", emoji: "🚀", link: "/turbocharge" },
    { label: "Invite", emoji: "📨", link: "/invite" },
    { label: "Download app", emoji: "📱", link: "/download" },
  ];

  return (
    <div className="min-h-screen w-full bg-[#141414] flex flex-col overflow-y-auto">
      
      <div className="w-full bg-[#141414] relative shrink-0">
        <img src="/riot.png" alt="Riot" className="w-full h-auto object-contain block" />
        <Link href="/" className="absolute top-3 left-3 bg-black/50 text-white w-8 h-8 rounded-full flex items-center justify-center backdrop-blur-sm">←</Link>
      </div>

      <div className="w-full bg-[#141414] px-4 pt-[28px] pb-[20px] shrink-0">
        <h2 className="font-bold text-[17px] text-white">Quick Clicks</h2>
      </div>

      <div className="w-full bg-[#141414] px-4 py-6">
        <div className="w-full grid grid-cols-4 gap-x-3 gap-y-6">
          {items.slice(0, 4).map((item) => (
            <Link key={item.label} href={item.link} className="flex flex-col items-center">
              <div className="w-[72px] h-[64px] rounded-[16px] bg-[#EBA043] flex items-center justify-center text-[28px]"> {item.emoji} </div>
              <span className="text-[11px] font-semibold text-white/90 mt-2 text-center">{item.label}</span>
            </Link>
          ))}
        </div>
      </div>

      <div className="w-full bg-[#141414] px-4 py-6">
        <div className="w-full grid grid-cols-4 gap-x-3 gap-y-6">
          {items.slice(4, 8).map((item) => (
            <Link key={item.label} href={item.link} className="flex flex-col items-center">
              <div className="w-[72px] h-[64px] rounded-[16px] bg-[#EBA043] flex items-center justify-center text-[28px]"> {item.emoji} </div>
              <span className="text-[11px] font-semibold text-white/90 mt-2 text-center">{item.label}</span>
            </Link>
          ))}
        </div>
      </div>

      <div className="w-full h-[110px] bg-[#141414] shrink-0" />
      <BottomNav active={active} setActive={setActive} />
    </div>
  );
}