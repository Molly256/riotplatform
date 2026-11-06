"use client"
import { useState, useRef, useEffect } from "react"

export default function GiftWidget({ userId: propUserId }){
  const [open, setOpen] = useState(false)
  const [successOpen, setSuccessOpen] = useState(false)
  const [wonAmount, setWonAmount] = useState(0)
  const [code, setCode] = useState("")
  const [preview, setPreview] = useState(null)
  const [loading, setLoading] = useState(false)
  const [pos, setPos] = useState({ x: 0, y: 0 })
  const [userId, setUserId] = useState(propUserId || null)
  const [isDragging, setIsDragging] = useState(false)

  const dragging = useRef(false)
  const moved = useRef(false)
  const offset = useRef({x:0,y:0})
  const posRef = useRef({x:0,y:0})
  const startPos = useRef({x:0,y:0})

  useEffect(()=>{ posRef.current = pos },[pos])

  useEffect(()=>{
    if(propUserId) { setUserId(propUserId); return }
    try{
      const keys = ["user","riotUser","riot_user","currentUser","authUser"]
      for(let k of keys){
        const saved = localStorage.getItem(k)
        if(saved){
          const u = JSON.parse(saved)
          if(u?.userId || u?.id){ setUserId(u.userId || u.id); return }
        }
      }
      if(localStorage.getItem("userId")) setUserId(localStorage.getItem("userId"))
      if(localStorage.getItem("user_id")) setUserId(localStorage.getItem("user_id"))
    }catch{}
  },[propUserId])

  const onPointerDown = (e)=>{
    dragging.current = true
    moved.current = false
    setIsDragging(true)
    startPos.current = { x: e.clientX, y: e.clientY }
    offset.current = { x: e.clientX - posRef.current.x, y: e.clientY - posRef.current.y }
    e.currentTarget.setPointerCapture(e.pointerId)
  }
  const onPointerMove = (e)=>{
    if(!dragging.current) return
    const nx = e.clientX - offset.current.x
    const ny = e.clientY - offset.current.y
    if(Math.abs(e.clientX - startPos.current.x) > 6 || Math.abs(e.clientY - startPos.current.y) > 6) moved.current = true
    setPos({ x: nx, y: ny })
  }
  const onPointerUp = ()=>{
    dragging.current = false
    setIsDragging(false)
    setTimeout(()=>{ moved.current = false }, 150)
  }
  const handleClick = ()=>{ if(moved.current) return; setOpen(true) }

  const checkCode = async (val)=>{
    const CODE = val.toUpperCase()
    setCode(CODE)
    if(CODE.length < 2){ setPreview(null); return }
    if(!userId) return
    try{
      const res = await fetch("/api/user/gift/claim", {
        method:"POST",
        body: JSON.stringify({ code: CODE, userId, preview: true }),
        headers: {"Content-Type":"application/json"}
      })
      const data = await res.json()
      if(data.valid) setPreview(data.amount)
      else setPreview("Invalid")
    }catch{ setPreview("Invalid") }
  }

  const claim = async ()=>{
    if(!userId) return
    if(!code) return
    setLoading(true)
    const res = await fetch("/api/user/gift/claim", {
      method:"POST",
      body: JSON.stringify({ code: code.toUpperCase(), userId }),
      headers: {"Content-Type":"application/json"}
    })
    const data = await res.json()
    setLoading(false)
    if(data.success){
      setWonAmount(data.amount)
      setOpen(false)
      setSuccessOpen(true)
      try{
        for(const k of ['riot_user','user']){
          const raw = localStorage.getItem(k)
          if(raw){
            const lu = JSON.parse(raw)
            lu.totalBalance = data.user?.totalBalance ?? Number(lu.totalBalance||0) + data.amount
            lu.balance = lu.totalBalance
            lu.availableBalance = lu.totalBalance
            localStorage.setItem(k, JSON.stringify(lu))
          }
        }
      }catch{}
    }else{ setPreview("Invalid") }
  }

  return (
    <>
      <div 
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
        onClick={handleClick}
        style={{ transform: `translate(${pos.x}px, ${pos.y}px)` }}
        className={`fixed bottom-24 right-4 z-50 w-14 h-14 bg-gradient-to-r from-yellow-400 to-orange-500 rounded-full flex items-center justify-center shadow-xl cursor-grab touch-none select-none ${isDragging ? 'cursor-grabbing scale-110' : 'animate-bounce'}`}
      >
        <span className="text-[28px] leading-none pointer-events-none">🎁</span>
      </div>

      {open && (
        <div className="fixed inset-0 z-[100] bg-black/70 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-sm p-5">
            <h2 className="text-center font-bold text-lg text-black">🎁 Gift Giveaway</h2>
            <p className="text-center text-xs text-gray-500 mb-4">First come, first serve</p>
            <div className="flex gap-2 items-center">
              <input value={code} onChange={(e)=>checkCode(e.target.value)} placeholder="Enter code e.g. WIN38K" className="flex-1 border rounded-xl px-3 py-3 text-sm text-black uppercase" />
              <div className="w-[95px] h-[46px] border rounded-xl bg-yellow-50 flex items-center justify-center text-[11px] font-bold text-orange-600 text-center px-1">
                {preview ? (typeof preview === 'number' ? `${preview.toLocaleString()} UGX` : 'Invalid') : '--'}
              </div>
            </div>
            <button onClick={claim} disabled={typeof preview !== 'number' || loading} className="w-full mt-4 bg-black text-white rounded-xl py-3 text-sm font-bold disabled:opacity-30">
              {loading ? '...' : 'Confirm Gift'}
            </button>
            <button onClick={()=>setOpen(false)} className="w-full mt-2 text-xs text-gray-400 py-2">Close</button>
          </div>
        </div>
      )}

      {/* ORANGE GOLD POPUP */}
      {successOpen && (
        <div className="fixed inset-0 z-[200] bg-black/80 flex items-center justify-center p-4">
          <div className="bg-gradient-to-br from-[#FFD700] via-[#FFA500] to-[#FF6A00] rounded-[24px] w-full max-w-[320px] p-6 text-center shadow-2xl border-2 border-yellow-200">
            <div className="text-[52px] mb-2 drop-shadow">🎉</div>
            <h2 className="font-black text-[22px] text-white drop-shadow-[0_1px_1px_rgba(0,0,0,0.3)]">Congratulations 👏🎉</h2>
            <p className="text-[15px] font-bold text-white mt-3">You won</p>
            <p className="text-[28px] font-black text-white drop-shadow mt-1">{wonAmount.toLocaleString()} UGX</p>
            <p className="text-[12px] font-bold text-white/90 mt-2">Added to your Total Balance</p>
            <button onClick={()=>{ setSuccessOpen(false); window.location.href='/mine' }} className="w-full mt-5 py-3.5 bg-white text-[#FF8C00] rounded-full font-black text-[14px] shadow-lg">Go to Mine Page</button>
            <button onClick={()=>{ setSuccessOpen(false); window.location.reload() }} className="w-full mt-2 text-[12px] text-white/80 font-bold py-2">Close</button>
          </div>
        </div>
      )}
    </>
  )
}