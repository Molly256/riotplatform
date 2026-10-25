"use client";

import Image from "next/image";
import Link from "next/link";

export default function QuickClicksPage() {
  const items = [
    { label: "Deposit", emoji: "💰", link: "/deposit" },
    { label: "Withdraw", emoji: "💸", link: "/withdraw" },
    { label: "My stake", emoji: "📈", link: "/stake" },
    { label: "Transactions", emoji: "📜", link: "/transactions" },
    { label: "My team", emoji: "👥", link: "/team" },
    { label: "Invite", emoji: "🎁", link: "/invite" },
    { label: "Lucky wheel", emoji: "🎡", link: "/lucky-wheel" },
    { label: "Download app", emoji: "📲", link: "/download" },
  ];

  return (
    <div className="min-h-screen bg-white pb-[80px]">
      {/* Header Image full width */}
      <div className="w-full h-[180px] relative">
        <Image
          src="/riot-header.jpg"
          alt="Riot Header"
          fill
          className="object-cover"
          priority
        />
        <Link
          href="/"
          className="absolute top-4 left-4 bg-black/50 text-white w-9 h-9 rounded-full flex items-center justify-center"
        >
          ←
        </Link>
      </div>

      {/* Title */}
      <div className="p-4">
        <h2 className="font-bold text-[16px] mb-4">Quick Clicks</h2>

        {/* Buttons */}
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
              <span className="text-[11px] font-semibold text-center text-gray-800 leading-tight">
                {item.label}
              </span>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}