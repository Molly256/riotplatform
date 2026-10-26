"use client";
import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { COUNTRIES } from "../lib/countries";

export const dynamic = 'force-dynamic';

export default function RegisterPage() {
  const router = useRouter();
  const [selectedCountry, setSelectedCountry] = useState(COUNTRIES.find(c=>c.code==="+256") || COUNTRIES[0]);
  const [showCountries, setShowCountries] = useState(false);
  const [phone, setPhone] = useState("");
  const [search, setSearch] = useState("");

  const filtered = useMemo(() => {
    return COUNTRIES.filter(c=> c.name.toLowerCase().includes(search.toLowerCase()) || c.code.includes(search)).slice(0,50);
  }, [search]);

  const handleSignUp = () => {
    router.push("/login");
  };

  return (
    <div className="min-h-screen bg-white flex flex-col items-center">
      <div className="w-full bg-white">
        <img src="/riot.png" alt="RIOT PLATFORM" className="w-full h-auto object-contain block mix-blend-multiply" />
      </div>

      <div className="w-full max-w-[340px] px-6 pb-10">
        <h2 className="text-[26px] font-black text-black mt-2">Create your account</h2>
        <p className="text-[13px] text-center text-gray-500 mt-2">Join RIOT PLATFORM and start staking</p>

        <div className="w-full mt-6 flex flex-col gap-3.5">
          <div className="relative">
            <div className="h-[50px] flex items-center rounded-xl border-[1.5px] border-[#0A84FF] bg-[#F1F6FF]">
              <button type="button" onClick={()=>{setShowCountries(!showCountries); setSearch("");}} className="h-full px-3 flex items-center gap-1.5 bg-white border-r border-[#0A84FF]/30 rounded-l-xl shrink-0">
                <span className="text-[18px]">{selectedCountry.flag}</span><span className="text-[12px] font-bold text-black">{selectedCountry.code}</span><span className="text-[8px]">▼</span>
              </button>
              <input value={phone} onChange={e=>setPhone(e.target.value.replace(/[^0-9]/g,""))} placeholder="772 229 389" className="flex-1 h-full bg-transparent px-3 outline-none text-[14px] text-black" />
            </div>
            {showCountries && (
              <div className="absolute z-50 top-[54px] w-full bg-white border border-[#0A84FF] rounded-xl shadow-xl overflow-hidden">
                <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search country or code" className="w-full h-[42px] px-3 border-b outline-none text-[13px] text-black" autoFocus />
                <div className="max-h-[240px] overflow-y-auto">
                  {filtered.map(c=>(
                    <button key={c.name} onClick={()=>{setSelectedCountry(c); setShowCountries(false);}} className="w-full flex items-center gap-2 px-3 py-2.5 hover:bg-[#F1F6FF] text-left">
                      <span className="text-[18px]">{c.flag}</span><span className="text-[13px] flex-1 text-black">{c.name}</span><span className="text-[11px] font-bold text-[#0A84FF]">{c.code}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div className="h-[50px] flex items-center gap-3 px-4 rounded-xl border-[1.5px] border-[#0A84FF] bg-[#F1F6FF]"><span>👤</span><input placeholder="Enter username" className="flex-1 bg-transparent outline-none text-[14px] text-black" /></div>
          <div className="h-[50px] flex items-center gap-3 px-4 rounded-xl border-[1.5px] border-[#0A84FF] bg-[#F1F6FF]"><span>✉️</span><input placeholder="Enter email" className="flex-1 bg-transparent outline-none text-[14px] text-black" /></div>
          <div className="h-[50px] flex items-center gap-3 px-4 rounded-xl border-[1.5px] border-[#0A84FF] bg-[#F1F6FF]"><span>🔒</span><input type="password" placeholder="Enter password" className="flex-1 bg-transparent outline-none text-[14px] text-black" /></div>
          <div className="h-[50px] flex items-center gap-3 px-4 rounded-xl border-[1.5px] border-[#0A84FF] bg-[#F1F6FF]"><span>🔒</span><input type="password" placeholder="Confirm password" className="flex-1 bg-transparent outline-none text-[14px] text-black" /></div>

          <button onClick={handleSignUp} className="h-[52px] rounded-xl bg-[#0A84FF] text-white font-bold text-[18px] mt-1 active:bg-blue-700">Sign Up</button>
          <p className="text-center text-[12px] mt-3 text-black">Already have account? <a href="/login" className="text-[#0A84FF] font-bold">Login</a></p>
        </div>
      </div>
    </div>
  );
}