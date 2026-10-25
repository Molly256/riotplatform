"use client";

import Image from "next/image";
import Link from "next/link";
import BottomNav from "../../components/BottomNav";
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
    <div className="min-h-screen bg-white flex flex-col">
      {/* Banner - FULL WIDTH using riot.png */}
      <div className="w-full relative">
        <img
          src="/riot.png"
          alt="Riot"
          className="w-full h-auto object-contain bg-white"
        />
        <Link
          href="/"
          className="absolute top-4 left-4 bg-black/50 text-white w-9 h-9 rounded-full flex items-center justify-center"
        >
          ←
        </Link>
      </div>

      {/* Quick Clicks - no big white space below */}
      <div className="flex-1 p-4 pb-[110px]">
        <h2 className="font-black text-[18px] mb-5">Quick Clicks</h2>

        <div className="grid grid-cols-4 gap-5">
          {items.map((item) => (
            <Link
              key={item.label}
              href={item.link}
              className="flex flex-col items-center gap-2"
            >
              <div className="w-[64px] h-[64px] rounded-[16px] bg-[#00BFFF] flex items-center justify-center text-[28px] shadow-md active:scale-95 transition">
                {item.emoji}
              </div>
              <span className="text-[11px] font-bold text-center text-gray-800 leading-tight">
                {item.label}
              </span>
            </Link>
          ))}
        </div>
      </div>

      {/* BottomNav Visible */}
      <BottomNav active={active} setActive={setActive} />
    </div>
  );
}