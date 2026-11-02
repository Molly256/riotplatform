'use client'
import { useState } from 'react'
import Link from 'next/link'
import { useParams, useSearchParams, useRouter } from 'next/navigation'

export default function DepositMethod() {
  const { method } = useParams()
  const searchParams = useSearchParams()
  const router = useRouter()

  const [amount, setAmount] = useState(searchParams.get('amount') || '20000')
  const [walletInput, setWalletInput] = useState('')
  const [proofName, setProofName] = useState('')
  const [toast, setToast] = useState(false)
  const [toastMsg, setToastMsg] = useState('')
  const [loading, setLoading] = useState(false)

  const isMTN = method === 'mtn'
  const data = isMTN ? {
    title: 'MTN Mobile Money',
    name: 'MALUKWAGO ALICE NORAH',
    wallet: '0789748247',
    network: 'MTN'
  } : {
    title: 'Airtel Money Uganda',
    name: 'NABADDA FARIDAH',
    wallet: '0732649967',
    network: 'AIRTEL'
  }

  function copyText(t){
    navigator.clipboard.writeText(t)
    setToastMsg(t + ' copied')
    setToast(true)
    setTimeout(()=>setToast(false), 2000)
  }

  async function confirmDeposit(){
    if(!amount || !walletInput) return alert('Input amount and wallet')
    if(!proofName) return alert('Select proof screenshot')
    
    setLoading(true)
    try{
      const riotUser = JSON.parse(localStorage.getItem('riot_user') || localStorage.getItem('user') || '{}')
      const userId = riotUser.userId || localStorage.getItem('userId') || localStorage.getItem('riot_userId') || riotUser.id
      const phone = riotUser.phone || localStorage.getItem('phone') || ''
      const username = riotUser.username || ''

      if(!userId){
        alert('Please login again - userId missing');
        setLoading(false)
        return
      }

      const res = await fetch('/api/deposit',{
        method:'POST',
        headers:{'Content-Type':'application/json'},
        body: JSON.stringify({ userId, phone, username, amount, walletInput, method: data.title })
      })
      const j = await res.json()
      if(!j.success){
        alert(j.error || 'Deposit failed')
        setLoading(false)
        return
      }

      const txs = JSON.parse(localStorage.getItem('riot_transactions') || '[]')
      txs.unshift(j.tx)
      localStorage.setItem('riot_transactions', JSON.stringify(txs))

      setToastMsg('Deposit pending - admin will confirm')
      setToast(true)
      setTimeout(()=>router.push('/transactions'), 1200)
    }catch(e){
      alert('Error: '+e.message)
    }
    setLoading(false)
  }

  return (
    <main className="min-h-screen bg-black text-white">
      <div className="w-full bg-[#EBA043] px-5 py-[14px] flex items-center gap-3 sticky top-0 z-50">
        <Link href="/deposit" className="text-black text-[22px] font-black no-underline">←</Link>
        <h1 className="text-black font-black text-[15px] m-0">{data.title}</h1>
      </div>
      <div className="p-4 max-w-[480px] mx-auto">
        <div className="bg-[#12131A] border border-[#2A2C35] rounded-[14px] p-4">
          <div className="flex justify-between items-center py-3 border-b border-[#23252F]">
            <span className="text-[#8A8D98] font-bold text-[14px]">Names:</span>
            <div className="flex items-center gap-2"><span className="font-black text-[14px]">{data.name}</span><button onClick={()=>copyText(data.name)} className="bg-[#23252F] p-1.5 rounded">📋</button></div>
          </div>
          <div className="flex justify-between items-center py-3 border-b border-[#23252F]">
            <span className="text-[#8A8D98] font-bold text-[14px]">Wallet:</span>
            <div className="flex items-center gap-2"><span className="font-black text-[14px]">{data.wallet}</span><button onClick={()=>copyText(data.wallet)} className="bg-[#23252F] p-1.5 rounded">📋</button></div>
          </div>
          <div className="flex justify-between items-center py-3">
            <span className="text-[#8A8D98] font-bold text-[14px]">Network:</span>
            <span className="font-black text-[14px]">{data.network}</span>
          </div>
        </div>
        <div className="mt-6 space-y-4">
          <div><label className="text-[12px] font-bold text-[#8A8D98]">Please input amount</label><input value={amount} onChange={e=>setAmount(e.target.value.replace(/[^0-9]/g,''))} className="w-full mt-1 bg-[#12131A] border border-[#2A2C35] rounded-[10px] p-3 text-white font-bold outline-none focus:border-[#EBA043]" /></div>
          <div><label className="text-[12px] font-bold text-[#8A8D98]">Please input wallet number that paid</label><input value={walletInput} onChange={e=>setWalletInput(e.target.value)} className="w-full mt-1 bg-[#12131A] border border-[#2A2C35] rounded-[10px] p-3 text-white font-bold outline-none focus:border-[#EBA043]" placeholder="07XXXXXXXX" /></div>
          <div><label className="text-[12px] font-bold text-[#8A8D98]">Transaction proof</label><label className="w-full mt-1 bg-[#12131A] border border-dashed border-[#EBA043] rounded-[10px] p-4 flex flex-col items-center justify-center cursor-pointer"><input type="file" accept="image/*" onChange={e=>{ if(e.target.files[0]) setProofName(e.target.files[0].name)}} className="hidden" /><span className="text-[22px]">📷</span><span className="text-[#8A8D98] text-[12px] font-bold mt-1">{proofName || 'Tap to select screenshot from gallery'}</span></label></div>
        </div>
        <button disabled={loading} onClick={confirmDeposit} className="w-full mt-8 py-4 bg-[#EBA043] text-black font-black rounded-[12px] text-[16px] disabled:opacity-60">{loading?'Processing...':'Confirm deposit'}</button>
      </div>
      {toast && <div className="fixed top-5 left-1/2 -translate-x-1/2 bg-[#EBA043] text-black px-6 py-3 rounded-[12px] font-black text-[13px] z-[9999]">{toastMsg}</div>}
    </main>
  )
}