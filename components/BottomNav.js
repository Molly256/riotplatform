"use client";
import { useRouter } from "next/navigation";

export default function BottomNav({ active, setActive, fixed = true }) {
  const router = useRouter();

  const items = [
    { id: "home", label: "Home", emoji: "🏠", link: "/dashboard" },
    { id: "quick", label: "Quick clicks", emoji: "⚡", link: "/quick-clicks" },
    { id: "stake", label: "Stake", emoji: "💎", link: "/stake" },
    { id: "settings", label: "Settings", emoji: "⚙️", link: "/settings" },
  ];

  return (
    <div className={`${fixed ? "fixed bottom-0 left-0 right-0 z-[999]" : "relative mt-6"} w-full bg-[#EBA043] border-t border-[#D18A32] h-[78px] flex justify-around items-center pb-1 shadow-[0_-4px_12px_rgba(0,0,0,0.15)]`}>
      {items.map((item) => {
        const isActive = active === item.id;
        return (
          <button
            key={item.id}
            onClick={() => {
              setActive(item.id);
              router.push(item.link);
            }}
            className={`flex flex-col items-center justify-center w-[75px] py-1 transition-all`}
          >
            {/* Emoji with white circle so it shows well on gold */}
            <div className={`w-[32px] h-[32px] rounded-full flex items-center justify-center ${isActive ? "bg-white shadow-md" : "bg-white/70"}`}>
              <span className="text-[20px] leading-none">{item.emoji}</span>
            </div>
            {/* Text - black for visibility, white when active */}
            <span className={`text-[10px] font-bold mt-1 tracking-wide ${isActive ? "text-white" : "text-black/80"}`}>
              {item.label}
            </span>
          </button>
        );
      })}
    </div>
  );
}