"use client";

export default function BottomNav({ active, setActive, fixed = true }) {
  const items = [
    { id: "home", label: "Home", emoji: "🏠", link: "/dashboard" },
    { id: "quick", label: "Quick clicks", emoji: "⚡", link: "/quick" },
    { id: "stake", label: "Stake", emoji: "💎", link: "/stake" },
    { id: "settings", label: "Settings", emoji: "⚙️", link: "/settings" },
  ];

  return (
    <div className={`${fixed ? "fixed bottom-0 left-0 right-0 z-[999]" : "relative mt-6"} w-full bg-white border-t border-gray-200 h-[70px] flex justify-around items-center`}>
      {items.map((item) => (
        <button
          key={item.id}
          onClick={() => {
            setActive(item.id);
            window.location.href = item.link;
          }}
          className={`flex flex-col items-center justify-center w-[70px] ${active === item.id ? "text-[#0A84FF]" : "text-gray-400"}`}
        >
          <span className="text-[24px] leading-none">{item.emoji}</span>
          <span className="text-[10px] font-semibold mt-1">{item.label}</span>
        </button>
      ))}
    </div>
  );
}