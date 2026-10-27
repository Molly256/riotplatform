import Link from "next/link";

export const dynamic = 'force-dynamic';

export default function Home(){
 return (
  <div className="min-h-screen w-full bg-[#141414] flex flex-col items-center">
   
   {/* IMAGE FULL - CENTER */}
   <div className="flex-1 w-full flex items-center justify-center px-4">
     <img 
       src="/page.png" 
       alt="Riot Platform" 
       className="w-full max-w-[500px] h-auto object-contain"
     />
   </div>
   
   {/* GET STARTED BUTTON - ORANGE GOLD - A BIT LOW */}
   <div className="w-full flex flex-col items-center pb-[60px] px-6">
     <Link 
       href="/register" 
       className="w-full max-w-[320px] h-[52px] bg-[#EBA043] text-black flex items-center justify-center rounded-xl font-black text-[16px] shadow-[0_4px_12px_rgba(235,160,67,0.4)] tracking-wide"
     >
       GET STARTED
     </Link>
   </div>

  </div>
 )
}