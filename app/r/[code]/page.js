"use client";
import { useEffect } from "react";
import { useRouter, useParams } from "next/navigation";

export default function RefRedirect() {
  const router = useRouter();
  const params = useParams();
  const code = params.code;

  useEffect(() => {
    if (code) {
      const clean = code.toString().replace(/\D/g,'').slice(0,6);
      if (clean) {
        sessionStorage.setItem('activeInviterCode', clean);
        localStorage.setItem('referrer_code', clean);
        localStorage.setItem('referredBy', clean);
        router.replace(`/register?ref=${clean}`);
      } else {
        router.replace(`/register`);
      }
    }
  }, [code, router]);

  return (
    <div className="min-h-screen bg-[#141414] flex items-center justify-center">
      <p className="text-white text-[14px] font-bold">Redirecting...</p>
    </div>
  );
}