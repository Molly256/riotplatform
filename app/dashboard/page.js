"use client";
import { useState, useEffect } from "react";
import BottomNav from "@/components/BottomNav";

const SLIDES = ["/1.jpg","/2.jpg","/3.jpg","/4.jpg","/5.jpg","/6.jpg","/7.jpg","/8.jpg","/9.jpg"];

export default function DashboardPage() {
  const [active, setActive] = useState("home");
  const [currentSlide, setCurrentSlide] = useState(0);

  // FIX LAG: Preload all 9 images instantly on mount
  useEffect(() => {
    SLIDES.forEach((src) => {
      const img = new Image();
      img.src = src;
    });
  }, []);

  // FIX LAG: Auto slide immediately, no delay on tab
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentSlide((p) => (p + 1) % SLIDES.length);
    }, 2500);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="min-h-screen bg-[#141414] pb-[100px]">
      <div className="w-full bg-[#141414]">
        <img src="/riot-header.png" alt="RIOT PLATFORM" className="w-full h-[90px] object-contain bg-[#141414]" />
      </div>

      <div className="w-full bg-[#141414]">
        <div className="w-full h-auto relative overflow-hidden bg-[#141414]">
          {/* FIX LAG: Keep all images loaded, show instantly */}
          {SLIDES.map((src, i) => (
            <img
              key={src}
              src={src}
              alt=""
              loading="eager"
              decoding="sync"
              className={`w-full h-auto object-contain bg-[#141414] absolute top-0 left-0 transition-opacity duration-300 ${i === currentSlide ? "opacity-100 relative" : "opacity-0"}`}
            />
          ))}
        </div>
        <div className="flex justify-center gap-2 py-3 bg-[#141414]">
          {SLIDES.map((_,i) => <div key={i} className={`h-2 rounded-full transition-all ${i===currentSlide?"w-6 bg-[#EBA043]":"w-2 bg-white/20"}`} />)}
        </div>
      </div>

      <div className="w-full px-4 py-4 bg-[#141414]">
        <div className="bg-[#EBA043]/15 border border-[#EBA043]/30 rounded-[16px] px-4 py-2 mb-4">
          <h2 className="text-[20px] font-black text-[#EBA043]">ABOUT US</h2>
        </div>
        <div className="text-[14px] leading-[1.7] text-white/80 space-y-4 px-1">
          <p>- Riot Platforms is mid-transformation from a pure-play bitcoin miner into a contracted AI data center landlord, and can be analyzed as three distinct businesses; in Q2 2026 it reported $174.2 million total revenue ($113.7 million mining, $37.3 million engineering, $23.2 million data center) and a $237.2 million GAAP net loss driven overwhelmingly by non-cash items, while mining still supplied roughly 65% of revenue.</p>
          <p>- The transition is exists contractually but not yet delivered or financed: Riot has 241 MW of executed critical IT capacity (AMD 50 MW; a "leading frontier AI lab," reported by Bloomberg and independently confirmed by CNBC's David Faber to be Anthropic, 191 MW) representing about $9.8 billion of undiscounted contracted revenue, yet the first 96 MW of the flagship lease is not scheduled to energize until December 2027 and its investment-grade credit backstop is still being finalized.</p>
          <p>- The core risks are financing and delivery, not demand: the 191 MW build alone implies roughly $2.1-$2.3 billion of capex against about $1.2 billion of liquidity (half of it bitcoin marked at spot); the equity is best understood as a call option on converting undiscounted headline contract values into financed, delivered, credit-backed net operating income.</p>
          <h3 className="text-[18px] font-black text-[#EBA043] pt-2">Key Findings</h3>
          <p>Riot Platforms is three businesses with three economic structures. The bitcoin mining operation earns volatile, unhedged revenue against a falling commodity price and rising global difficulty; the data center leasing operation earns contracted, long-duration, credit-dependent rent that has barely begun to flow; and the engineering segment earns project margin against a backlog that is now roughly 90% data-center work. These carry different capital intensities, risk profiles, and valuation frameworks, and blending them into a single narrative would mislead.</p>
        </div>
      </div>

      <div className="w-full bg-[#141414] py-2">
        <img src="/mid.jpg" alt="mid" className="w-full h-auto object-cover" />
      </div>

      <div className="w-full px-4 py-6 bg-[#141414]">
        <h2 className="text-[22px] font-black text-[#EBA043] mb-4">Details</h2>
        <div className="text-[14px] leading-[1.7] text-white/80 space-y-4">
          <h3 className="text-[17px] font-black text-[#EBA043]">1. Corporate history and governance evolution</h3>
          <p>Riot began as Bioptix, Inc., a veterinary and biotechnology diagnostics business. In October 2017 it renamed itself Riot Blockchain, Inc. and redirected into cryptocurrency...</p>
        </div>
      </div>

      <BottomNav active={active} setActive={setActive} />
    </div>
  );
}