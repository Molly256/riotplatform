"use client";
import { useState, useEffect } from "react";
import BottomNav from "@/components/BottomNav";

export default function Page() {
  const [txs, setTxs] = useState([]);
  const [filter, setFilter] = useState("All");

  useEffect(() => {
    const load = async () => {
      const u = JSON.parse(localStorage.getItem("user") || localStorage.getItem("currentUser") || "{}");
      const userId = u.userId || localStorage.getItem("userId") || localStorage.getItem("rp_userId");
      let apiTxs = [];
      try {
        const r = await fetch("/api/transactions", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ userId }) });
        const j = await r.json(); if(j.success) apiTxs = j.txs || [];
      } catch {}
      let localTxs = JSON.parse(localStorage.getItem("transactions") || "[]");
      let all = [...apiTxs, ...localTxs].map(t=>{
        const ty = (t.type||"").toLowerCase();
        if(!t.type || ty.trim()==="") return {...t, type:"Registration Reward", amount:t.amount||1000, status:"Success"};
        if((ty.includes("regist")||ty.includes("bonus")||ty.includes("reward")) && !t.amount) return {...t, amount:1000, type:"Registration Reward"};
        return t;
      });
      // dedupe registration reward
      let deduped=[], hasReg=false;
      for(const t of all){
        const ty=(t.type||"").toLowerCase();
        const isReg=ty.includes("regist")||ty.includes("bonus")||ty.includes("reward")||ty.includes("welcome")||ty.includes("signup");
        if(isReg){ if(!hasReg){ hasReg=true; deduped.push(t);} } else deduped.push(t);
      }
      setTxs(deduped);
    }; load();
  }, []);

  const list = txs.filter(t=>{
    const type=(t.type||"").toLowerCase();
    if(filter==="All") return true;
    if(filter==="Deposit") return type==="deposit"||type.includes("regist")||type.includes("bonus")||type.includes("reward");
    if(filter==="Withdraw") return type==="withdrawal"||type==="withdraw";
    if(filter==="Commission") return type.includes("team")||type==="commission";
    return true;
  });

  return (
    <div className="min-h-screen bg-[#0A0A0A] px-3 pt-12 pb-[90px]">
      <h1 className="text-[#F5A23A] text-[26px] font-bold text-center mb-5">Transaction History</h1>
      <div className="flex gap-2 mb-4">
        {["All","Deposit","Withdraw","Commission"].map(tab=>(
          <button key={tab} onClick={()=>setFilter(tab)} className={`px-4 py-2 rounded-full text-[13px] font-bold border ${filter===tab?"bg-[#F5A23A] text-black border-[#F5A23A]":"text-[#F5A23A] border-[#F5A23A]/50 bg-transparent"}`}>{tab}</button>
        ))}
      </div>
      <div className="flex flex-col gap-3">
        {list.length===0 ? <p className="text-white/30 text-center mt-20">No transactions</p> : list.map((tx,i)=>{
          const type=(tx.type||"").toLowerCase(); const isFail=tx.status==="Failed"; const isPending=tx.status==="Pending";
          let label=""; let amount=""; let icon="↓";
          if(type.includes("regist")||type.includes("bonus")||type.includes("reward")||type.includes("welcome")||type.includes("signup")){ label="Registration Reward"; amount=`${Number(tx.amount||1000).toLocaleString()}UGX`; icon="🎁"; }
          else if(type==="deposit"){ label="Deposit"; amount=`${Number(tx.amount).toLocaleString()}UGX`; icon="↓"; }
          else if(type==="withdrawal"||type==="withdraw"){ label="Withdraw"; amount=`${Number(tx.amount).toLocaleString()}UGX`; icon="↑"; }
          else if(type.includes("team")||type==="commission"){ label="Commission"; amount=`${Number(tx.amount).toLocaleString()}UGX`; icon="◍"; }
          else if(type==="stake"){ label="Stake power"; amount=`${Number(tx.amount).toLocaleString()}UGX`; icon="🔒"; }
          else if(type.includes("yield")){ label="Today's yield"; amount=`${Number(tx.amount).toLocaleString()}UGX`; icon="🔒"; }
          else if(type.includes("turbo")){ label="Turbocharge"; const w=tx.power||tx.amount; amount=String(w).toUpperCase().includes('W')?String(w).toUpperCase():`${w}W`; icon="🔒"; }
          else { label=tx.type||"Transaction"; amount=`${Number(tx.amount||0).toLocaleString()}UGX`; icon="↓"; }

          const raw=tx.dateObj||tx.date||new Date();
          const d=new Date(new Date(raw).toLocaleString("en-US",{timeZone:"Africa/Kampala"}));
          const date=`${d.getDate()}/${d.getMonth()+1}/${d.getFullYear()}`;

          return (
            <div key={i} className="bg-[#151515] border border-[#F5A23A]/20 rounded-[14px] p-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className={`w-[42px] h-[42px] rounded-[10px] flex items-center justify-center ${isFail?"bg-[#C1272D]":"bg-[#F5A23A]"}`}><span className={`${isFail?"text-white":"text-black"} font-bold text-[18px]`}>{icon}</span></div>
                  <p className="text-white text-[14px] font-bold">{label}</p>
                </div>
                <p className="text-white font-black text-[14px]">{amount}</p>
              </div>
              <div className="flex justify-between items-center mt-2 ml-[54px]">
                <p className="text-white/50 text-[11px]">{date}</p>
                <span className={`text-[10px] px-3 py-1 rounded-full border ${isFail?"text-red-400 border-red-400/30 bg-red-900/20":isPending?"text-[#F5A23A] border-[#F5A23A]/30 bg-[#F5A23A]/10":"text-green-400 border-green-400/30 bg-green-900/20"}`}>{tx.status||"Success"}</span>
              </div>
            </div>
          )
        })}
      </div>
      <BottomNav />
    </div>
  );
}