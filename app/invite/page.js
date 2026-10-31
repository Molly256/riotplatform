"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import BottomNav from "@/components/BottomNav";

export default function InvitePage() {
  const [user, setUser] = useState(null);
  const [copiedLink, setCopiedLink] = useState(false);
  const [copiedCode, setCopiedCode] = useState(false);
  const APP_BASE_URL = "https://riotplatform-swart.vercel.app";

  useEffect(() => {
    const saved = JSON.parse(localStorage.getItem("currentUser") || "null");
    setUser(saved);
  }, []);

  const inviteCode = user?.inviteCode || user?.referralCode || user?.userId || "------";
  const inviteLink = `${APP_BASE_URL}/r/${inviteCode}`;

  const copyLink = async () => {
    await navigator.clipboard.writeText(inviteLink);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };
  const copyCode = async () => {
    await navigator.clipboard.writeText(inviteCode);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-[#101319] flex items-center justify-center pb-[90px]">
        <Link href="/login" className="px-6 py-2 rounded-full bg-[#EBA043] text-black font-bold">Login to get invite link</Link>
        <BottomNav />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#101319] pb-[100px]">
      <div className="px-4 pt-6 flex items-center gap-3">
        <Link href="/" className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center text-white">←</Link>
        <h1 className="text-[24px] font-black bg-gradient-to-r from-[#EBA043] to-[#F7C978] bg-clip-text text-transparent">Invite</h1>
      </div>

      <div className="px-4 mt-6">
        <div className="bg-[#1A1E2A] rounded-[18px] p-4">
          <p className="text-[13px] text-white/50 mb-2">Invitation link</p>
          <div className="flex items-center justify-between gap-3 bg-[#101319] rounded-[12px] px-3 py-3 border border-white/10">
            <p className="text-[13px] text-white truncate flex-1">{inviteLink}</p>
            <button onClick={copyLink} className="shrink-0 w-9 h-9 rounded-[10px] bg-[#EBA043] flex items-center justify-center">{copiedLink ? "✓" : "📋"}</button>
          </div>
          <div className="mt-4 flex items-center justify-between">
            <div>
              <p className="text-[13px] text-white/50">My Invite Code</p>
              <p className="text-[22px] font-black text-white mt-1 tracking-widest">{inviteCode}</p>
            </div>
            <button onClick={copyCode} className="px-5 h-10 rounded-full bg-gradient-to-r from-[#EBA043] to-[#F7C978] text-black font-bold text-[13px]">{copiedCode ? "Copied!" : "Copy Code"}</button>
          </div>
        </div>

        <div className="mt-6 bg-[#1A1E2A] rounded-[18px] p-5">
          <p className="text-[15px] text-white leading-[22px]">Invite friends and family to stake earn daily and also earn <span className="text-[#EBA043] font-bold">turbocharge</span> endless rewards</p>
          <div className="mt-6 space-y-4">
            <p className="text-[14px] font-bold text-white">Earn</p>
            <div className="flex items-center justify-between p-3 rounded-[12px] bg-[#242A3A]"><span className="text-white font-semibold text-[14px]">10% from Team A successful invites</span><span className="text-[#EBA043] font-black text-[18px]">10%</span></div>
            <div className="flex items-center justify-between p-3 rounded-[12px] bg-[#242A3A]"><span className="text-white font-semibold text-[14px]">2% from Team B successful invites</span><span className="text-[#EBA043] font-black text-[18px]">2%</span></div>
            <div className="flex items-center justify-between p-3 rounded-[12px] bg-[#242A3A]"><span className="text-white font-semibold text-[14px]">1% from Team C successful invites</span><span className="text-[#EBA043] font-black text-[18px]">1%</span></div>
          </div>
        </div>
      </div>
      <BottomNav />
    </div>
  );
}