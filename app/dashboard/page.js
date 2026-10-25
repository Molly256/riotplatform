"use client";
import { useState, useEffect } from "react";
import BottomNav from "../../components/BottomNav";

export default function DashboardPage() {
  const [active, setActive] = useState("home");
  const [currentSlide, setCurrentSlide] = useState(0);

  const slides = ["/1.jpg","/2.jpg","/3.jpg","/4.jpg","/5.jpg","/6.jpg","/7.jpg","/8.jpg","/9.jpg"];

  useEffect(() => {
    const timer = setInterval(() => setCurrentSlide((p) => (p + 1) % slides.length), 3000);
    return () => clearInterval(timer);
  }, [slides.length]);

  return (
    <div className="min-h-screen bg-white pb-[100px]">
      
      {/* HEADER LOGO - Full width little height, white dissolves */}
      <div className="w-full bg-white">
        <img src="/riot-header.png" alt="RIOT PLATFORM" className="w-full h-[90px] object-contain bg-white" />
      </div>

      {/* SLIDER - Full width medium height auto */}
      <div className="w-full bg-white">
        <div className="w-full h-[220px] md:h-[340px] relative overflow-hidden">
          {slides.map((src,i) => (
            <img key={i} src={src} alt="" className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-700 ${i===currentSlide?"opacity-100":"opacity-0"}`} />
          ))}
        </div>
        <div className="flex justify-center gap-2 py-3 bg-white">
          {slides.map((_,i) => <div key={i} className={`h-2 rounded-full transition-all ${i===currentSlide?"w-6 bg-[#2ea8ff]":"w-2 bg-gray-300"}`} />)}
        </div>
      </div>

      {/* ABOUT US - Creamy Hot Sky Blue Header */}
      <div className="w-full px-4 py-4 bg-white">
        <div className="bg-[#c6e2ff] rounded-[16px] px-4 py-2 mb-4">
          <h2 className="text-[20px] font-black text-[#2ea8ff]">ABOUT US</h2>
        </div>
        <div className="text-[14px] leading-[1.7] text-gray-800 space-y-4 px-1">
          <p>- Riot Platforms is mid-transformation from a pure-play bitcoin miner into a contracted AI data center landlord, and can be analyzed as three distinct businesses; in Q2 2026 it reported $174.2 million total revenue ($113.7 million mining, $37.3 million engineering, $23.2 million data center) and a $237.2 million GAAP net loss driven overwhelmingly by non-cash items, while mining still supplied roughly 65% of revenue [1][2].</p>
          <p>- The transition is exists contractually but not yet delivered or financed: Riot has 241 MW of executed critical IT capacity (AMD 50 MW; a "leading frontier AI lab," reported by Bloomberg and independently confirmed by CNBC's David Faber to be Anthropic, 191 MW) representing about $9.8 billion of undiscounted contracted revenue, yet the first 96 MW of the flagship lease is not scheduled to energize until December 2027 and its investment-grade credit backstop is still being finalized [2][4][6][41].</p>
          <p>- The core risks are financing and delivery, not demand: the 191 MW build alone implies roughly $2.1-$2.3 billion of capex against about $1.2 billion of liquidity (half of it bitcoin marked at spot); the equity is best understood as a call option on converting undiscounted headline contract values into financed, delivered, credit-backed net operating income [1][2][6].</p>
          
          <h3 className="text-[18px] font-black text-[#2ea8ff] pt-2">Key Findings</h3>
          <p>Riot Platforms is three businesses with three economic structures. The bitcoin mining operation earns volatile, unhedged revenue against a falling commodity price and rising global difficulty; the data center leasing operation earns contracted, long-duration, credit-dependent rent that has barely begun to flow; and the engineering segment earns project margin against a backlog that is now roughly 90% data-center work [1][2]. These carry different capital intensities, risk profiles, and valuation frameworks, and blending them into a single narrative would mislead.</p>
          <p>The data cutoff for this report is Riot's Form 10-Q for the quarter ended June 30, 2026 (filed August 10, 2026), the concurrent Q2 2026 earnings materials and 8-K exhibits, and the FY2025 Form 10-K [1][2][3]. This subject moves in weeks, not quarters: the 191 MW lease and the Corsicana campus letter of intent were both disclosed on August 10, 2026, subsequent to the quarter that the same filing reported [6][7].</p>
          <p>Three facts most change a reader's prior. <b>First,</b> mining became cash-negative on a fully-loaded basis in Q2 2026: cost to mine including depreciation was $90,631 against a production value of $71,667 per bitcoin, though the fleet stayed cash-positive excluding depreciation ($49,912 cost to mine) [2]. <b>Second,</b> the headline lease values are undiscounted multi-decade sums contingent on capacity that does not yet exist [6]. <b>Third,</b> Riot has funded its pivot substantially by drawing down its bitcoin treasury, which fell from 19,273 BTC in mid-2025 to 11,380 by mid-2026 [1][25].</p>
        </div>
      </div>

      {/* MID IMAGE */}
      <div className="w-full bg-white py-2">
        <img src="/mid.jpg" alt="mid" className="w-full h-auto object-cover" />
      </div>

      {/* DETAILS SECTION */}
      <div className="w-full px-4 py-6 bg-white">
        <h2 className="text-[22px] font-black text-[#2ea8ff] mb-4">Details</h2>
        <div className="text-[14px] leading-[1.7] text-gray-800 space-y-4">
          
          <h3 className="text-[17px] font-black text-[#2ea8ff]">1. Corporate history and governance evolution</h3>
          <p>Riot began as Bioptix, Inc., a veterinary and biotechnology diagnostics business. In October 2017 it renamed itself Riot Blockchain, Inc. and redirected into cryptocurrency, with the stock spiking on investor enthusiasm to above $38 per share [10][11]. A February 2018 CNBC investigation flagged postponed annual meetings, insider selling after the name change, dilutive discounted placements to large investors, and a major shareholder selling while others bought; the report precipitated a decline of over 33% [11].</p>
          <p>The enforcement record must be stated precisely, because it targeted individuals rather than the operating company. In September 2018 the SEC charged Barry Honig, John O'Rourke (a former Riot chairman and CEO), and 18 other individuals and entities with participation in "classic pump-and-dump schemes" [12]; CNBC reported that the SEC case was unrelated to Riot Blockchain as such, and the specific counts concerned three other issuers [11]. Honig, formerly the largest shareholder at roughly 11.2% in January 2017</p>
          
          <p>Under Jason Les, CEO since 2021, Riot built through acquisition. It acquired Whinstone US (the Rockdale, Texas facility) from Northern Data in May 2021 for approximately $651 million ($80 million cash plus 11.8 million shares) [16][17]; the electrical-equipment and engineering business ESS Metron in December 2021 for approximately $50 million ($25 million cash plus up to 715,413 shares) [18][19]; and Kentucky-based Block Mining in 2024 for approximately $92.5 million, adding roughly 60 MW and entering the MISO market [20].</p>
          
          <p>The 2024 Bitfarms episode reflects poorly on capital allocation. Riot made public a hostile bid for Bitfarms Ltd. (NASDAQ/TSX:BITF) in May 2024 at US$2.30 per share (about $950 million equity value), disclosing a 9.25% stake [21]. Bitfarms rejected the offer and adopted a poison pill; Riot withdrew the price but kept buying, reaching nearly 19.9% (90,110,912 shares) [21][23]. A September 2024 settlement capped Riot's stake and seated a Riot-endorsed director [23]. Riot then unwound the position, selling to 14.3% by June 2025 at roughly $0.90 per share, well below cost, having deployed substantial capital at a critical top without gaining control [24][25].</p>

          <p>In December 2024 activist Starboard Value took a significant position and pressed Riot to convert mining sites to AI/HPC data centers, citing the Core Scientific/CoreWeave model [26][27]. This pressure shaped strategy: on January 21, 2025, Riot halted its planned 600 MW Phase II mining expansion at Corsicana, engaged consultant Altman Solon, and cut its 2025 self-mining hash rate target from 46.7 EH/s to 38.4 EH/s [28][29][30]. Riot also resolved a value-destructive legacy dispute: its Whinstone subsidiary acquired Rhodium's Rockdale assets in April 2025 for $185 million total ($129.9 million cash, $6.1 million deposit return, $49 million in stock), assumed Rhodium's 125 MW, terminated hosting contracts that had produced an approximately $15 million gross loss in FY2024, and dismissed all litigation [31][32][44]; Rhodium confirmed a liquidating plan in December 2025 [33].</p>

          <p>The net governance assessment is mixed. Whinstone and Block Mining secured genuinely scarce power that now underpins the pivot, and the Rhodium settlement ended a loss-making contract; but the Bitfarms adventure destroyed capital, and the data center pivot was substantially prompted by an activist rather than initiated by management [21][24][26].</p>

          <h3 className="text-[17px] font-black text-[#2ea8ff] pt-4">2. Physical asset base and power position</h3>
          <p>Riot's competitive claim rests on holding energized, interconnected, permitted power at scale in ERCOT. As of 2025-2026 it owned more than 1,100 acres across two Texas campuses with 1.7 GW of approved power combined [22].</p>
          <p>The Rockdale campus (via Whinstone) holds roughly 700 MW of developed capacity and hosts both executed data center leases; after the Rhodium acquisition, 100% of Rockdale's power is allocated to Riot [22][31]. All 241 MW of contracted critical IT capacity sits at Rockdale on existing, fully approved interconnection [6][41]. The Corsicana campus in Navarro County holds 1 GW of fully approved ERCOT utility power on Riot-owned land, one of the largest single-site allocations of any miner or data center operator in Texas [22][28]. Riot expanded Corsicana in 2025 (355 acres in May, 238 in July, plus a 67-acre adjacent parcel) to roughly 858 acres [34]. Corsicana currently runs 400 MW of Phase I mining; the halted 600 MW Phase II is now targeted for AI/HPC [28][30].</p>
          <p>The gross-to-net distinction is central: Corsicana's 1 GW of gross utility power</p>
        </div>
      </div>

      <BottomNav active={active} setActive={setActive} />
    </div>
  );
}