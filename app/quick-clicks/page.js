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
    <div className="w-full bg-white flex flex-col">
      <div className="w-full relative bg-white">
        <img src="/riot.png" alt="Riot" className="w-full h-[170px] object-cover object-top" />
        <Link href="/" className="absolute top-3 left-3 bg-black/40 text-white w-8 h-8 rounded-full flex items-center justify-center">←</Link>
      </div>

      <div className="bg-white px-3 pt-2 pb-3">
        <h2 className="font-bold text-[16px] text-black mb-3">Quick Clicks</h2>
        <div className="grid grid-cols-4 gap-x-2 gap-y-5">
          {items.map((item) => (
            <Link key={item.label} href={item.link} className="flex flex-col items-center">
              <div className="w-[72px] h-[62px] rounded-[14px] bg-[#00BFFF] flex items-center justify-center text-[26px] shadow-sm">
                {item.emoji}
              </div>
              <span className="text-[10.5px] font-semibold text-black mt-1.5 leading-none text-center">{item.label}</span>
            </Link>
          ))}
        </div>
      </div>

      <BottomNav active={active} setActive={setActive} />
    </div>
  );
}