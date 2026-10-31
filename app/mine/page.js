"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import BottomNav from "@/components/BottomNav";

const LANGS = [
  { code: "en", label: "English", flag: "🇬🇧" },
  { code: "sw", label: "Kiswahili", flag: "🇹🇿" },
  { code: "zh", label: "Chinese", flag: "🇨🇳" },
  { code: "lg", label: "Luganda", flag: "🇺🇬" },
  { code: "fr", label: "French", flag: "🇫🇷" },
  { code: "ar", label: "Arabic", flag: "🇸🇦" },
  { code: "es", label: "Spanish", flag: "🇪🇸" },
];

const DICT = {
  en: { Mine:"Mine", TotalBalance:"Total Balance", TotalPowerDeposited:"Total Power Deposited", TotalWithdraw:"Total Withdraw", TodaysYield:"Today's Yield", TotalStake:"Total Stake", TotalTeamCommission:"Total Team Commission", TotalStakeYield:"Total Stake Yield", TotalTurbocharge:"Total Turbocharge", CredentialModification:"Credential Modification", InputOld:"Input old password", InputNew:"Input new password", ConfirmNew:"Confirm new password", SaveCred:"Save credentials", ChangeLang:"🌐 Change language", Logout:"🚪 Logout", NotLogged:"Not logged in", Login:"Login", ConfirmLogout:"Confirm Logout?", Stay:"Stay", Confirm:"Confirm", Saved:"Saved successful", FillAll:"Fill all fields", NoMatch:"New passwords don't match", InvalidPass:"Invalid old password", WEarned:"W earned", UGCEarned:"UGX earned" },
  lg: { Mine:"Wange", TotalBalance:"Omugatte gwonna", TotalPowerDeposited:"Amaanyi gonna", TotalWithdraw:"Okuzijja kwonna", TodaysYield:"Amagoba ga leero", TotalStake:"Stake yonna", TotalTeamCommission:"Commission ya Tiimu", TotalStakeYield:"Amagoba ga Stake", TotalTurbocharge:"Turbocharge yonna", CredentialModification:"Okukyusa Ebiwandiiko Ebikakasa", InputOld:"Yingiza password enkadde", InputNew:"Yingiza password empya", ConfirmNew:"Kakasa password empya", SaveCred:"Teeka ebiwandiiko ebikakasa", ChangeLang:"🌐 Kyusa olulimi", Logout:"🚪 Fuluma", NotLogged:"Tolina account", Login:"Yingira", ConfirmLogout:"Kakasa okufuluma?", Stay:"Sigala", Confirm:"Kakasa", Saved:"Kisigadde bulungi", FillAll:"Jjuza byonna", NoMatch:"Password empya tezikwatagana", InvalidPass:"Password enkadde si ntuufu", WEarned:"W", UGCEarned:"UGX efunye" },
  sw: { Mine:"Yangu", TotalBalance:"Salio Jumla", TotalPowerDeposited:"Nguvu Jumla", TotalWithdraw:"Jumla ya Kutoa", TodaysYield:"Mapato ya Leo", TotalStake:"Hisa Jumla", TotalTeamCommission:"Kamisheni ya Timu", TotalStakeYield:"Mapato ya Hisa", TotalTurbocharge:"Turbocharge Jumla", CredentialModification:"Marekebisho ya Kitambulisho", InputOld:"Ingiza nenosiri la zamani", InputNew:"Ingiza nenosiri jipya", ConfirmNew:"Thibitisha nenosiri jipya", SaveCred:"Hifadhi kitambulisho", ChangeLang:"🌐 Badilisha lugha", Logout:"🚪 Toka", NotLogged:"Hujaingia", Login:"Ingia", ConfirmLogout:"Thibitisha Kutoka?", Stay:"Baki", Confirm:"Thibitisha", Saved:"Imehifadhiwa", FillAll:"Jaza zote", NoMatch:"Nenosiri hazilingani", InvalidPass:"Nenosiri la zamani si sahihi", WEarned:"W", UGCEarned:"UGX" },
  zh: { Mine:"我的", TotalBalance:"总余额", TotalPowerDeposited:"总存入算力", TotalWithdraw:"总提现", TodaysYield:"今日收益", TotalStake:"总质押", TotalTeamCommission:"团队佣金", TotalStakeYield:"质押收益", TotalTurbocharge:"总加速", CredentialModification:"修改凭证", InputOld:"输入旧密码", InputNew:"输入新密码", ConfirmNew:"确认新密码", SaveCred:"保存凭证", ChangeLang:"🌐 更改语言", Logout:"🚪 退出", NotLogged:"未登录", Login:"登录", ConfirmLogout:"确认退出？", Stay:"留下", Confirm:"确认", Saved:"保存成功", FillAll:"填写所有字段", NoMatch:"新密码不匹配", InvalidPass:"旧密码无效", WEarned:"W", UGCEarned:"UGX" },
  fr: { Mine:"Mien", TotalBalance:"Solde Total", TotalPowerDeposited:"Puissance Totale", TotalWithdraw:"Retrait Total", TodaysYield:"Rendement du Jour", TotalStake:"Mise Totale", TotalTeamCommission:"Commission d'Équipe", TotalStakeYield:"Rendement Mise", TotalTurbocharge:"Turbocharge Total", CredentialModification:"Modification d'Identifiants", InputOld:"Ancien mot de passe", InputNew:"Nouveau mot de passe", ConfirmNew:"Confirmer nouveau mot de passe", SaveCred:"Enregistrer", ChangeLang:"🌐 Changer langue", Logout:"🚪 Déconnexion", NotLogged:"Non connecté", Login:"Connexion", ConfirmLogout:"Confirmer déconnexion?", Stay:"Rester", Confirm:"Confirmer", Saved:"Enregistré", FillAll:"Remplir tout", NoMatch:"Mots de passe différents", InvalidPass:"Ancien mot de passe invalide", WEarned:"W", UGCEarned:"UGX" },
  ar: { Mine:"حسابي", TotalBalance:"الرصيد الإجمالي", TotalPowerDeposited:"إجمالي الطاقة المودعة", TotalWithdraw:"إجمالي السحب", TodaysYield:"عائد اليوم", TotalStake:"إجمالي الحصة", TotalTeamCommission:"عمولة الفريق", TotalStakeYield:"عائد الحصة", TotalTurbocharge:"الشحن التوربيني", CredentialModification:"تعديل البيانات", InputOld:"أدخل كلمة المرور القديمة", InputNew:"أدخل كلمة المرور الجديدة", ConfirmNew:"تأكيد كلمة المرور الجديدة", SaveCred:"حفظ البيانات", ChangeLang:"🌐 تغيير اللغة", Logout:"🚪 تسجيل خروج", NotLogged:"غير مسجل", Login:"دخول", ConfirmLogout:"تأكيد الخروج؟", Stay:"البقاء", Confirm:"تأكيد", Saved:"تم الحفظ", FillAll:"املأ كل الحقول", NoMatch:"كلمات المرور غير متطابقة", InvalidPass:"كلمة المرور القديمة غير صحيحة", WEarned:"W", UGCEarned:"UGX" },
  es: { Mine:"Mío", TotalBalance:"Saldo Total", TotalPowerDeposited:"Potencia Total Depositada", TotalWithdraw:"Retiro Total", TodaysYield:"Rendimiento de Hoy", TotalStake:"Stake Total", TotalTeamCommission:"Comisión de Equipo", TotalStakeYield:"Rendimiento Stake", TotalTurbocharge:"Turbocharge Total", CredentialModification:"Modificación de Credenciales", InputOld:"Contraseña antigua", InputNew:"Contraseña nueva", ConfirmNew:"Confirmar contraseña nueva", SaveCred:"Guardar credenciales", ChangeLang:"🌐 Cambiar idioma", Logout:"🚪 Cerrar sesión", NotLogged:"No conectado", Login:"Iniciar sesión", ConfirmLogout:"¿Confirmar cierre?", Stay:"Quedarse", Confirm:"Confirmar", Saved:"Guardado", FillAll:"Llena todo", NoMatch:"Contraseñas no coinciden", InvalidPass:"Contraseña antigua inválida", WEarned:"W", UGCEarned:"UGX" },
};

