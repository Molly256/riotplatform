"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { COUNTRIES } from "../lib/countries";

export const dynamic = 'force-dynamic';

export default function LoginPage() {
  const router = useRouter();
  const [selectedCountry, setSelectedCountry] = useState(COUNTRIES.find(c=>c.code==="+256") || COUNTRIES[0]);
  const [showCountries, setShowCountries] = useState(false);
  const [search, setSearch] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [show, setShow] = useState(false);

  const filtered = COUNTRIES.filter(c=> c.name.toLowerCase().includes(search.toLowerCase()) || c.code.includes(search));

  const handleLogin = (e) => {
    e.preventDefault();
    router.push("/dashboard");
  };

  return (
    <div className="min-h-screen bg-white flex flex-col items-center">
      <div className="w-full bg-white">
        <img src="/riot.png" alt="RIOT PLATFORM" className="w-full h-auto object-contain block mix-blend-multiply" />
      </div>
      <div className="w-full max-w-[340px] px-6 pb-10">
        <h2 className="text-[22px] font-extrabold text-black">Welcome back</h2>
        <p className="text-[12.5px] text-gray-600 mt-1">Login to RIOT PLATFORM</p>
        <form onSubmit={handleLogin} className="w-full mt-5 flex flex-col gap-3">
          <div className="relative">
            <div className="h-[48px] flex items-center rounded-xl border-[1.5px] border-[#0A84FF] bg-[#F1F6FF]">
              <button type="button" onClick={()=>{setShowCountries(!showCountries); setSearch("");}} className="h-full px-3 flex items-center gap-1.5 bg-white border-r rounded-l-xl">
                <span className="text-[18px]">{selectedCountry.flag}</span><span className="text-[12px] font-bold text-black">{selectedCountry.code}</span><span className="text-[8px]">▼</span>
              </button>
              <input value={phone} onChange={e=>setPhone(e.target.value.replace(/[^0-9]/g,""))} placeholder="772 229 389" className="flex-1 h-full bg-transparent px-3 outline-none text-[13.5px] text-black" />
            </div>
            {showCountries && (
              <div className="absolute z-20 top-[52px] w-full bg-white border border-[#0A84FF] rounded-xl shadow-xl overflow-hidden">
                <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search country or code" className="w-full h-[40px] px-3 border-b outline-none text-[13px] text-black" />
                <div className="max-h-[220px] overflow-y-auto">
                  {filtered.map(c=>(
                    <button key={c.name} type="button" onClick={()=>{setSelectedCountry(c); setShowCountries(false);}} className="w-full flex items-center gap-2 px-3 py-2.5 hover:bg-[#F1F6FF] text-left">
                      <span className="text-[18px]">{c.flag}</span><span className="text-[13px] flex-1 text-black">{c.name}</span><span className="text-[11px] font-bold text-[#0A84FF]">{c.code}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
          <div className="h-[48px] flex items-center gap-3 px-4 rounded-xl border-[1.5px] border-[#0A84FF] bg-[#F1F6FF]">
            <input type={show?"text":"password"} value={password} onChange={e=>setPassword(e.target.value)} placeholder="Enter password" className="flex-1 bg-transparent outline-none text-[13.5px] text-black" />
            <button type="button" onClick={()=>setShow(!show)} className="text-[12px]">{show?"🙈":"👁️"}</button>
          </div>
          <button type="submit" className="h-[48px] rounded-xl bg-[#0A84FF] text-white font-bold text-[16px] mt-2">Sign In</button>
          <p className="text-center text-[11px] mt-3 text-black">Don't have account? <a href="/register" className="text-[#0A84FF] font-bold">Create account</a></p>
        </form>
      </div>
    </div>
  );
}