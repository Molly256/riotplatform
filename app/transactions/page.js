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
      if(!userId) return;
      let apiTxs = [];
      try {
        const r = await fetch("/api/transactions", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ userId }) });
        const j = await r.json(); 
        if(j.success) apiTxs = j.txs || j.transactions || [];
      } catch {}
      let localTxs = JSON.parse(localStorage.getItem("transactions") || "[]");
      // merge + normalize
      let all = [...apiTxs, ...localTxs].map(t=>{
        try{ if(typeof t==='string') t=JSON.parse(t); }catch{}
        const ty = (t.type||"").toString().toLowerCase().trim();
        if(!t.type || ty==="") return {...t, type:"Registration Reward", amount:t.amount||1000, status:t.status||"success"};
        return t;
      });
      // sort by timestamp desc
      all.sort((a,b)=> Number(b.timestamp||b.createdAt||0) - Number(a.timestamp||a.createdAt||0));
      // dedupe registration reward to 1
      let deduped=[], hasReg=false;
      for(const t of all){
        const ty=(t.type||"").toString().toLowerCase();
        const isReg=ty.includes("regist")||ty.includes("welcome")||(ty.includes("bonus")&&!ty.includes("team"))||ty.includes("reward")||ty.includes("signup");
        if(isReg){ if(!hasReg){ hasReg=true; deduped.push(t);} } else deduped.push(t);
      }
      setTxs(deduped);
    }; load();
  }, []);

  const list = txs.filter(t=>{
    const type=(t.type||"").toString().toLowerCase();
    if(filter==="All") return true;
    if(filter==="Deposit") return type==="deposit" || type.includes("regist") || type.includes("bonus") && !type.includes("team") || type.includes("reward") || type.includes("welcome");
    if(filter==="Withdraw") return type==="withdrawal" || type==="withdraw" || type.includes("withdraw");
    if(filter==="Commission") return type.includes("team") && type.includes("payout") || type==="commission" || type.includes("commission") || type.includes("team_");
    if(filter==="Stake") return type==="stake" || type.includes("stake") && !type.includes("yield");
    if(filter==="Yield") return type.includes("yield") || type==="stake yield";
    if(filter==="Turbo") return type.includes("turbo");
    return true;
  });

  return (
    <div className="min-h-screen bg-[#0A0A0A] px-3 pt-12 pb-[90px]">
      <h1 className="text-[#F5A23A] text-[26px] font-bold text-center mb-5">Transaction History</h1>
      <div className="flex gap-2 mb-4 overflow-x-auto scrollbar-hide">
        {["All","Deposit","Withdraw","Commission","Stake","Yield","Turbo"].map(tab=>(
          <button key={tab} onClick={()=>setFilter(tab)} className={`px-4 py-2 rounded-full text-[13px] font-bold border whitespace-nowrap ${filter===tab?"bg-[#F5A23A] text-black border-[#F5A23A]":"text-[#F5A23A] border-[#F5A23A]/50 bg-transparent"}`}>{tab}</button>
        ))}
      </div>
      <div className="flex flex-col gap-3">
        {list.length===0 ? <p className="text-white/30 text-center mt-20">No transactions</p> : list.map((tx,i)=>{
          const rawType=(tx.type||"").toString();
          const type=rawType.toLowerCase();
          const statusRaw=(tx.status||"success").toString();
          const statusLow=statusRaw.toLowerCase();
          const isFail=statusLow==="failed"||statusLow==="rejected";
          const isPending=statusLow==="pending";
          let label=""; let amount=""; let icon="↓";
          
          if(type.includes("regist")||type.includes("welcome")||(type.includes("bonus")&&!type.includes("team"))||type.includes("reward")||type.includes("signup")){
            label="Registration Reward"; amount=`${Number(tx.amount||1000).toLocaleString()} UGX`; icon="🎁";
          }
          else if(type==="deposit"){
            label= tx.status==="pending" ? "Deposit pending" : "Deposit"; amount=`${Number(tx.amount).toLocaleString()} UGX`; icon="↓";
          }
          else if(type.includes("withdraw")){
            label= isPending ? "Withdraw pending" : "Withdraw"; 
            amount=`${Number(tx.originalAmount||tx.amount).toLocaleString()} UGX`; icon="↑";
          }
          else if(type.includes("team") && type.includes("payout") || type.includes("commission")){
            label= tx.label || `Commission ${type.includes("team_a")?"A":type.includes("team_b")?"B":type.includes("team_c")?"C":""}`; amount=`${Number(tx.amount).toLocaleString()} UGX`; icon="◍";
          }
          else if(type==="stake"){
            label="Stake power"; amount=`${Number(tx.amount).toLocaleString()} UGX`; icon="🔒";
          }
          else if(type.includes("yield") || type==="stake yield"){
            label="Stake Yield"; amount=`${Number(tx.amount).toLocaleString()} UGX`; icon="📈";
          }
          else if(type==="turbocharge exchange"){
            label="Turbo Exchange"; amount=`${Number(tx.amount).toLocaleString()} UGX (${tx.watts||tx.power}W)`; icon="⚡";
          }
          else if(type==="turbocharge"){
            label="Turbocharge"; const w=tx.power||tx.amount; amount=`${w}W`; icon="⚡";
          }
          else { label=rawType||"Transaction"; amount=`${Number(tx.amount||0).toLocaleString()} UGX`; icon="↓"; }

          // date
          let dateStr = tx.dateStr || tx.date || tx.createdAt || "";
          try{
            if(!dateStr.includes("/")){
              const d=new Date(tx.timestamp||Date.now());
              const ug=new Date(d.toLocaleString("en-US",{timeZone:"Africa/Kampala"}));
              dateStr=`${ug.getDate()}/${ug.getMonth()+1}/${ug.getFullYear()} ${String(ug.getHours()).padStart(2,'0')}:${String(ug.getMinutes()).padStart(2,'0')}`;
            }
          }catch{}
          const dateOnly = dateStr.split(" ")[0] || dateStr;

          return (
            <div key={tx.id||i} className="bg-[#151515] border border-[#F5A23A]/20 rounded-[14px] p-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className={`w-[42px] h-[42px] rounded-[10px] flex items-center justify-center ${isFail?"bg-[#C1272D]":"bg-[#F5A23A]"}`}><span className={`${isFail?"text-white":"text-black"} font-bold text-[18px]`}>{icon}</span></div>
                  <div><p className="text-white text-[14px] font-bold">{label}</p><p className="text-white/30 text-[10px]">{rawType}</p></div>
                </div>
                <p className="text-white font-black text-[13px]">{amount}</p>
              </div>
              <div className="flex justify-between items-center mt-2 ml-[54px]">
                <p className="text-white/50 text-[11px]">{dateOnly}</p>
                <span className={`text-[10px] px-3 py-1 rounded-full border capitalize ${isFail?"text-red-400 border-red-400/30 bg-red-900/20":isPending?"text-[#F5A23A] border-[#F5A23A]/30 bg-[#F5A23A]/10":"text-green-400 border-green-400/30 bg-green-900/20"}`}>{statusRaw}</span>
              </div>
            </div>
          )
        })}
      </div>
      <BottomNav />
    </div>
  );
}