export default function MinePage() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [avatar, setAvatar] = useState(null);
  const [balances, setBalances] = useState({ totalBalance: 0, totalPowerDeposited: 0, totalWithdraw: 0, todaysYield: 0, totalStake: 0, totalTeamCommission: 0, totalStakeYield: 0, totalTurbochargeWatts: 0, totalTurbochargeUGX: 0, totalTurboWattsEarned: 0 });
  const [oldPass, setOldPass] = useState("");
  const [newPass, setNewPass] = useState("");
  const [confPass, setConfPass] = useState("");
  const [toast, setToast] = useState("");
  const [showLangs, setShowLangs] = useState(false);
  const [showLogout, setShowLogout] = useState(false);
  const [currentLang, setCurrentLang] = useState("en");

  const t = (k) => DICT[currentLang]?.[k] || DICT["en"]?.[k] || k;

  useEffect(() => {
    const savedLang = localStorage.getItem("app_language") || "en";
    setCurrentLang(savedLang);
    // Clean google leftovers
    document.cookie = "googtrans=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
    localStorage.removeItem("googtrans");

    const saved = JSON.parse(localStorage.getItem("currentUser") || localStorage.getItem("user") || "null");
    setUser(saved);
    const av = localStorage.getItem("riot_avatar");
    if (av) setAvatar(av);
    let txs = JSON.parse(localStorage.getItem("transactions") || "[]");
    let cleanTxs = []; let hasReg = false;
    for(const tx of txs){ const ty=(tx.type||"").toLowerCase(); const isReg=ty.includes("regist")||ty.includes("bonus")||ty.includes("reward")||ty.includes("welcome")||ty.includes("signup"); if(isReg){ if(!hasReg){hasReg=true; cleanTxs.push(tx);} } else cleanTxs.push(tx);} if(cleanTxs.length!==txs.length){ txs=cleanTxs; localStorage.setItem("transactions", JSON.stringify(txs));}
    const todayStr=new Date().toLocaleDateString(); let totalPowerDeposited=0,totalWithdraw=0,todaysYield=0,totalStake=0,totalTeamCommission=0,totalStakeYield=0,totalTurbochargeUGX=0,totalRegistrationReward=0;
    txs.forEach(tx=>{ const amount=parseFloat(tx.amount||0)||0; const type=(tx.type||"").toLowerCase(); const date=tx.date||""; if(type.includes("regist")||type.includes("bonus")||type.includes("reward")||type.includes("signup")||type.includes("welcome")) totalRegistrationReward+=amount||1000; if(type.includes("deposit")||type.includes("power deposited")||type.includes("recharge")) totalPowerDeposited+=amount; if(type.includes("withdraw")) totalWithdraw+=amount; if(type.includes("team")&&type.includes("commission")) totalTeamCommission+=amount; if(type.includes("stake yield")||type.includes("daily yield")){ totalStakeYield+=amount; if(date.includes(todayStr)||(tx.dateObj&&new Date(tx.dateObj).toLocaleDateString()===todayStr)) todaysYield+=amount; } if(date.startsWith(todayStr)&&type.includes("yield")) todaysYield+=amount; if(type.includes("stake")&&!type.includes("yield")) totalStake+=amount; if(type.includes("turbocharge exchange")) totalTurbochargeUGX+=amount; });
    const totalBalanceLS=parseFloat(localStorage.getItem("totalBalance")||"0"); const calculatedTotal=totalPowerDeposited+totalTeamCommission+totalStakeYield+totalTurbochargeUGX+totalRegistrationReward; let totalBalance=calculatedTotal>0?calculatedTotal:totalBalanceLS; if(totalRegistrationReward>0&&totalBalance<1000) totalBalance=1000; if(totalRegistrationReward===0&&totalBalanceLS===0) totalBalance=0;
    const totalChargePower=parseFloat(localStorage.getItem("totalChargePower")||"0"); const turboHistory=JSON.parse(localStorage.getItem("turboHistory")||"[]"); const totalTurboWattsEarned=turboHistory.length>0?turboHistory.length*0.25:totalChargePower+(totalTurbochargeUGX/1000);
    setBalances({ totalBalance, totalPowerDeposited, totalWithdraw, todaysYield, totalStake, totalTeamCommission, totalStakeYield, totalTurbochargeWatts: totalChargePower, totalTurbochargeUGX, totalTurboWattsEarned });
  }, []);

  const onAvatar = (e)=>{ const file=e.target.files[0]; if(!file) return; const rd=new FileReader(); rd.onload=()=>{ setAvatar(rd.result); localStorage.setItem("riot_avatar", rd.result); }; rd.readAsDataURL(file); };

  const handleSaveCredentials = async ()=>{
    if(!oldPass||!newPass||!confPass){ setToast(t("FillAll")); setTimeout(()=>setToast(""),2000); return; }
    if(newPass!==confPass){ setToast(t("NoMatch")); setTimeout(()=>setToast(""),2500); return; }
    try{
      const userId=user?.userId||localStorage.getItem("userId");
      const res=await fetch("/api/auth/change-password", { method:"POST", headers:{"Content-Type":"application/json"}, body:JSON.stringify({ userId, oldPassword: oldPass, newPassword: newPass }) });
      const data=await res.json();
      if(!res.ok) throw new Error(data.error||t("InvalidPass"));
      localStorage.setItem("user_password", newPass);
      const curUser=JSON.parse(localStorage.getItem("currentUser")||"{}");
      curUser.password=newPass;
      localStorage.setItem("currentUser", JSON.stringify(curUser));
      localStorage.setItem("user", JSON.stringify(curUser));
      setToast(t("Saved")); setOldPass(""); setNewPass(""); setConfPass("");
      setTimeout(()=>setToast(""),2000);
    }catch(err){ setToast(err.message||t("InvalidPass")); setTimeout(()=>setToast(""),2500); }
  };

  // CLEAN language change - NO google, NO banner
  const changeLangGoogle = (code)=>{
    localStorage.setItem("app_language", code);
    document.cookie = "googtrans=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
    localStorage.removeItem("googtrans");
    setCurrentLang(code);
    setShowLangs(false);
    // Instant change - no reload needed, but we reload to update other pages
    window.location.reload();
  };

  const handleLogout = ()=>{
    localStorage.removeItem("currentUser"); localStorage.removeItem("user"); localStorage.removeItem("userId"); localStorage.removeItem("inviteCode");
    router.push("/login");
  };

  if(!user){ return (<div className="min-h-screen bg-[#101319] flex items-center justify-center pb-[90px]"><div className="text-center"><p className="text-white/60">{t("NotLogged")}</p><Link href="/login" className="mt-3 inline-block px-6 py-2 rounded-full bg-[#EBA043] text-black font-bold">{t("Login")}</Link></div><BottomNav /></div>); }

  const items=[
    { label: t("TotalBalance"), value: `${balances.totalBalance.toLocaleString()} UGX` },
    { label: t("TotalPowerDeposited"), value: `${balances.totalPowerDeposited.toLocaleString()} UGX` },
    { label: t("TotalWithdraw"), value: `${balances.totalWithdraw.toLocaleString()} UGX` },
    { label: t("TodaysYield"), value: `${balances.todaysYield.toLocaleString()} UGX` },
    { label: t("TotalStake"), value: `${balances.totalStake.toLocaleString()} UGX` },
    { label: t("TotalTeamCommission"), value: `${balances.totalTeamCommission.toLocaleString()} UGX` },
    { label: t("TotalStakeYield"), value: `${balances.totalStakeYield.toLocaleString()} UGX` },
    { label: t("TotalTurbocharge"), value: `${balances.totalTurbochargeWatts} W`, sub: `${balances.totalTurbochargeUGX.toLocaleString()} ${t("UGCEarned")}` },
  ];

  return (
    <div className="min-h-screen bg-[#101319] pb-[90px] pt-4">
      <h1 className="text-[#EBA043] text-[26px] font-bold text-center mb-5">{t("Mine")}</h1>
      <div className="mx-3 bg-[#1A1E2A] rounded-[20px] pt-8 pb-5 px-3">
        <div className="flex flex-col items-center">
          <label className="relative cursor-pointer">
            <input type="file" accept="image/*" className="hidden" onChange={onAvatar} />
            <div className="w-[88px] h-[88px] rounded-full border-[1.5px] border-dashed border-white/20 flex items-center justify-center overflow-hidden bg-[#242A3A]">
              {avatar ? <img src={avatar} alt="avatar" className="w-full h-full object-cover" /> : <span className="text-[44px] text-[#EBA043]">+</span>}
            </div>
            <div className="absolute bottom-0 right-0 w-[28px] h-[28px] rounded-full bg-[#EBA043] flex items-center justify-center border-[3px] border-[#1A1E2A]"><span className="text-black font-black text-[14px]">+</span></div>
          </label>
          <h2 className="mt-4 text-[22px] font-bold text-white">{user.username}</h2>
          <p className="mt-1 text-[14px] text-white/50">ID: {user.userId}</p>
        </div>
        <div className="mt-6 grid grid-cols-2 gap-3">
          {items.map((it,i)=>(<div key={i} className="h-[88px] rounded-[15px] bg-gradient-to-br from-[#EBA043] to-[#F7C978] flex flex-col items-center justify-center px-1"><p className="text-[12px] font-bold text-black text-center">{it.label}</p><p className="mt-1 text-[22px] font-black text-black">{it.value}</p>{it.sub&&<p className="text-[10px] font-bold text-black/60">{it.sub}</p>}</div>))}
        </div>

        <div className="mt-8">
          <h3 className="text-[#EBA043] text-[18px] font-black mb-3">{t("CredentialModification")}</h3>
          <div className="flex flex-col gap-3">
            <input type="password" value={oldPass} onChange={e=>setOldPass(e.target.value)} placeholder={t("InputOld")} className="h-[48px] w-full rounded-[12px] bg-[#151A28] border border-white/10 px-4 text-[14px] text-white placeholder:text-white/40 outline-none focus:border-[#EBA043]" />
            <input type="password" value={newPass} onChange={e=>setNewPass(e.target.value)} placeholder={t("InputNew")} className="h-[48px] w-full rounded-[12px] bg-[#151A28] border border-white/10 px-4 text-[14px] text-white placeholder:text-white/40 outline-none focus:border-[#EBA043]" />
            <input type="password" value={confPass} onChange={e=>setConfPass(e.target.value)} placeholder={t("ConfirmNew")} className="h-[48px] w-full rounded-[12px] bg-[#151A28] border border-white/10 px-4 text-[14px] text-white placeholder:text-white/40 outline-none focus:border-[#EBA043]" />
            <button onClick={handleSaveCredentials} className="h-[50px] w-full rounded-[12px] bg-[#EBA043] text-black font-black text-[15px]">{t("SaveCred")}</button>
          </div>
        </div>

        <div className="mt-6">
          <button onClick={()=>setShowLangs(!showLangs)} className="h-[50px] w-full rounded-[12px] bg-[#EBA043] text-black font-black text-[15px]">{t("ChangeLang")}</button>
          {showLangs && (
            <div className="mt-3 bg-[#151A28] rounded-[14px] border border-white/10 overflow-hidden">
              {LANGS.map(l=>(
                <button key={l.code} onClick={()=>changeLangGoogle(l.code)} className={`w-full h-[48px] flex items-center justify-between px-4 hover:bg-white/5 ${currentLang===l.code?"bg-[#EBA043]/10":""}`}>
                  <span className="text-white text-[14px] font-bold">{l.flag} {l.label}</span>
                  {currentLang===l.code && <span className="text-[#EBA043]">✓</span>}
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="mt-4">
          <button onClick={()=>setShowLogout(true)} className="h-[50px] w-full rounded-[12px] bg-[#EBA043] text-black font-black text-[15px]">{t("Logout")}</button>
        </div>
      </div>

      {showLogout && (
        <div className="fixed inset-0 bg-black/70 z-[1000] flex items-center justify-center p-4">
          <div className="w-full max-w-[320px] bg-[#1A1E2A] rounded-[18px] p-5 border border-white/10">
            <h4 className="text-white text-[16px] font-bold text-center">{t("ConfirmLogout")}</h4>
            <div className="mt-5 flex gap-3">
              <button onClick={()=>setShowLogout(false)} className="flex-1 h-[44px] rounded-[12px] bg-[#EBA043] text-black font-black text-[14px]">{t("Stay")}</button>
              <button onClick={handleLogout} className="flex-1 h-[44px] rounded-[12px] bg-[#C1272D] text-white font-black text-[14px]">{t("Confirm")}</button>
            </div>
          </div>
        </div>
      )}
      {toast && <div className="fixed bottom-[90px] left-1/2 -translate-x-1/2 bg-black border border-[#EBA043] text-white text-[13px] font-bold px-6 py-3 rounded-[12px] z-[9999]">{toast}</div>}
      <BottomNav />
    </div>
  );
}