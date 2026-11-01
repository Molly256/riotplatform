'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'

const getUgandaTime = () => new Date().toLocaleString('en-CA', { timeZone: 'Africa/Kampala', hour12:false }).replace(',','').slice(0,19)
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
  
  // MODIFY PASSWORD - search by phone/username/userId
  const [searchQ,setSearchQ]=useState('')
  const [foundUser,setFoundUser]=useState(null)
  const [showPwdBox,setShowPwdBox]=useState(false)
  const [newPwd,setNewPwd]=useState('')

  // ADMIN DEPOSIT - search by phone/username/userId
  const [depositQ,setDepositQ]=useState('')
  const [depositUser,setDepositUser]=useState(null)
  const [showDepositBox,setShowDepositBox]=useState(false)
  const [depositAmount,setDepositAmount]=useState('')
  const [viewImage,setViewImage]=useState(null)

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
    try{
      const res=await fetch('/api/admin?action=pending')
      const data=await res.json()
      if(data.success){
        // backend returns deposits + withdraws using rp:pending:deposits etc
        if(data.pending) setPending([...(data.pending.deposits||data.pending.withdraws||data.deposits||[]),...(data.pending.withdraws||data.withdraws||[])])
        else setPending([...(data.deposits||[]),...(data.withdraws||[])])
        // also store separated if backend gives
        if(data.deposits) setPending([...data.deposits,...data.withdraws])
      }
    }catch{}
    setLoading(false)
  }

  const showToast=(m)=>{setToast(m); setTimeout(()=>setToast(''),2500)}

  const handleAction=async(tx,action)=>{
    const type = String(tx.type).toLowerCase().includes('withdraw')?'withdraw':'deposit'
    setPending(prev=>prev.filter(t=>t.id!==tx.id))
    const res=await fetch('/api/admin',{
      method:'POST', headers:{'Content-Type':'application/json'},
      body: JSON.stringify({ action, txId: tx.id, type, id: tx.id, status: action })
    })
    const data=await res.json()
    if(data.success) showToast(`Transaction ${action} ✅`)
    else { showToast(data.error||'Failed'); loadPending() }
  }

  // SEARCH uses rp:phone: , rp:username: , rp:user: , rp:all_users
  const searchUserForPwd=async()=>{
    if(!searchQ.trim()) return showToast('Enter phone / username / userId')
    const res=await fetch(`/api/admin?action=users&q=${encodeURIComponent(searchQ.trim())}`)
    const data=await res.json()
    if(data.success && data.users && data.users[0]){
      setFoundUser(data.users[0]); setShowPwdBox(false); setNewPwd('')
    }else{ showToast('User not found - check rp:phone / rp:username / rp:user'); setFoundUser(null) }
  }

  const searchUserForDeposit=async()=>{
    if(!depositQ.trim()) return showToast('Enter phone / username / userId')
    const res=await fetch(`/api/admin?action=users&q=${encodeURIComponent(depositQ.trim())}`)
    const data=await res.json()
    if(data.success && data.users && data.users[0]){
      setDepositUser(data.users[0]); setShowDepositBox(false); setDepositAmount('')
    }else{ showToast('User not found'); setDepositUser(null) }
  }

  const resetPassword=async()=>{
    if(!newPwd || newPwd.length<4) return showToast('Password min 4 chars')
    const res=await fetch('/api/admin',{
      method:'POST', headers:{'Content-Type':'application/json'},
      body: JSON.stringify({ action:'resetPassword', phone: foundUser.phone||foundUser.userId||searchQ, password: newPwd, q: searchQ })
    })
    const data=await res.json()
    if(data.success){ showToast('Password updated ✅'); setFoundUser(data.user); setShowPwdBox(false); setNewPwd('') }
    else showToast(data.error||'Failed')
  }

  const handleAdminDeposit=async()=>{
    const amt=Number(depositAmount.replace(/,/g,''))
    if(!amt || amt<=0) return showToast('Enter valid amount')
    const res=await fetch('/api/admin',{
      method:'POST', headers:{'Content-Type':'application/json'},
      body: JSON.stringify({ action:'adminDeposit', phone: depositUser.phone||depositQ, q: depositQ, amount: amt })
    })
    const data=await res.json()
    if(data.success){
      showToast(`Deposited ${amt.toLocaleString()} to ${depositUser.username||depositQ}`)
      setDepositUser(data.user)
      setShowDepositBox(false); setDepositAmount('')
    }else showToast(data.error||'Failed')
  }

  if(!user) return <div className="min-h-screen bg-white p-6 text-black font-black">Loading admin...</div>

  const depositPending = pending.filter(tx=>!String(tx.type).toLowerCase().includes('withdraw'))
  const withdrawPending = pending.filter(tx=>String(tx.type).toLowerCase().includes('withdraw'))

  return(
    <div className="min-h-screen bg-white text-black max-w-[640px] mx-auto p-4 pb-28">
      {toast && <div className="fixed top-4 left-1/2 -translate-x-1/2 z-[99999] bg-black text-white px-5 py-2.5 rounded-full text-sm font-black shadow-xl">{toast}</div>}
      {viewImage && <div onClick={()=>setViewImage(null)} className="fixed inset-0 z-[100000] bg-black/80 flex items-center justify-center p-4"><img src={viewImage} className="max-w-full max-h-[90vh] rounded-xl bg-white" /></div>}

      <div className="flex items-center gap-3 mb-5">
        <button onClick={()=>router.push('/dashboard')} className="w-9 h-9 bg-gray-100 rounded-full font-black border border-black">←</button>
        <h1 className="text-[20px] font-black tracking-tight">Admin Panel</h1>
        <span className="ml-auto text-[11px] font-bold bg-black text-white px-3 py-1 rounded-full">{pending.length} pending</span>
      </div>

      <div className="grid grid-cols-2 gap-2 mb-6">
        <button onClick={()=>setActiveTab('deposit')} className={`py-3.5 rounded-[14px] font-black text-[13px] border-2 ${activeTab==='deposit'?'bg-black text-white border-black':'bg-white text-black border-black'}`}>DEPOSIT PENDING ({depositPending.length})</button>
        <button onClick={()=>setActiveTab('withdraw')} className={`py-3.5 rounded-[14px] font-black text-[13px] border-2 ${activeTab==='withdraw'?'bg-black text-white border-black':'bg-white text-black border-black'}`}>WITHDRAW PENDING ({withdrawPending.length})</button>
      </div>

      {/* PENDING LISTS - uses rp:pending:deposits / rp:pending:withdraws */}
      {activeTab==='deposit' && (
        <div className="mb-8">
          <h2 className="text-[11px] font-black mb-3 uppercase tracking-widest text-gray-500">Deposit Pending - rp:pending:deposits + rp:tx</h2>
          {loading? <p className="text-sm font-bold">Loading rp:pending:deposits...</p> : depositPending.length===0? <p className="text-sm text-gray-400 bg-gray-50 border-2 border-black p-4 rounded-xl text-center font-bold">No deposit pending</p> : <div className="space-y-3">{depositPending.map(tx=>{const {date,time}=splitUgDate(tx.dateStr||tx.createdAt||tx.timestamp); return <div key={tx.id} className="bg-white border-2 border-black rounded-[16px] p-4"><p className="font-black text-[13px] border-b-2 border-black pb-2 mb-2">{(tx.type||'DEPOSIT').toUpperCase()} - {Number(tx.amount).toLocaleString()} UGX</p><div className="text-[12px] space-y-1 font-medium"><p>Phone: <b>{tx.phone}</b> | Username: <b>{tx.username}</b></p><p>UserId: <b>{tx.userId}</b></p><p>Billed/Wallet: <b>{tx.billedPhone||tx.wallet||'N/A'}</b></p><p>Method: {tx.method||'N/A'}</p>{tx.proofImage && <img onClick={()=>setViewImage(tx.proofImage)} src={tx.proofImage} className="w-full h-40 object-contain bg-gray-50 border-2 border-black rounded-xl mt-2 cursor-pointer" />}<p className="text-[11px] bg-black text-white inline-block px-2 py-1 rounded mt-2 font-mono">📅 {date} 🕒 {time} UGA</p></div><div className="flex gap-2 mt-3"><button onClick={()=>handleAction(tx,'success')} className="flex-1 py-3 bg-black text-white rounded-[12px] font-black text-xs">APPROVE ✅</button><button onClick={()=>handleAction(tx,'failed')} className="flex-1 py-3 bg-white border-2 border-black rounded-[12px] font-black text-xs">REJECT ❌</button></div></div>})}</div>}
        </div>
      )}

      {activeTab==='withdraw' && (
        <div className="mb-8">
          <h2 className="text-[11px] font-black mb-3 uppercase tracking-widest text-gray-500">Withdraw Pending - rp:pending:withdraws + rp:tx</h2>
          {loading? <p className="text-sm font-bold">Loading rp:pending:withdraws...</p> : withdrawPending.length===0? <p className="text-sm text-gray-400 bg-gray-50 border-2 border-black p-4 rounded-xl text-center font-bold">No withdraw pending</p> : <div className="space-y-3">{withdrawPending.map(tx=>{const {date,time}=splitUgDate(tx.dateStr||tx.createdAt); return <div key={tx.id} className="bg-white border-2 border-black rounded-[16px] p-4"><p className="font-black text-[13px] border-b-2 border-black pb-2 mb-2">WITHDRAW - {Number(tx.receive||tx.amount).toLocaleString()} (orig {tx.originalAmount||tx.amount})</p><div className="text-[12px] space-y-1 font-medium"><p>Phone: <b>{tx.phone}</b></p><p>Username: {tx.username} | UserId: {tx.userId}</p><p>Target: <b className="text-[#FF1493]">{tx.withdrawPhone||tx.wallet}</b> | Holder: {tx.withdrawName||tx.holderName}</p><p>Method: {tx.method}</p><p className="text-[11px] bg-black text-white inline-block px-2 py-1 rounded mt-2 font-mono">📅 {date} 🕒 {time} UGA</p></div><div className="flex gap-2 mt-3"><button onClick={()=>handleAction(tx,'success')} className="flex-1 py-3 bg-black text-white rounded-[12px] font-black text-xs">APPROVE ✅</button><button onClick={()=>handleAction(tx,'failed')} className="flex-1 py-3 bg-white border-2 border-black rounded-[12px] font-black text-xs">REJECT ❌</button></div></div>})}</div>}
        </div>
      )}

      {/* ADMIN DEPOSIT TO USER - FIXED */}
      <div className="mt-8 p-4 border-2 border-black rounded-[16px] bg-white">
        <h2 className="text-[13px] font-black mb-3 uppercase">Admin Deposit to User (System Increase)</h2>
        <p className="text-[10px] font-bold text-gray-500 mb-2">Search by Phone / Username / UserId - uses rp:phone: rp:username: rp:user:</p>
        <div className="flex gap-2 mb-3">
          <input value={depositQ} onChange={e=>setDepositQ(e.target.value)} placeholder="Phone / Username / UserId" className="flex-1 bg-white border-2 border-black rounded-[12px] px-3 py-3 text-sm font-bold outline-none" />
          <button onClick={searchUserForDeposit} className="px-5 py-3 bg-black text-white rounded-[12px] font-black text-sm">🔍 Search</button>
        </div>
        {depositUser && (
          <div className="border-2 border-black rounded-[12px] p-3 bg-gray-50">
            <p className="text-xs"><b>Phone:</b> {depositUser.phone}</p>
            <p className="text-xs"><b>Username:</b> {depositUser.username}</p>
            <p className="text-xs"><b>UserId:</b> {depositUser.userId}</p>
            <p className="text-xs"><b>Total Balance:</b> <span className="font-black text-[14px]">{Number(depositUser.totalBalance||depositUser.balance||0).toLocaleString()} UGX</span></p>
            <p className="text-xs"><b>Email:</b> {depositUser.email||'N/A'}</p>
            <button onClick={()=>setShowDepositBox(true)} className="mt-3 px-5 py-2.5 bg-black text-white rounded-full font-black text-[12px]">DEPOSIT BUTTON</button>
            {showDepositBox && <div className="mt-3 bg-white border-2 border-black rounded-[12px] p-3"><p className="text-[11px] font-black mb-2">Amount to add to Total Balance</p><input value={depositAmount} onChange={e=>setDepositAmount(e.target.value.replace(/\D/g,''))} placeholder="Insert amount e.g. 50000" className="w-full bg-white border-2 border-black rounded-[10px] px-3 py-3 text-sm font-bold outline-none mb-3" /><button onClick={handleAdminDeposit} className="w-full py-3 bg-black text-white rounded-[12px] font-black text-sm">Deposit Confirm - Add to Total Balance & Create System Increase Tx</button></div>}
          </div>
        )}
      </div>

      {/* MODIFY PASSWORD - HOT PINK */}
      <div className="mt-8 p-4 border-2 border-[#FF1493] rounded-[16px] bg-white">
        <h2 className="text-[13px] font-black mb-3 uppercase text-[#FF1493]">Modify Password - User Search</h2>
        <p className="text-[10px] font-bold text-gray-500 mb-2">Search by Phone / Username / UserId - shows full register data from rp:user:</p>
        <div className="flex gap-2 mb-3">
          <input value={searchQ} onChange={e=>setSearchQ(e.target.value)} placeholder="Phone / Username / UserId" className="flex-1 bg-white border-2 border-[#FF1493] rounded-[12px] px-3 py-3 text-sm font-bold outline-none" />
          <button onClick={searchUserForPwd} className="px-5 py-3 bg-[#FF1493] text-white rounded-[12px] font-black text-sm">🔍 Search</button>
        </div>
        {foundUser && (
          <div className="border-2 border-[#FF1493] rounded-[12px] p-3 bg-[#FFF0F6]">
            <p className="text-xs"><b>Phone:</b> {foundUser.phone}</p>
            <p className="text-xs"><b>Username:</b> {foundUser.username}</p>
            <p className="text-xs"><b>UserId:</b> {foundUser.userId}</p>
            <p className="text-xs"><b>Password:</b> <span className="font-mono bg-black text-white px-2 py-1 rounded ml-1">{foundUser.password}</span></p>
            <p className="text-xs"><b>Total Balance:</b> {Number(foundUser.totalBalance||0).toLocaleString()} UGX</p>
            <p className="text-xs"><b>Email:</b> {foundUser.email||'N/A'}</p>
            <button onClick={()=>setShowPwdBox(true)} className="mt-3 px-5 py-2.5 bg-[#FF1493] text-white rounded-full font-black text-[12px]">UPDATE PASSWORD - HOT PINK</button>
            {showPwdBox && <div className="mt-3 bg-white border-2 border-[#FF1493] rounded-[12px] p-3"><p className="text-[11px] font-black mb-2 text-[#FF1493]">New password input</p><input value={newPwd} onChange={e=>setNewPwd(e.target.value)} placeholder="Enter new password" className="w-full bg-white border-2 border-[#FF1493] rounded-[10px] px-3 py-3 text-sm font-bold outline-none mb-3" /><button onClick={resetPassword} className="w-full py-3 bg-[#FF1493] text-white rounded-[12px] font-black text-sm">SAVE NEW PASSWORD - HOT PINK</button></div>}
          </div>
        )}
      </div>
    </div>
  )
}