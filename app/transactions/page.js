"use client";
import { useState, useEffect } from "react";
import BottomNav from "@/components/BottomNav";

export default function Page() {
  const [txs, setTxs] = useState([]);
  const [filter, setFilter] = useState("All");

  useEffect(() => {
    const u = JSON.parse(localStorage.getItem("user") || "{}");
    const userId = u.userId || localStorage.getItem("userId") || localStorage.getItem("rp_userId");
    fetch("/api/transactions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId }),
    }).then(r=>r.json()).then(j=>{ if(j.success) setTxs(j.txs) });
  }, []);

  const list = txs.filter(t=>{
    if(filter==="All") return true;
    if(filter==="Deposit") return t.type==="deposit";
    if(filter==="Withdrawal") return t.type==="withdrawal";
    if(filter==="Commission") return t.type.includes("team")||t.type.includes("commission")||t.type.includes("reward")||t.type.includes("stake");
    return true;
  });

  return (
    <div className="min-h-screen bg-[#0A0A0A] px-3 pt-12 pb-[90px]">
      <h1 className="text-[#F5A23A] text-[26px] font-bold text-center mb-5">Transaction History</h1>

      <div className="flex gap-2 mb-4">
        {["All","Deposit","Withdrawal","Commission"].map(tab=>(
          <button key={tab} onClick={()=>setFilter(tab)} className={`px-4 py-2 rounded-full text-[13px] font-bold border ${filter===tab?"bg-[#F5A23A] text-black border-[#F5A23A]":"text-[#F5A23A] border-[#F5A23A]/50 bg-transparent"}`}>{tab}</button>
        ))}
      </div>

      <div className="flex flex-col gap-3">
        {list.length===0 ? <p className="text-white/30 text-center mt-20">No transactions</p> : list.map((tx,i)=>{
          const isW = tx.type==="withdrawal";
          const isFail = tx.status==="Failed";
          const isPending = tx.status==="Pending";
          let title = tx.type==="deposit" ? "Deposit" : tx.type==="withdrawal" ? "Withdrawal" : tx.type.includes("team")||tx.type==="commission" ? "Commission" : "Staking Reward";
          let icon = isW ? "↑" : "↓";
          if(title==="Commission") icon="◍";
          if(title==="Staking Reward") icon="🔒";
          const amount = `${isW?"-":"+"}${Number(tx.amount).toLocaleString()} UGX`;
          const date = tx.date ? new Date(tx.date).toLocaleString('en-US',{month:'short',day:'2-digit',year:'numeric',hour:'2-digit',minute:'2-digit',hour12:true}) : "";
          return (
            <div key={i} className="bg-[#151515] border border-[#F5A23A]/20 rounded-[14px] p-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className={`w-[42px] h-[42px] rounded-[10px] flex items-center justify-center ${isFail?"bg-[#C1272D]":"bg-[#F5A23A]"}`}><span className={`${isFail?"text-white":"text-black"} font-bold text-[18px]`}>{icon}</span></div>
                  <div>
                    <p className="text-white font-bold text-[15px]">{title}</p>
                    <p className="text-[#F5A23A] font-bold text-[14px]">{amount}</p>
                  </div>
                </div>
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