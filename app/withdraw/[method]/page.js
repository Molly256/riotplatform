'use client'
import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useParams, useRouter } from 'next/navigation'

export default function WithdrawMethod() {
  const { method } = useParams()
  const router = useRouter()

  const [balance, setBalance] = useState('0')
  const [holderName, setHolderName] = useState('')
  const [walletNumber, setWalletNumber] = useState('')
  const [amount, setAmount] = useState('')
  const [toast, setToast] = useState(false)
  const [toastMsg, setToastMsg] = useState('')
  const [loading, setLoading] = useState(false)

  const isMTN = method === 'mtn'
  const title = isMTN ? 'MTN Mobile Money' : 'Airtel Money Uganda'

  useEffect(()=>{
    // 1. INSTANT: Show cached Mine total first - same as Mine page
    const safeLocal = (v) => Number(String(v || 0).replace(/,/g, '')) || 0
    try {
      const cachedTotals = JSON.parse(localStorage.getItem("riot_totals") || "null")
      if (cachedTotals) {
        setBalance(String(safeLocal(cachedTotals.totalBalance)))
      } else {
        const riotUser = JSON.parse(localStorage.getItem('riot_user') || localStorage.getItem('user') || '{}')
        const bal = safeLocal(localStorage.getItem('totalBalance') || riotUser.totalBalance || riotUser.balance || localStorage.getItem('riot_balance') || 0)
        if (bal > 0) setBalance(String(bal))
      }
    } catch {}

    // 2. FRESH: Fetch SAME as Mine page - /api/mine -> totals.totalBalance
    // NO TIME CHECK HERE - let them fill form freely
    const saved = JSON.parse(localStorage.getItem("riot_user") || localStorage.getItem("currentUser") || localStorage.getItem("user") || "null")
    const q = saved?.userId || saved?.id || localStorage.getItem("userId") || localStorage.getItem("rp_userId") || saved?.phone || ""
    if (!q) return

    fetch("/api/mine", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId: q }),
      cache: "no-store"
    })
      .then(r => r.json())
      .then(d => {
        if (d.success) {
          const t = d.totals || {}
          const u = d.user || {}
          const safe = (v) => Number(String(v || 0).replace(/,/g, '')) || 0
          // EXACT SAME KEY AS MINE PAGE
          const realBalance = safe(t.totalBalance ?? u.totalBalance ?? u.balance ?? 0)
          setBalance(String(realBalance))
          localStorage.setItem("totalBalance", String(realBalance))
          try {
            const oldTotals = JSON.parse(localStorage.getItem("riot_totals") || "{}")
            localStorage.setItem("riot_totals", JSON.stringify({ ...oldTotals, totalBalance: realBalance }))
          } catch {}
          const merged = { ...saved, ...u, totalBalance: realBalance, balance: realBalance }
          localStorage.setItem("riot_user", JSON.stringify(merged))
          localStorage.setItem("currentUser", JSON.stringify(merged))
          localStorage.setItem("user", JSON.stringify(merged))
        }
      })
      .catch(() => {})
  },[])

  const fee = amount ? Math.floor(Number(amount) * 0.1) : 0
  const receive = amount ? Number(amount) - fee : 0

  function triggerToast(msg){
    setToastMsg(msg || 'Something went wrong')
    setToast(true)
    setTimeout(()=>setToast(false), 3500)
  }

  // ONLY called on tap of Confirm Withdraw - NOT on load, NOT while typing
  function checkWithdrawTimeOnTap(){
    const nowUg = new Date(new Date().toLocaleString('en-US', { timeZone: 'Africa/Kampala' }));
    const day = nowUg.getDay(); // 0=Sunday
    const hour = nowUg.getHours();
    if(day === 0){
      triggerToast('Withdrawals are closed on Sunday. Available Monday to Saturday.');
      return false;
    }
    if(hour < 9 || hour >= 18){
      triggerToast('Withdrawals are only available Monday to Saturday from 9:00AM to 6:00PM Uganda time.');
      return false;
    }
    return true;
  }

  async function confirmWithdraw(){
    if(!amount || Number(amount) < 2000) return triggerToast('Minimum withdraw is 2,000 UGX')
    if(!holderName) return triggerToast('Enter Holders Names')
    if(!walletNumber) return triggerToast('Enter Wallet number')
    if(Number(amount) > Number(balance)) return triggerToast('Insufficient balance')
    // TIME CHECK ONLY HERE - on tap
    if(!checkWithdrawTimeOnTap()) return;

    setLoading(true)
    try{
      const riotUser = JSON.parse(localStorage.getItem('riot_user') || localStorage.getItem('user') || '{}')
      const userId = riotUser.userId || localStorage.getItem('userId') || riotUser.id
      const phone = riotUser.phone || ''
      const username = riotUser.username || ''

      if(!userId){ triggerToast('Login again'); setLoading(false); return; }

      const res = await fetch('/api/withdraw',{
        method:'POST',
        headers:{'Content-Type':'application/json'},
        body: JSON.stringify({ userId, phone, username, amount, holderName, walletNumber, method: title, fee, receive })
      })
      const j = await res.json()
      // BACK CHECK ALSO ONLY ON TAP - 1 per day, time, min - pops here
      if(!j.success){ triggerToast(j.error || j.message || 'Withdraw failed'); setLoading(false); return; }

      localStorage.setItem('riot_balance', String(j.newBalance))
      const updatedUser = {...riotUser, totalBalance: j.newBalance, balance: j.newBalance}
      localStorage.setItem('riot_user', JSON.stringify(updatedUser))
      localStorage.setItem('user', JSON.stringify(updatedUser))
      setBalance(String(j.newBalance))

      triggerToast('Withdraw pending - receive '+j.tx.receive+' UGX')
      setTimeout(()=>router.push('/transactions'), 1200)
    }catch(e){
      triggerToast('Error '+e.message)
    }
    setLoading(false)
  }

  return (
    <main className="min-h-screen bg-black text-white">
      <div className="w-full bg-[#EBA043] px-5 py-[14px] flex items-center gap-3 sticky top-0 z-50">
        <Link href="/withdraw" className="text-black text-[22px] font-black no-underline">←</Link>
        <h1 className="text-black font-black text-[15px] m-0">WITHDRAW</h1>
      </div>
      <div className="p-4 max-w-[480px] mx-auto">
        {/* Total balance - SAME as Mine page, SAME as /withdraw page */}
        <div className="bg-[#EBA043] rounded-[14px] p-4 mb-4">
          <p className="text-black text-[13px] font-bold">Total balance</p>
          <p className="text-black text-[28px] font-black mt-1">{Number(balance || 0).toLocaleString()} UGX</p>
          <p className="text-black/60 text-[11px] font-bold mt-1">{title}</p>
        </div>

        <div className="bg-[#12131A] border border-[#2A2C35] rounded-[14px] p-4 space-y-4">
          <div>
            <label className="text-[12px] font-bold text-[#8A8D98]">Holder's Names:</label>
            <input value={holderName} onChange={e=>setHolderName(e.target.value)} className="w-full mt-1 bg-black border border-[#2A2C35] rounded-[10px] p-3 text-white font-bold outline-none focus:border-[#EBA043]" placeholder="Enter full names" />
          </div>
          <div>
            <label className="text-[12px] font-bold text-[#8A8D98]">Wallet number:</label>
            <input value={walletNumber} onChange={e=>setWalletNumber(e.target.value)} className="w-full mt-1 bg-black border border-[#2A2C35] rounded-[10px] p-3 text-white font-bold outline-none focus:border-[#EBA043]" placeholder="07XXXXXXXX" />
          </div>
          <div>
            <label className="text-[12px] font-bold text-[#8A8D98]">Amount:</label>
            <input value={amount} onChange={e=>setAmount(e.target.value.replace(/[^0-9]/g,''))} className="w-full mt-1 bg-black border border-[#2A2C35] rounded-[10px] p-3 text-white font-bold outline-none focus:border-[#EBA043]" placeholder="2,000" />
            {amount && (
              <div className="mt-2 bg-[#1A1C24] rounded-[8px] p-3 flex justify-between">
                <span className="text-[#8A8D98] text-[12px] font-bold">Withdraw fee: 10%</span>
                <span className="text-[#EBA043] text-[12px] font-black">{fee} UGX</span>
              </div>
            )}
            {amount && <div className="mt-1 text-[#8A8D98] text-[11px] font-bold">You will receive: {receive} UGX</div>}
          </div>
        </div>
        <button disabled={loading} onClick={confirmWithdraw} className="w-full mt-6 py-4 bg-[#EBA043] text-black font-black rounded-[12px] text-[16px] disabled:opacity-60">{loading?'Processing...':'Confirm Withdraw'}</button>

        {/* Withdraw rules - EXACT 1:1 like /withdraw screenshot */}
        <div className="mt-8">
          <p className="text-[#EBA043] font-black text-[15px] mb-2">Withdraw rules</p>
          <div className="text-[#8A8D98] text-[13px] font-bold leading-6">
            <p>Withdraw Days: Monday to Saturday.</p>
            <p>Withdraw Time: 9:00am to 6:00pm</p>
            <p>Withdraw fee: 10%</p>
            <p>Minimum withdraw amount: 2,000 UGX</p>
          </div>
        </div>
      </div>
      {toast && <div className="fixed top-5 left-1/2 -translate-x-1/2 bg-[#EBA043] text-black px-6 py-3 rounded-[12px] font-black text-[13px] z-[9999] w-[90%] max-w-[360px] text-center">{toastMsg}</div>}
    </main>
  )
}