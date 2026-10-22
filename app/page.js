import Link from "next/link";
export default function Home(){
 return (
  <div className="min-h-screen bg-white flex flex-col items-center justify-center gap-6">
   <h1 className="text-[32px] font-black text-[#0A84FF]">RIOT PLATFORM</h1>
   <p className="font-bold">Stake with us.</p>
   <Link href="/register" className="bg-[#0A84FF] text-white px-10 py-4 rounded-xl font-bold">Create Account</Link>
   <Link href="/login" className="border-2 border-[#0A84FF] px-10 py-4 rounded-xl font-bold">Login</Link>
  </div>
 )
}