'use client'
import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'

export default function Deposit() {
  const [balance, setBalance] = useState('0.00')
  const [amount, setAmount] = useState('20000')
  const [selected, setSelected] = useState('mtn')
  const [usdtRate, setUsdtRate] = useState(0)
  const router = useRouter()

  // Live USDT/UGX rate - not hardcoded
  useEffect(() => {
    fetch('https://api.coingecko.com/api/v3/simple/price?ids=tether&vs_currencies=ugx')
      .then(r => r.json())
      .then(d => {
        if (d?.tether?.ugx) setUsdtRate(d.tether.ugx)
      }).catch(() => {})
  }, [])

  const isCrypto = selected === 'crypto'
  const usdtAmount = usdtRate ? Number(amount) / usdtRate : 0
  const minUsdt = usdtRate ? (20000 / usdtRate).toFixed(2) : '...'

  useEffect(()=>{
    const u = JSON.parse(localStorage.getItem('riot_user') || localStorage.getItem('user') || '{}')
    const userId = u.userId || u.phone || u.id
    if(!userId){
      setBalance(localStorage.getItem('totalBalance') || '0')
      return
    }
    fetch("/api/mine", {
      method:"POST",
      headers:{"Content-Type":"application/json"},
      body: JSON.stringify({ userId })
    })
    .then(r=>r.json())
    .then(d=>{
      if(d.success){
        const realBal = Number(d.totals?.totalBalance ?? d.user?.totalBalance ?? 0)
        setBalance(realBal.toLocaleString())
        localStorage.setItem("riot_user", JSON.stringify(d.user))
        localStorage.setItem("user", JSON.stringify(d.user))
        localStorage.setItem("totalBalance", String(realBal))
      }
    }).catch(()=>{})

    const fb = Number(u.totalBalance || u.availableBalance || localStorage.getItem('totalBalance') || 0)
    if(fb) setBalance(fb.toLocaleString())
  },[])

  function goNext(){
    // Minimum 20,000 UGX for ALL including Crypto
    if(Number(amount) < 20000){
      return alert('Minimum deposit is 20,000 UGX')
    }
    if(isCrypto){
      if(!usdtRate) return alert('Loading USDT rate, try again')
      router.push(`/deposit/${selected}?amount=${amount}&usdtRate=${usdtRate}&usdtAmount=${usdtAmount.toFixed(2)}`)
      return
    }
    router.push(`/deposit/${selected}?amount=${amount}`)
  }

  return (
    <main className="min-h-screen bg-black text-white">
      <div className="w-full bg-[#EBA043] px-5 py-[14px] flex items-center gap-3 sticky top-0">
        <Link href="/dashboard" className="text-black text-[22px] font-black no-underline">←</Link>
        <h1 className="text-black font-black text-[18px] m-0">DEPOSIT</h1>
      </div>

      <div className="p-4 max-w-[480px] mx-auto">
        <div className="bg-[#12131A] border border-[#2A2C35] rounded-[16px] p-5">
          <div className="flex justify-between items-center">
            <span className="text-[#8A8D98] text-[15px] font-bold">Total balance</span>
            <span className="text-white font-black text-[26px]">{balance} UGX</span>
          </div>
          <div className="mt-6">
            <p className="text-white font-black text-[15px] mb-3">Deposit amount</p>
            <div className="border border-[#EBA043] rounded-[12px] p-4 bg-[#1A1C24]">
              <input value={amount} onChange={e=>setAmount(e.target.value.replace(/[^0-9]/g,''))} className="w-full bg-transparent text-white text-[26px] font-bold outline-none" />
              {isCrypto ? (
                <p className="text-[#EBA043] text-[12px] font-bold mt-2">
                  {usdtRate ? `≈ ${usdtAmount.toFixed(2)} USDT • 1 USDT = ${usdtRate.toLocaleString()} UGX • Minimum: 20,000 UGX (≈ ${minUsdt} USDT)` : 'Loading USDT rate...'}
                </p>
              ) : (
                <p className="text-[#EBA043] text-[12px] font-bold mt-2">Minimum deposit: 20,000 UGX ⓘ</p>
              )}
            </div>
          </div>
        </div>

        <p className="text-white font-black text-[16px] mt-6 mb-3">Payment method</p>

        <div className="flex flex-col gap-3">
          <div onClick={()=>setSelected('mtn')} className={`bg-[#12131A] rounded-[14px] p-4 flex items-center justify-between border cursor-pointer ${selected==='mtn'?'border-[#EBA043]':'border-[#2A2C35]'}`}>
            <div className="flex items-center gap-3">
              <img src="/mtn.png" className="w-[56px] h-[56px] rounded-[12px] bg-white object-cover" />
              <div><p className="font-black">MTN Mobile Money</p><p className="text-[#9A8B7A] text-[12px] font-bold">Mobile Money • Uganda 📱</p></div>
            </div>
            {selected==='mtn' && <div className="w-7 h-7 bg-[#EBA043] rounded-full flex items-center justify-center text-black font-black">✓</div>}
          </div>

          <div onClick={()=>setSelected('airtel')} className={`bg-[#12131A] rounded-[14px] p-4 flex items-center justify-between border cursor-pointer ${selected==='airtel'?'border-[#EBA043]':'border-[#2A2C35]'}`}>
            <div className="flex items-center gap-3">
              <img src="/airtel.png" className="w-[56px] h-[56px] rounded-[12px] bg-white object-cover" />
              <div><p className="font-black">Airtel Money Uganda</p><p className="text-[#9A8B7A] text-[12px] font-bold">Mobile Money • Uganda 📱</p></div>
            </div>
            {selected==='airtel' && <div className="w-7 h-7 bg-[#EBA043] rounded-full flex items-center justify-center text-black font-black">✓</div>}
          </div>

          <div onClick={()=>setSelected('crypto')} className={`bg-[#12131A] rounded-[14px] p-4 flex items-center justify-between border cursor-pointer ${selected==='crypto'?'border-[#EBA043]':'border-[#2A2C35]'}`}>
            <div className="flex items-center gap-3">
              <img src="/crypto.png" className="w-[56px] h-[56px] rounded-[12px] bg-white object-cover" />
              <div><p className="font-black">Crypto currency</p><p className="text-[#9A8B7A] text-[12px] font-bold">Crypto • USDT 💰</p></div>
            </div>
            {selected==='crypto' && <div className="w-7 h-7 bg-[#EBA043] rounded-full flex items-center justify-center text-black font-black">✓</div>}
          </div>
        </div>

        <button onClick={goNext} className="w-full mt-8 py-4 bg-[#EBA043] text-black font-black rounded-[12px]">Continue</button>
      </div>
    </main>
  )
}