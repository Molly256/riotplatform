"use client";

import { useRouter } from "next/navigation";

const tabs = [
  { id: "home", emoji: "🏠", label: "Home" },
  { id: "quick", emoji: "⚡", label: "Quick clicks" },
  { id: "stake", emoji: "💰", label: "Stake" },
  { id: "mine", emoji: "🤵", label: "Mine" },
  { id: "settings", emoji: "⚙️", label: "Settings" },
];

export default function BottomNav({ active, setActive }) {
  const router = useRouter();

  return (
    <div className="fixed bottom-0 left-0 right-0 w-full z-50">
      <div className="flex justify-between items-center bg-[#c6e2ff] w-full px-2 py-3 rounded-t-[24px] shadow-[0_-4px_30px_rgba(0,0,0,0.12)]">
        {tabs.map((t) => {
          const isActive = active === t.id;
          return (
            <button
              key={t.id}
              onClick={() => {
                if (t.id === "quick") {
                  router.push("/quick-clicks");
                } else {
                  setActive(t.id);
                }
              }}
              className={`flex flex-col items-center justify-center px-2 py-2 rounded-[20px] w-full transition-all duration-200
                ${isActive ? "bg-[#2ea8ff] text-white scale-105 shadow-md" : "text-[#5a6f85] hover:bg-[#b5d8ff]"}`}
            >
              <span className="text-[22px] leading-none">{t.emoji}</span>
              <span className="text-[11px] font-bold mt-[2px] whitespace-nowrap">{t.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}