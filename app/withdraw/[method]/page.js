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

  const isMTN = method === 'mtn'
  const title = isMTN ? 'MTN Mobile Money' : 'Airtel Money Uganda'

  useEffect(()=>{
    setBalance(localStorage.getItem('riot_balance') || '0')
  },[])

  const fee = amount ? Math.floor(Number(amount) * 0.1) : 0
  const receive = amount ? Number(amount) - fee : 0

  function triggerToast(msg){
    setToastMsg(msg)
    setToast(true)
    setTimeout(()=>setToast(false), 3000)
  }

  function getUgandaTime(){
    const now = new Date()
    const ugandaStr = now.toLocaleString('en-US', { timeZone: 'Africa/Kampala' })
    return new Date(ugandaStr)
  }

  function confirmWithdraw(){
    const ugTime = getUgandaTime()
    const day = ugTime.getDay()
    const hour = ugTime.getHours()
    const minute = ugTime.getMinutes()
    const totalMinutes = hour * 60 + minute

    if(day === 0) return triggerToast('No withdrawals on Sunday')
    if(totalMinutes < 540) return triggerToast('Not time for withdraw - opens at 9:00am')
    if(totalMinutes > 1080) return triggerToast('Not time for withdraw - closed at 6:00pm')
    if(!amount || Number(amount) < 2000) return triggerToast('Minimum withdraw is 2,000 UGX')
    if(!holderName) return triggerToast('Enter Holders Names')
    if(!walletNumber) return triggerToast('Enter Wallet number')
    if(Number(amount) > Number(balance)) return triggerToast('Insufficient balance')

    const txs = JSON.parse(localStorage.getItem('riot_transactions') || '[]')
    const today = ugTime.toDateString()
    const alreadyWithdrawnToday = txs.some(tx => {
      if(tx.type !== 'withdraw') return false
      const txDate = new Date(tx.fullDate || tx.date)
      const txUgandaStr = txDate.toLocaleString('en-US', { timeZone: 'Africa/Kampala' })
      const txUgandaDate = new Date(txUgandaStr).toDateString()
      return txUgandaDate === today && (tx.status === 'pending' || tx.status === 'success')
    })
    if(alreadyWithdrawnToday) return triggerToast('Only can withdraw once a day')

    // === FIX: DEDUCT FROM TOTAL BALANCE IMMEDIATELY (Mine page) ===
    const currentBal = Number(localStorage.getItem('riot_balance') || '0')
    const newBalance = currentBal - Number(amount) // deduct 2000
    localStorage.setItem('riot_balance', String(newBalance))
    // Also update any other balance key your Mine page might use
    if(localStorage.getItem('total_balance')) localStorage.setItem('total_balance', String(newBalance))
    if(localStorage.getItem('balance')) localStorage.setItem('balance', String(newBalance))
    setBalance(String(newBalance))

    // === FIX: PENDING SHOWS NET 1800 ===
    const newTx = {
      id: Date.now(),
      type: 'withdraw',
      method: title,
      holderName,
      wallet: walletNumber,
      amount: receive, // show 1800 in pending, not 2000
      originalAmount: amount,
      fee,
      receive,
      status: 'pending',
      date: ugTime.toLocaleString(),
      fullDate: new Date().toISOString(),
    }
    txs.unshift(newTx)
    localStorage.setItem('riot_transactions', JSON.stringify(txs))
    localStorage.setItem('riot_last_withdraw_date', today)

    triggerToast('Withdraw success')
    setTimeout(()=>router.push('/transactions'), 1200)
  }

  return (
    <main className="min-h-screen bg-black text-white">
      <div className="w-full bg-[#EBA043] px-5 py-[14px] flex items-center gap-3 sticky top-0 z-50">
        <Link href="/withdraw" className="text-black text-[22px] font-black no-underline">←</Link>
        <h1 className="text-black font-black text-[15px] m-0">WITHDRAW</h1>
      </div>
      <div className="p-4 max-w-[480px] mx-auto">
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
        <button onClick={confirmWithdraw} className="w-full mt-6 py-4 bg-[#EBA043] text-black font-black rounded-[12px] text-[16px]">Confirm Withdraw</button>
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