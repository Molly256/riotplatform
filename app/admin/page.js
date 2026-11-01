'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'

const P = 'riot:'
const getUgandaDate = () => new Date().toLocaleDateString('en-CA', { timeZone: 'Africa/Kampala' })
const getUgandaDateTime = () => new Date().toLocaleString('en-CA', { timeZone: 'Africa/Kampala', hour12: false }).replace(',', '').slice(0,19)

function splitUgDate(input) {
  if (!input) return { date: '', time: '' }
  const s = String(input).slice(0,19)
  const [d, t] = s.split(' ')
  if (d && t) return { date: d, time: t }
  if (s.includes('T')) { const [dd, tt] = s.split('T'); return { date: dd, time: tt } }
  return { date: s.slice(0,10), time: s.slice(11,19) }
}

export default function Admin() {
  const router = useRouter()
  const [user, setUser] = useState(null)
  const [pending, setPending] = useState([])
  const [loading, setLoading] = useState(true)
  const [toast, setToast] = useState('')
  const [activeTab, setActiveTab] = useState('deposit')
  const [depositHistory, setDepositHistory] = useState([])
  const [withdrawHistory, setWithdrawHistory] = useState([])
  const [searchPhone, setSearchPhone] = useState('')
  const [foundUser, setFoundUser] = useState(null)
  const [showResetBox, setShowResetBox] = useState(false)
  const [tempPassword, setTempPassword] = useState('')
  const [depositPhone, setDepositPhone] = useState('')
  const [depositFoundUser, setDepositFoundUser] = useState(null)
  const [showDepositBox, setShowDepositBox] = useState(false)
  const [depositAmount, setDepositAmount] = useState('')
  const [viewImage, setViewImage] = useState(null)

  const ADMIN_PHONES = ['0753520252', '+256753520252', '256753520252']

  useEffect(() => {
    const localUser = JSON.parse(localStorage.getItem('riot_user') || localStorage.getItem('booksforward_user') || '{}')
    if (!ADMIN_PHONES.includes(localUser.phone)) { router.push('/dashboard'); return }
    setUser(localUser)
    loadPending()
    loadHistories()
  }, [])

  const loadPending = async () => {
    const res = await fetch('/api/admin?action=pending')
    const data = await res.json()
    if (data.success) setPending(data.pending)
    setLoading(false)
  }

  const loadHistories = async () => {
    const today = getUgandaDate()
    const dLocal = JSON.parse(localStorage.getItem(`${P}admin_deposit_history`) || '[]').filter(h => h.date === today)
    const wLocal = JSON.parse(localStorage.getItem(`${P}admin_withdraw_history`) || '[]').filter(h => h.date === today)
    try {
      const [dRes, wRes] = await Promise.all([
        fetch('/api/admin?action=deposit_history').then(r=>r.json()).catch(()=>({history:[]})),
        fetch('/api/admin?action=withdraw_history').then(r=>r.json()).catch(()=>({history:[]}))
      ])
      const dRedis = (dRes.history||[]).map(tx => ({
        phone: tx.phone, billedPhone: tx.billedPhone || '', amount: tx.amount, status: tx.status,
        date: tx.createdAt?.slice(0,10) || today, timestamp: tx.updatedAt || tx.createdAt,
        createdAt: tx.createdAt, proofImage: tx.proofImage || '', withdrawPhone: tx.withdrawPhone, method: tx.method
      }))
      const wRedis = (wRes.history||[]).map(tx => ({
        phone: tx.phone, amount: tx.amount, status: tx.status,
        date: tx.createdAt?.slice(0,10) || today, timestamp: tx.updatedAt || tx.createdAt,
        createdAt: tx.createdAt, withdrawPhone: tx.withdrawPhone, withdrawName: tx.withdrawName, method: tx.method
      }))
      setDepositHistory([...dRedis,...dLocal].slice(0,50))
      setWithdrawHistory([...wRedis,...wLocal].slice(0,50))
    } catch { setDepositHistory(dLocal); setWithdrawHistory(wLocal) }
  }

  const saveToHistory = (type, entry) => {
    const today = getUgandaDate()
    const key = type === 'deposit'? `${P}admin_deposit_history` : `${P}admin_withdraw_history`
    const all = JSON.parse(localStorage.getItem(key) || '[]')
    const newEntry = {...entry, date: today, timestamp: entry.createdAt || getUgandaDateTime() }
    const updated = [newEntry,...all.filter(h => h.date === today)].slice(0,100)
    localStorage.setItem(key, JSON.stringify([...updated,...all.filter(h => h.date!== today)]))
    loadHistories()
  }

  const showToast = (msg) => { setToast(msg); setTimeout(() => setToast(''), 2500) }

  const handleAction = async (tx, action) => {
    const isDeposit = String(tx.type).toLowerCase().trim()!== 'withdraw'
    setPending(prev => prev.filter(t => t.id!== tx.id))
    const res = await fetch('/api/admin', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'updateStatus', id: tx.id, status: action, phone: tx.phone })
    })
    const data = await res.json()
    if (data.success) {
      showToast(`Transaction ${action}`)
      if (isDeposit) saveToHistory('deposit', { phone: tx.phone, billedPhone: tx.billedPhone, amount: tx.amount, status: action, createdAt: getUgandaDateTime(), proofImage: tx.proofImage })
      else saveToHistory('withdraw', { phone: tx.phone, amount: tx.amount, withdrawPhone: tx.withdrawPhone || tx.phoneNumber || '', withdrawName: tx.withdrawName || tx.accountName || '', method: tx.method || '', status: action, createdAt: getUgandaDateTime() })
      setTimeout(loadHistories, 500)
    } else { showToast(data.error); loadPending() }
  }

  const searchUser = async () => {
    if (!/^0?7\d{8}$/.test(searchPhone.replace('+256','0').replace('256','0'))) return showToast('Enter valid phone')
    const res = await fetch(`/api/admin?action=user&phone=${searchPhone}`)
    const data = await res.json()
    if (data.success) setFoundUser(data.user)
    else { showToast('User not found'); setFoundUser(null) }
  }

  const searchDepositUser = async () => {
    if (!/^0?7\d{8}$/.test(depositPhone.replace('+256','0').replace('256','0'))) return showToast('Enter valid phone')
    const res = await fetch(`/api/admin?action=user&phone=${depositPhone}`)
    const data = await res.json()
    if (data.success) { setDepositFoundUser(data.user); setShowDepositBox(false) }
    else { showToast('User not found'); setDepositFoundUser(null) }
  }

  const resetPassword = async () => {
    if (!/^[a-zA-Z0-9]{6}$/.test(tempPassword)) return showToast('Password must be 6 letters/numbers')
    const res = await fetch('/api/admin', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'resetPassword', phone: searchPhone, password: tempPassword }) })
    const data = await res.json()
    if (data.success) { showToast('Password reset: ' + tempPassword); setShowResetBox(false); setTempPassword('') }
    else showToast(data.error)
  }

  const handleAdminDeposit = async () => {
    const amt = Number(depositAmount.replace(/,/g, ''))
    if (!amt || amt <= 0) return showToast('Enter amount')
    const res = await fetch('/api/admin', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'adminDeposit', phone: depositPhone, amount: amt }) })
    const data = await res.json()
    if (data.success) {
      showToast(`Deposited ${amt} to ${depositPhone}`)
      setDepositFoundUser(data.user)
      saveToHistory('deposit', { phone: depositPhone, amount: amt, status: 'system increase', createdAt: getUgandaDateTime() })
      setShowDepositBox(false); setDepositAmount(''); setTimeout(loadHistories, 500)
    } else showToast(data.error)
  }

  if (!user) return <div className="p-4 text-white font-bold bg-black min-h-screen">Loading...</div>
  const depositPending = pending.filter(tx => String(tx.type).toLowerCase().trim()!== 'withdraw')
  const withdrawPending = pending.filter(tx => String(tx.type).toLowerCase().trim() === 'withdraw')

  return (
    <div className="min-h-screen bg-black p-4 pb-24 max-w-[600px] mx-auto text-white">
      {toast && <div className="fixed top-4 left-1/2 -translate-x-1/2 z-[99999] bg-[#FF1493] text-white px-4 py-2 rounded-full text-sm font-bold shadow-lg">{toast}</div>}
      {viewImage && <div onClick={()=>setViewImage(null)} className="fixed inset-0 z-[100000] bg-black/80 flex items-center justify-center p-4"><img src={viewImage} className="max-w-full max-h-[90vh] rounded-xl" /></div>}

      <div className="flex items-center gap-3 mb-4">
        <button onClick={() => router.push('/dashboard')} className="text-2xl text-white">←</button>
        <h1 className="text-2xl font-black text-[#FF1493]">Admin Panel</h1>
        <span className="ml-auto text-[10px] font-bold font-mono">{getUgandaDateTime()} UGA</span>
      </div>

      <div className="grid grid-cols-2 gap-3 mb-6">
        <button onClick={() => setActiveTab('deposit')} className={`py-3 rounded-xl font-black text-sm border-2 ${activeTab==='deposit'?'bg-[#FF1493] text-white border-[#FF1493]':'bg-[#1A1C24] text-white border-gray-700'}`}>DEPOSIT PENDING ({depositPending.length})</button>
        <button onClick={() => setActiveTab('withdraw')} className={`py-3 rounded-xl font-black text-sm border-2 ${activeTab==='withdraw'?'bg-[#FF1493] text-white border-[#FF1493]':'bg-[#1A1C24] text-white border-gray-700'}`}>WITHDRAW PENDING ({withdrawPending.length})</button>
      </div>

      {activeTab==='deposit' && (
        <div className="mb-8">
          <h2 className="text-[13px] font-black mb-2 text-[#FF1493]">Deposit Pending</h2>
          {loading? <p>Loading...</p> : depositPending.length===0? <p className="text-gray-500 text-sm">No deposit pending</p> : (
            <div className="flex flex-col gap-4">
              {depositPending.map(tx => {
                const { date, time } = splitUgDate(tx.createdAt || tx.timestamp)
                return (
                <div key={tx.id} className="border-2 border-[#FF1493] rounded-xl p-3 bg-[#12131A]">
                  <p className="font-black text-sm border-b border-[#FF1493] pb-2 mb-2">{tx.type?.toUpperCase()} - {Number(tx.amount).toLocaleString()} shs</p>
                  <div className="space-y-1 text-[12px]">
                    <p><span className="font-bold text-gray-400">Account No:</span> <span className="font-black">{tx.phone}</span></p>
                    <p><span className="font-bold text-gray-400">Billed No:</span> <span className="font-black text-[#FF69B4]">{tx.billedPhone || 'N/A'}</span></p>
                    <p><span className="font-bold text-gray-400">Amount:</span> <span className="font-black">{Number(tx.amount).toLocaleString()} shs</span></p>
                    <p><span className="font-bold text-gray-400">Method:</span> {tx.method || 'N/A'}</p>
                    <div className="pt-1">
                      <p className="font-bold text-gray-400 text-[11px]">Proof Image:</p>
                      {tx.proofImage? <img onClick={()=>setViewImage(tx.proofImage)} src={tx.proofImage} className="mt-1 w-full h-48 object-contain bg-black rounded-lg border border-[#FF1493] cursor-pointer" /> : <p className="text-red-500 text-[11px]">No image</p>}
                    </div>
                    <div className="bg-[#FF1493] text-white px-2 py-1 rounded mt-2 font-mono text-[11px]"><p>📅 Date: {date}</p><p>🕒 Time: {time} UGA</p></div>
                  </div>
                  <div className="flex gap-2 mt-3">
                    <button onClick={() => handleAction(tx,'success')} className="flex-1 py-2.5 bg-[#FF1493] text-white rounded-lg text-xs font-black">APPROVE ✅</button>
                    <button onClick={() => handleAction(tx,'failed')} className="flex-1 py-2.5 bg-red-600 text-white rounded-lg text-xs font-black">REJECT ❌</button>
                  </div>
                </div>
                )
              })}
            </div>
          )}
          <div className="mt-6 bg-[#1A1C24] border border-[#FF1493] rounded-xl p-3">
            <h3 className="font-black text-xs mb-2 text-[#FF1493]">Deposit History Today</h3>
            {depositHistory.length===0? <p className="text-[11px] text-gray-500">No history today</p> : depositHistory.map((h,i) => {
              const { date, time } = splitUgDate(h.createdAt || h.timestamp)
              return <div key={i} className="flex justify-between border-b border-gray-800 py-2 text-[11px] gap-2"><div className="flex-1"><p className="font-black">{h.phone} - {Number(h.amount).toLocaleString()} shs</p><p className={`font-bold ${h.status==='success'?'text-green-400':'text-red-400'}`}>{h.status?.toUpperCase()}</p><p className="text-[10px] font-mono">📅 {date} 🕒 {time}</p></div>{h.proofImage && <img onClick={()=>setViewImage(h.proofImage)} src={h.proofImage} className="w-12 h-12 object-cover rounded border cursor-pointer" />}</div>
            })}
          </div>
        </div>
      )}

      {activeTab==='withdraw' && (
        <div className="mb-8">
          <h2 className="text-[13px] font-black mb-2 text-[#FF1493]">Withdraw Pending</h2>
          {loading? <p>Loading...</p> : withdrawPending.length===0? <p className="text-gray-500 text-sm">No withdraw pending</p> : (
            <div className="flex flex-col gap-3">
              {withdrawPending.map(tx => {
                const { date, time } = splitUgDate(tx.createdAt)
                return (
                <div key={tx.id} className="border border-[#FF1493] rounded-xl p-3 bg-[#12131A]">
                  <p className="font-black text-sm border-b border-[#FF1493] pb-1 mb-1">WITHDRAW - {Number(tx.amount).toLocaleString()} shs</p>
                  <div className="flex flex-col gap-1 text-xs font-bold">
                    <p>Phone: <span className="font-black">{tx.phone}</span></p>
                    <p>Target No: <span className="text-[#FF69B4]">{tx.withdrawPhone || tx.phoneNumber}</span></p>
                    <p>Account Name: {tx.withdrawName || tx.accountName}</p>
                    <p>Network: {tx.method}</p>
                    <p className="text-[10px] font-mono bg-[#FF1493] text-white px-2 py-1 rounded mt-1">{date} {time} UGA</p>
                  </div>
                  <div className="flex gap-2 mt-2">
                    <button onClick={() => handleAction(tx,'success')} className="px-4 py-2 bg-[#FF1493] text-white rounded-lg text-xs font-bold">Approve</button>
                    <button onClick={() => handleAction(tx,'failed')} className="px-4 py-2 bg-red-600 text-white rounded-lg text-xs font-bold">Reject</button>
                  </div>
                </div>
              )})}
            </div>
          )}
          <div className="mt-6 bg-[#1A1C24] border border-[#FF1493] rounded-xl p-3">
            <h3 className="font-black text-xs mb-2 text-[#FF1493]">Withdraw History Today</h3>
            {withdrawHistory.length===0? <p className="text-[11px] text-gray-500">No history today</p> : withdrawHistory.map((h,i) => {
              const { date, time } = splitUgDate(h.createdAt || h.timestamp)
              return <div key={i} className="border-b border-gray-800 py-2 text-[11px]"><p className="font-black">{h.phone} - {Number(h.amount).toLocaleString()} shs - {h.status?.toUpperCase()}</p><p>Target: {h.withdrawPhone} | Network: {h.method}</p><p className="text-[10px] font-mono font-bold">🕒 {date} {time} UGA</p></div>
            })}
          </div>
        </div>
      )}

      <div className="mt-8 p-4 border-2 border-[#FF1493] rounded-xl bg-[#12131A]">
        <h2 className="text-sm font-black mb-3 text-[#FF1493]">ADMIN DEPOSIT TO USER</h2>
        <div className="flex gap-2 mb-3">
          <input type="tel" placeholder="07XXXXXXXX or +256..." value={depositPhone} onChange={e=>setDepositPhone(e.target.value)} className="flex-1 border border-[#FF1493] rounded-lg px-3 py-2 text-white bg-black outline-none" />
          <button onClick={searchDepositUser} className="px-4 py-2 bg-[#FF1493] text-white rounded-lg font-bold">🔍</button>
        </div>
        {depositFoundUser && (
          <div className="border border-[#FF1493] rounded-lg p-3 bg-black">
            <p className="text-xs"><b>Username:</b> {depositFoundUser.username}</p>
            <p className="text-xs"><b>Phone:</b> {depositFoundUser.phone}</p>
            <p className="text-xs"><b>Balance:</b> {Number(depositFoundUser.availableBalance||depositFoundUser.balance||0).toLocaleString()} shs</p>
            <div className="flex items-center gap-2 mt-2"><button onClick={()=>setShowDepositBox(true)} className="px-3 py-1 bg-[#FF1493] text-white rounded-full text-[11px] font-bold">deposit</button></div>
            {showDepositBox && <div className="mt-3 bg-[#1A1C24] border border-[#FF1493] rounded-lg p-3"><input type="tel" placeholder="Insert amount" value={depositAmount} onChange={e=>setDepositAmount(e.target.value.replace(/\D/g,''))} className="w-full border border-[#FF1493] rounded-lg px-3 py-2 text-white bg-black mb-2 outline-none" /><button onClick={handleAdminDeposit} className="w-full py-2 bg-[#FF1493] text-white rounded-lg font-bold text-sm">Deposit Money</button></div>}
          </div>
        )}
      </div>
    </div>
  )
}