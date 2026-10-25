import Link from "next/link";

export default function Home(){
 return (
  <div className="min-h-screen bg-white flex flex-col items-center justify-center px-6">
   <h1 className="text-[32px] font-black text-[#0A84FF] tracking-wide leading-none">RIOT PLATFORM</h1>
   <p className="text-[15px] font-bold text-[#0A84FF] mt-1">Where Stake Is a Priority.</p>
   
   <Link 
     href="/register" 
     className="mt-8 w-full max-w-[320px] h-[48px] bg-[#0A84FF] text-white flex items-center justify-center rounded-xl font-bold text-[16px] shadow-sm"
   >
     GET STARTED
   </Link>
  </div>
 )
}