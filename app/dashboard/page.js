"use client";
import { useState, useEffect } from "react";
import BottomNav from "@/components/BottomNav";

// FIX 1: Move this array OUTSIDE of the DashboardPage function completely
const SLIDES = ["/1.jpg","/2.jpg","/3.jpg","/4.jpg","/5.jpg","/6.jpg","/7.jpg","/8.jpg","/9.jpg"];

export default function DashboardPage() {
  const [active, setActive] = useState("home");
  const [currentSlide, setCurrentSlide] = useState(0);

  useEffect(() => {
    // FIX 2: Reference the static SLIDES length instead of a re-created variable
    const timer = setInterval(() => setCurrentSlide((p) => (p + 1) % SLIDES.length), 3000);
    return () => clearInterval(timer);
  }, []); // Safe empty dependency array because SLIDES is static now

  return (
    <div className="min-h-screen bg-white pb-[100px]">
      <div className="w-full bg-white">
        <img src="/riot-header.png" alt="RIOT PLATFORM" className="w-full h-[90px] object-contain bg-white" />
      </div>

      <div className="w-full bg-white">
        <div className="w-full h-auto relative overflow-hidden bg-white">
          {/* FIX 3: Update references to use SLIDES */}
          <img key={currentSlide} src={SLIDES[currentSlide]} alt="" className="w-full h-auto object-contain bg-white transition-opacity duration-700" />
        </div>
        <div className="flex justify-center gap-2 py-3 bg-white">
          {SLIDES.map((_,i) => <div key={i} className={`h-2 rounded-full transition-all ${i===currentSlide?"w-6 bg-[#2ea8ff]":"w-2 bg-gray-300"}`} />)}
        </div>
      </div>

      <div className="w-full px-4 py-4 bg-white">
        <div className="bg-[#c6e2ff] rounded-[16px] px-4 py-2 mb-4">
          <h2 className="text-[20px] font-black text-[#2ea8ff]">ABOUT US</h2>
        </div>
        <div className="text-[14px] leading-[1.7] text-gray-800 space-y-4 px-1">
          <p>- Riot Platforms is mid-transformation from a pure-play bitcoin miner into a contracted AI data center landlord, and can be analyzed as three distinct businesses; in Q2 2026 it reported $174.2 million total revenue ($113.7 million mining, $37.3 million engineering, $23.2 million data center) and a $237.2 million GAAP net loss driven overwhelmingly by non-cash items, while mining still supplied roughly 65% of revenue.</p>
          <p>- The transition is exists contractually but not yet delivered or financed: Riot has 241 MW of executed critical IT capacity (AMD 50 MW; a "leading frontier AI lab," reported by Bloomberg and independently confirmed by CNBC's David Faber to be Anthropic, 191 MW) representing about $9.8 billion of undiscounted contracted revenue, yet the first 96 MW of the flagship lease is not scheduled to energize until December 2027 and its investment-grade credit backstop is still being finalized.</p>
          <p>- The core risks are financing and delivery, not demand: the 191 MW build alone implies roughly $2.1-$2.3 billion of capex against about $1.2 billion of liquidity (half of it bitcoin marked at spot); the equity is best understood as a call option on converting undiscounted headline contract values into financed, delivered, credit-backed net operating income.</p>
          <h3 className="text-[18px] font-black text-[#2ea8ff] pt-2">Key Findings</h3>
          <p>Riot Platforms is three businesses with three economic structures. The bitcoin mining operation earns volatile, unhedged revenue against a falling commodity price and rising global difficulty; the data center leasing operation earns contracted, long-duration, credit-dependent rent that has barely begun to flow; and the engineering segment earns project margin against a backlog that is now roughly 90% data-center work. These carry different capital intensities, risk profiles, and valuation frameworks, and blending them into a single narrative would mislead.</p>
        </div>
      </div>

      <div className="w-full bg-white py-2">
        <img src="/mid.jpg" alt="mid" className="w-full h-auto object-cover" />
      </div>

      <div className="w-full px-4 py-6 bg-white">
        <h2 className="text-[22px] font-black text-[#2ea8ff] mb-4">Details</h2>
        <div className="text-[14px] leading-[1.7] text-gray-800 space-y-4">
          <h3 className="text-[17px] font-black text-[#2ea8ff]">1. Corporate history and governance evolution</h3>
          <p>Riot began as Bioptix, Inc., a veterinary and biotechnology diagnostics business. In October 2017 it renamed itself Riot Blockchain, Inc. and redirected into cryptocurrency...</p>
        </div>
      </div>

      <BottomNav active={active} setActive={setActive} />
    </div>
  );
}