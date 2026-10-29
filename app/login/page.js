"use client";
import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { COUNTRIES } from "../lib/countries";

export default function LoginPage() {
  const router = useRouter();
  const [selectedCountry, setSelectedCountry] = useState(COUNTRIES.find(c=>c.code==="+256") || COUNTRIES[0]);
  const [showCountries, setShowCountries] = useState(false);
  const [search, setSearch] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [show, setShow] = useState(false);
  const [loading, setLoading] = useState(false);

  const filtered = useMemo(() => {
    return COUNTRIES.filter(c=> c.name.toLowerCase().includes(search.toLowerCase()) || c.code.includes(search)).slice(0,50);
  }, [search]);

  const handleLogin = async (e) => {
    e.preventDefault();
    if (!phone || !password) {
      alert("Enter phone and password");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          phone,
          password,
          countryCode: selectedCountry.code,
          fullPhone: `${selectedCountry.code}${phone}`
        })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Login failed");
      router.push("/dashboard");
    } catch (err) {
      alert(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#141414] flex flex-col items-center">
      <div className="w-full bg-[#141414]">
        <img src="/riot.png" alt="RIOT PLATFORM" className="w-full h-auto object-contain block" />
      </div>
      <div className="w-full max-w-[340px] px-6 pb-10">
        <h2 className="text-[22px] font-extrabold text-white">Welcome back</h2>
        <p className="text-[12.5px] text-white/60 mt-1">Login to RIOT PLATFORM</p>
        <form onSubmit={handleLogin} className="w-full mt-5 flex flex-col gap-3">
          <div className="relative">
            <div className="h-[48px] flex items-center rounded-xl border-[1.5px] border-[#EBA043] bg-[#1E1E1E]">
              <button type="button" onClick={()=>{setShowCountries(!showCountries); setSearch("");}} className="h-full px-3 flex items-center gap-1.5 bg-[#262626] border-r border-[#EBA043]/30 rounded-l-xl shrink-0">
                <span className="text-[18px]">{selectedCountry.flag}</span><span className="text-[12px] font-bold text-white">{selectedCountry.code}</span><span className="text-[8px] text-white">▼</span>
              </button>
              <input value={phone} onChange={e=>setPhone(e.target.value.replace(/[^0-9]/g,""))} placeholder="772 229 389" className="flex-1 h-full bg-transparent px-3 outline-none text-[13.5px] text-white placeholder:text-white/40" />
            </div>
            {showCountries && (
              <div className="absolute z-50 top-[52px] w-full bg-[#1E1E1E] border border-[#EBA043] rounded-xl shadow-xl overflow-hidden">
                <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search country or code" className="w-full h-[40px] px-3 border-b border-white/10 bg-[#1E1E1E] outline-none text-[13px] text-white placeholder:text-white/40" autoFocus />
                <div className="max-h-[220px] overflow-y-auto">
                  {filtered.map(c=>(
                    <button key={c.name} type="button" onClick={()=>{setSelectedCountry(c); setShowCountries(false);}} className="w-full flex items-center gap-2 px-3 py-2.5 hover:bg-[#2A2A2A] text-left">
                      <span className="text-[18px]">{c.flag}</span><span className="text-[13px] flex-1 text-white">{c.name}</span><span className="text-[11px] font-bold text-[#EBA043]">{c.code}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
          <div className="h-[48px] flex items-center gap-3 px-4 rounded-xl border-[1.5px] border-[#EBA043] bg-[#1E1E1E]">
            <input type={show?"text":"password"} value={password} onChange={e=>setPassword(e.target.value)} placeholder="Enter password" className="flex-1 bg-transparent outline-none text-[13.5px] text-white placeholder:text-white/40" />
            <button type="button" onClick={()=>setShow(s=>!s)} className="text-[22px] min-w-[44px] h-[44px] flex items-center justify-center">
              {show?"🙈":"👁️"}
            </button>
          </div>
          <button type="submit" disabled={loading} className="h-[48px] rounded-xl bg-[#EBA043] text-black font-black text-[16px] mt-2 shadow-[0_4px_12px_rgba(235,160,67,0.3)] active:bg-[#D18A32] disabled:opacity-60">
            {loading ? "Signing In..." : "Sign In"}
          </button>
          <p className="text-center text-[11px] mt-3 text-white">Don't have account? <a href="/register" className="text-[#EBA043] font-bold">Create account</a></p>
        </form>
      </div>
    </div>
  );
}