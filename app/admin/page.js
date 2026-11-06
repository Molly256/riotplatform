'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'

function splitUgDate(input){
  if(!input) return {date:'',time:''}
  const s=String(input).slice(0,19)
  const [d,t]=s.split(' ')
  if(d&&t) return {date:d,time:t}
  if(s.includes('T')){ const [dd,tt]=s.split('T'); return {date:dd,time:tt} }
  return {date:s.slice(0,10),time:s.slice(11,19)}
}

export default function Admin(){
  const router=useRouter()
  const [user,setUser]=useState(null)
  const [pending,setPending]=useState([])
  const [loading,setLoading]=useState(true)
  const [toast,setToast]=useState('')
  const [activeTab,setActiveTab]=useState('deposit')
  const [searchQ,setSearchQ]=useState('')
  const [foundUser,setFoundUser]=useState(null)
  const [showPwdBox,setShowPwdBox]=useState(false)
  const [newPwd,setNewPwd]=useState('')
  const [depositQ,setDepositQ]=useState('')
  const [depositUser,setDepositUser]=useState(null)
  const [showDepositBox,setShowDepositBox]=useState(false)
  const [depositAmount,setDepositAmount]=useState('')
  const [depositHistory,setDepositHistory]=useState([])
  const [withdrawHistory,setWithdrawHistory]=useState([])
  const [historyLoading,setHistoryLoading]=useState(false)
  const [giftCode,setGiftCode]=useState('')
  const [giftAmount,setGiftAmount]=useState('')
  const [giftNumberOfUsers,setGiftNumberOfUsers]=useState('1')

  const ADMIN_PHONES=['0753520252','+256753520252','256753520252']
  const normalize=(p='')=>{let s=String(p).replace(/\s/g,''); if(s.startsWith('+256')) s='0'+s.slice(4); if(s.startsWith('256')) s='0'+s.slice(3); return s}

  useEffect(()=>{
    const raw=localStorage.getItem('riot_user')||localStorage.getItem('user')||'{}'
    let lu={}; try{lu=JSON.parse(raw)}catch{}
    const phone=normalize(lu.phone||'')
    const isAdmin=ADMIN_PHONES.map(normalize).includes(phone)
    if(!phone||!isAdmin){ router.push('/dashboard'); return }
    setUser(lu)
    loadPending()
  },[])

  const loadPending=async()=>{
    setLoading(true)
    try{
      const res=await fetch('/api/admin?action=pending',{cache:'no-store'})
      const data=await res.json()
      if(data.success){
        const all = [...(data.deposits||[]),...(data.withdraws||[]),...(data.pending||[])]
        const map=new Map()
        all.forEach(t=>{ if(t?.id) map.set(t.id,t) })
        setPending([...map.values()])
      }
    }catch{}
    setLoading(false)
  }

  const loadHistory=async(type)=>{
    setHistoryLoading(true)
    try{
      const res=await fetch(`/api/admin?action=history&type=${type}`,{cache:'no-store'})
      const data=await res.json()
      if(data.success){
        if(type==='deposit') setDepositHistory(data.history||[])
        else setWithdrawHistory(data.history||[])
      }
    }catch{}
    setHistoryLoading(false)
  }

  const showToast=(m)=>{setToast(m); setTimeout(()=>setToast(''),2500)}

  const handleAction=async(tx,action)=>{
    setPending(prev=>prev.filter(t=>t.id!==tx.id))
    const res=await fetch('/api/admin',{
      method:'POST', headers:{'Content-Type':'application/json'},
      body: JSON.stringify({ action, txId: tx.id, id: tx.id, status: action })
    })
    const data=await res.json()
    if(data.success) showToast(`Transaction ${action==='success'?'approved':'rejected'} ✅`)
    else { showToast(data.error||'Failed'); loadPending() }
  }

  const searchUserForPwd=async()=>{
    if(!searchQ.trim()) return showToast('Enter phone / username / userId')
    const res=await fetch(`/api/admin?action=users&q=${encodeURIComponent(searchQ.trim())}`)
    const data=await res.json()
    if(data.success && data.users?.[0]){ setFoundUser(data.users[0]); setShowPwdBox(false) }
    else showToast('User not found')
  }

  const searchUserForDeposit=async()=>{
    if(!depositQ.trim()) return showToast('Enter phone / username / userId')
    const res=await fetch(`/api/admin?action=users&q=${encodeURIComponent(depositQ.trim())}`)
    const data=await res.json()
    if(data.success && data.users?.[0]){ setDepositUser(data.users[0]); setShowDepositBox(false); setDepositAmount('') }
    else showToast('User not found')
  }

  const resetPassword=async()=>{
    if(!newPwd || newPwd.length<4) return showToast('Password min 4 chars')
    const res=await fetch('/api/admin',{ method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ action:'resetPassword', q: foundUser.userId||foundUser.phone||searchQ, password: newPwd }) })
    const data=await res.json()
    if(data.success){ showToast('Password updated ✅'); setFoundUser(data.user); setShowPwdBox(false); setNewPwd('') }
    else showToast(data.error||'Failed')
  }

  const handleAdminDeposit=async()=>{
    const amt=Number(depositAmount.replace(/,/g,''))
    if(!amt || amt<=0) return showToast('Enter valid amount')
    if(!depositUser?.userId) return showToast('Search user first')
    const res=await fetch('/api/admin',{ method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ action:'adminDeposit', userId: depositUser.userId, q: depositUser.userId, amount: amt }) })
    const data=await res.json()
    if(data.success){ showToast(`Deposited ${amt.toLocaleString()} UGX ✅`); setDepositUser(data.user); setShowDepositBox(false); setDepositAmount(''); loadHistory('deposit') }
    else showToast(data.error||'Failed')
  }

  const handleCreateGift=async()=>{
    if(!giftCode.trim()) return showToast('Enter gift code')
    const amt=Number(String(giftAmount).replace(/,/g,''))
    if(!amt || amt<=0) return showToast('Enter gift amount')
    const numUsers=Number(giftNumberOfUsers) || 1
    if(numUsers < 1) return showToast('Number of users must be >=1')
    const res=await fetch('/api/admin/gift/create',{ method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ code: giftCode.trim(), amount: amt, numberOfUsers: numUsers }) })
    const data=await res.json()
    if(data.success){ showToast(`Gift ${data.code} created for ${data.maxClaims} users ✅`); setGiftCode(''); setGiftAmount(''); setGiftNumberOfUsers('1') }
    else showToast(data.error||'Failed to create gift')
  }

  if(!user) return <div className="min-h-screen bg-white p-6 text-black font-black">Loading admin...</div>

  const depositPending = pending.filter(tx=>!String(tx.type).toLowerCase().includes('withdraw'))
  const withdrawPending = pending.filter(tx=>String(tx.type).toLowerCase().includes('withdraw'))

  return(
    <div className="min-h-screen bg-white text-black max-w-[640px] mx-auto p-4 pb-28">
      {toast && <div className="fixed top-4 left-1/2 -translate-x-1/2 z-[99999] bg-[#FF1493] text-white px-5 py-2.5 rounded-full text-sm font-black shadow-xl">{toast}</div>}

      <div className="flex items-center gap-3 mb-5">
        <button onClick={()=>router.push('/dashboard')} className="w-9 h-9 bg-white border-2 border-[#FF1493] text-[#FF1493] rounded-full font-black">←</button>
        <h1 className="text-[22px] font-black tracking-tight">Admin Panel</h1>
        <span className="ml-auto text-[11px] font-black bg-[#FF1493] text-white px-3 py-1 rounded-full">{pending.length} pending</span>
      </div>

      <div className="grid grid-cols-2 gap-3 mb-6">
        <button onClick={()=>{setActiveTab('deposit'); loadPending()}} className={`py-3.5 rounded-[14px] font-black text-[13px] border-2 ${activeTab==='deposit'?'bg-[#FF1493] text-white border-[#FF1493]':'bg-white text-[#FF1493] border-[#FF1493]'}`}>DEPOSIT ({depositPending.length})</button>
        <button onClick={()=>{setActiveTab('withdraw'); loadPending()}} className={`py-3.5 rounded-[14px] font-black text-[13px] border-2 ${activeTab==='withdraw'?'bg-[#FF1493] text-white border-[#FF1493]':'bg-white text-[#FF1493] border-[#FF1493]'}`}>WITHDRAW ({withdrawPending.length})</button>
        <button onClick={()=>{setActiveTab('depositHistory'); loadHistory('deposit')}} className={`py-3.5 rounded-[14px] font-black text-[13px] border-2 ${activeTab==='depositHistory'?'bg-black text-white border-black':'bg-white text-black border-black'}`}>DEPOSIT HISTORY</button>
        <button onClick={()=>{setActiveTab('withdrawHistory'); loadHistory('withdraw')}} className={`py-3.5 rounded-[14px] font-black text-[13px] border-2 ${activeTab==='withdrawHistory'?'bg-black text-white border-black':'bg-white text-black border-black'}`}>WITHDRAW HISTORY</button>
      </div>

      {activeTab==='deposit' && (
        <div className="mb-8">
          <h2 className="text-[11px] font-black mb-3 uppercase text-[#FF1493]">Deposit Pending</h2>
          {loading? <p className="text-sm font-bold">Loading...</p> : depositPending.length===0? <p className="text-sm text-gray-400 border-2 border-[#FF1493] p-4 rounded-xl text-center font-bold">No deposit pending</p> : <div className="space-y-3">{depositPending.map(tx=>{const {date,time}=splitUgDate(tx.dateStr||tx.createdAt); return <div key={tx.id} className="bg-white border-2 border-[#FF1493] rounded-[16px] p-4"><p className="font-black text-[13px] mb-2">DEPOSIT - {Number(tx.amount).toLocaleString()} UGX</p><div className="text-[12px] space-y-1"><p>Phone: <b>{tx.phone}</b> | Username: <b>{tx.username}</b></p><p>UserId: <b>{tx.userId}</b> | Email: {tx.email||'N/A'}</p><p>Billed/Wallet FROM: <b>{tx.billedPhone||tx.wallet||tx.walletInput||'N/A'}</b></p><p>Method: <b>{tx.method||'N/A'}</b></p><p className="text-[11px] bg-[#FF1493] text-white inline-block px-2 py-1 rounded mt-1 font-mono">{date} {time}</p><p className="text-[10px] opacity-50">ID: {tx.id}</p></div><div className="flex gap-2 mt-3"><button onClick={()=>handleAction(tx,'success')} className="flex-1 py-3 bg-[#FF1493] text-white rounded-[12px] font-black text-xs">APPROVE</button><button onClick={()=>handleAction(tx,'failed')} className="flex-1 py-3 bg-white border-2 border-[#FF1493] text-[#FF1493] rounded-[12px] font-black text-xs">REJECT</button></div></div>})}</div>}
        </div>
      )}

      {activeTab==='withdraw' && (
        <div className="mb-8">
          <h2 className="text-[11px] font-black mb-3 uppercase text-[#FF1493]">Withdraw Pending</h2>
          {loading? <p className="text-sm font-bold">Loading...</p> : withdrawPending.length===0? <p className="text-sm text-gray-400 border-2 border-[#FF1493] p-4 rounded-xl text-center font-bold">No withdraw pending</p> : <div className="space-y-3">{withdrawPending.map(tx=>{const {date,time}=splitUgDate(tx.dateStr||tx.createdAt); return <div key={tx.id} className="bg-white border-2 border-[#FF1493] rounded-[16px] p-4"><p className="font-black text-[13px] mb-2">WITHDRAW - {Number(tx.receive||tx.amount).toLocaleString()} UGX</p><div className="text-[12px] space-y-1"><p>Phone: <b>{tx.phone}</b> | Username: <b>{tx.username}</b> | UserId: <b>{tx.userId}</b></p><p>Holder: <b>{tx.holderName}</b></p><p>Target TO: <b className="text-[#FF1493]">{tx.withdrawPhone||tx.wallet}</b> | Method: {tx.method}</p><p>Original: {Number(tx.originalAmount||tx.amount).toLocaleString()} | Fee: {Number(tx.fee||0).toLocaleString()} | Receive: {Number(tx.receive||tx.amount).toLocaleString()}</p><p className="text-[11px] bg-[#FF1493] text-white inline-block px-2 py-1 rounded mt-1 font-mono">{date} {time}</p><p className="text-[10px] opacity-50">ID: {tx.id}</p></div><div className="flex gap-2 mt-3"><button onClick={()=>handleAction(tx,'success')} className="flex-1 py-3 bg-[#FF1493] text-white rounded-[12px] font-black text-xs">APPROVE</button><button onClick={()=>handleAction(tx,'failed')} className="flex-1 py-3 bg-white border-2 border-[#FF1493] text-[#FF1493] rounded-[12px] font-black text-xs">REJECT</button></div></div>})}</div>}
        </div>
      )}

      {activeTab==='depositHistory' && (
        <div className="mb-8">
          <h2 className="text-[11px] font-black mb-3 uppercase">Deposit History - rp:admin:history:deposit</h2>
          {historyLoading? <p className="text-sm font-bold">Loading history...</p> : depositHistory.length===0? <p className="text-sm text-gray-400 border-2 border-black p-4 rounded-xl text-center font-bold">No history yet</p> : <div className="space-y-3">{depositHistory.map(tx=>{const {date,time}=splitUgDate(tx.approvedAt||tx.displayTime||tx.dateStr); const ok=(tx.historyStatus==='approved'||tx.status==='success'); return <div key={tx.id} className={`border-2 rounded-[16px] p-4 ${ok?'bg-green-50 border-green-600':'bg-red-50 border-red-600'}`}><div className="flex justify-between"><p className="font-black text-[13px]">DEPOSIT {Number(tx.amount).toLocaleString()} UGX</p><span className={`text-[10px] font-black px-2 py-1 rounded-full text-white ${ok?'bg-green-600':'bg-red-600'}`}>{ok?'APPROVED':'REJECTED'}</span></div><div className="text-[12px] mt-2 space-y-1"><p>Phone: <b>{tx.phone}</b> | User: <b>{tx.username}</b> | ID: <b>{tx.userId}</b></p><p>Wallet FROM: <b>{tx.billedPhone||tx.wallet||tx.walletInput}</b> | Method: {tx.method}</p><p>Date: {date} {time} | Tx: {tx.id}</p></div></div>})}</div>}
        </div>
      )}

      {activeTab==='withdrawHistory' && (
        <div className="mb-8">
          <h2 className="text-[11px] font-black mb-3 uppercase">Withdraw History - rp:admin:history:withdraw</h2>
          {historyLoading? <p className="text-sm font-bold">Loading history...</p> : withdrawHistory.length===0? <p className="text-sm text-gray-400 border-2 border-black p-4 rounded-xl text-center font-bold">No history yet</p> : <div className="space-y-3">{withdrawHistory.map(tx=>{const {date,time}=splitUgDate(tx.approvedAt||tx.displayTime||tx.dateStr); const ok=(tx.historyStatus==='approved'||tx.status==='success'); return <div key={tx.id} className={`border-2 rounded-[16px] p-4 ${ok?'bg-green-50 border-green-600':'bg-red-50 border-red-600'}`}><div className="flex justify-between"><p className="font-black text-[13px]">WITHDRAW {Number(tx.receive||tx.amount).toLocaleString()} UGX</p><span className={`text-[10px] font-black px-2 py-1 rounded-full text-white ${ok?'bg-green-600':'bg-red-600'}`}>{ok?'APPROVED':'REJECTED'}</span></div><div className="text-[12px] mt-2 space-y-1"><p>Phone: <b>{tx.phone}</b> | User: <b>{tx.username}</b> | ID: <b>{tx.userId}</b> | Holder: <b>{tx.holderName}</b></p><p>Target TO: <b>{tx.withdrawPhone||tx.wallet}</b> | Orig: {Number(tx.originalAmount||0).toLocaleString()} | Fee: {Number(tx.fee||0).toLocaleString()} | Receive: {Number(tx.receive||0).toLocaleString()}</p><p>Date: {date} {time} | Tx: {tx.id}</p></div></div>})}</div>}
        </div>
      )}

      <div className="mt-8 p-4 border-2 border-[#FF1493] rounded-[16px] bg-white">
        <h2 className="text-[14px] font-black mb-3 uppercase">Admin Deposit</h2>
        <div className="flex gap-2 mb-3">
          <input value={depositQ} onChange={e=>setDepositQ(e.target.value)} placeholder="Phone / Username / UserId" className="flex-1 border-2 border-[#FF1493] rounded-[12px] px-3 py-3 text-sm font-bold outline-none" />
          <button onClick={searchUserForDeposit} className="px-5 py-3 bg-[#FF1493] text-white rounded-[12px] font-black text-sm">🔍</button>
        </div>
        {depositUser && (
          <div className="border-2 border-[#FF1493] rounded-[12px] p-3 bg-[#FFF0F6]">
            <p className="text-xs">Phone: <b>{depositUser.phone}</b></p>
            <p className="text-xs">Username: <b>{depositUser.username}</b></p>
            <p className="text-xs">UserId: <b>{depositUser.userId}</b></p>
            <p className="text-xs">Balance: <span className="font-black text-[15px]">{Number(depositUser.totalBalance||0).toLocaleString()} UGX</span></p>
            <button onClick={()=>setShowDepositBox(true)} className="mt-3 px-6 py-2.5 bg-[#FF1493] text-white rounded-full font-black text-[12px]">DEPOSIT</button>
            {showDepositBox && <div className="mt-3 bg-white border-2 border-[#FF1493] rounded-[12px] p-3"><input value={depositAmount} onChange={e=>setDepositAmount(e.target.value.replace(/\D/g,''))} placeholder="Amount" className="w-full border-2 border-[#FF1493] rounded-[10px] px-3 py-3 text-sm font-bold outline-none mb-3" /><button onClick={handleAdminDeposit} className="w-full py-3 bg-[#FF1493] text-white rounded-[12px] font-black text-sm">CONFIRM</button></div>}
          </div>
        )}
      </div>

      <div className="mt-8 p-4 border-2 border-[#FF1493] rounded-[16px] bg-white">
        <h2 className="text-[14px] font-black mb-3 uppercase text-[#FF1493]">Modify Password</h2>
        <div className="flex gap-2 mb-3">
          <input value={searchQ} onChange={e=>setSearchQ(e.target.value)} placeholder="Phone / Username / UserId" className="flex-1 border-2 border-[#FF1493] rounded-[12px] px-3 py-3 text-sm font-bold outline-none" />
          <button onClick={searchUserForPwd} className="px-5 py-3 bg-[#FF1493] text-white rounded-[12px] font-black text-sm">🔍</button>
        </div>
        {foundUser && (
          <div className="border-2 border-[#FF1493] rounded-[12px] p-3 bg-[#FFF0F6]">
            <p className="text-xs">Phone: <b>{foundUser.phone}</b></p>
            <p className="text-xs">Username: <b>{foundUser.username}</b></p>
            <p className="text-xs">Password: <span className="font-mono bg-black text-white px-2 py-1 rounded ml-1">{foundUser.password}</span></p>
            <button onClick={()=>setShowPwdBox(true)} className="mt-3 px-6 py-2.5 bg-[#FF1493] text-white rounded-full font-black text-[12px]">UPDATE</button>
            {showPwdBox && <div className="mt-3 bg-white border-2 border-[#FF1493] rounded-[12px] p-3"><input value={newPwd} onChange={e=>setNewPwd(e.target.value)} placeholder="New password" className="w-full border-2 border-[#FF1493] rounded-[10px] px-3 py-3 text-sm font-bold outline-none mb-3" /><button onClick={resetPassword} className="w-full py-3 bg-[#FF1493] text-white rounded-[12px] font-black text-sm">SAVE</button></div>}
          </div>
        )}
      </div>

      {/* GIFT CODE CREATION CENTER */}
      <div className="mt-8 p-4 border-2 border-[#FF1493] rounded-[16px] bg-white">
        <h2 className="text-[14px] font-black mb-3 uppercase text-[#FF1493]">GIFT CODE CREATION CENTER</h2>
        <input value={giftCode} onChange={e=>setGiftCode(e.target.value.toUpperCase())} placeholder="Type Gift Code e.g. WIN38K" className="w-full border-2 border-[#FF1493] rounded-[12px] px-3 py-3 text-sm font-bold outline-none mb-3 uppercase" />
        <input value={giftAmount} onChange={e=>setGiftAmount(e.target.value.replace(/\D/g,''))} placeholder="Amount e.g. 38000" className="w-full border-2 border-[#FF1493] rounded-[12px] px-3 py-3 text-sm font-bold outline-none mb-3" />
        <label className="text-[11px] font-black text-[#FF1493] uppercase">Number of users who can claim this code</label>
        <input value={giftNumberOfUsers} onChange={e=>setGiftNumberOfUsers(e.target.value.replace(/\D/g,''))} placeholder="Number of users e.g. 5" className="w-full border-2 border-[#FF1493] rounded-[12px] px-3 py-3 text-sm font-bold outline-none mb-3 mt-1" />
        <p className="text-[11px] text-gray-400 font-bold mb-3">e.g. Code DTakG • 200 UGX • 5 users = first 5 win, 6th sees &quot;already grabbed&quot; pop</p>
        <button onClick={handleCreateGift} className="w-full py-3 bg-[#FF1493] text-white rounded-[12px] font-black text-sm">CONFIRM CODE</button>
      </div>

    </div>
  )
}