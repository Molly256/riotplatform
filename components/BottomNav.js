"use client";
import { useRouter, usePathname } from "next/navigation";

export default function BottomNav({ active, setActive, fixed = true }) {
  const router = useRouter();
  const pathname = usePathname();

  const items = [
    { id: "home", label: "Home", emoji: "🏠", link: "/dashboard" },
    { id: "quick", label: "Quick clicks", emoji: "⚡", link: "/quick-clicks" },
    { id: "stake", label: "Stake", emoji: "💎", link: "/stake" },
    { id: "mine", label: "Mine", emoji: "🙋‍♀️", link: "/mine" },
    { id: "settings", label: "Settings", emoji: "⚙️", link: "/settings" },
    // add these so your pages work
    { id: "team", label: "Team", emoji: "👥", link: "/myteam" },
    { id: "history", label: "History", emoji: "📜", link: "/transactions" },
  ];

  // auto-detect active from URL if active prop not passed
  const getActiveId = () => {
    if (active) return active;
    if (pathname?.includes("myteam")) return "team";
    if (pathname?.includes("transactions")) return "history";
    if (pathname?.includes("dashboard")) return "home";
    if (pathname?.includes("quick")) return "quick";
    if (pathname?.includes("stake")) return "stake";
    if (pathname?.includes("mine")) return "mine";
    if (pathname?.includes("settings")) return "settings";
    return "home";
  };

  const currentActive = getActiveId();

  return (
    <div className={`${fixed ? "fixed bottom-0 left-0 right-0 z-[999]" : "relative mt-6"} w-full bg-[#EBA043] border-t border-[#D18A32] h-[78px] flex justify-around items-center pb-1 shadow-[0_-4px_12px_rgba(0,0,0,0.15)]`}>
      {items.slice(0,5).map((item) => {
        const isActive = currentActive === item.id;
        return (
          <button
            key={item.id}
            type="button"
            onClick={() => {
              if (setActive) setActive(item.id);
              router.push(item.link);
            }}
            className="flex flex-col items-center justify-center w-[75px] py-1"
          >
            <div className={`w-[32px] h-[32px] rounded-full flex items-center justify-center ${isActive ? "bg-white shadow-md" : "bg-white/70"}`}>
              <span className="text-[20px] leading-none">{item.emoji}</span>
            </div>
            <span className={`text-[10px] font-bold mt-1 ${isActive ? "text-white" : "text-black/80"}`}>
              {item.label}
            </span>
          </button>
        );
      })}
    </div>
  );
}