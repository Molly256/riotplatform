"use client"
import { useState, useRef, useEffect } from "react"

export default function GiftWidget({ userId: propUserId }){
  const [open, setOpen] = useState(false)
  const [code, setCode] = useState("")
  const [preview, setPreview] = useState(null)
  const [loading, setLoading] = useState(false)
  const [pos, setPos] = useState({ x: 0, y: 0 })
  const [userId, setUserId] = useState(propUserId || null)
  const dragging = useRef(false)
  const moved = useRef(false)
  const offset = useRef({x:0,y:0})

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

  // FIX: drag on window, not just button
  useEffect(()=>{
    const onMove = (e)=>{
      if(!dragging.current) return
      const clientX = e.touches ? e.touches[0].clientX : e.clientX
      const clientY = e.touches ? e.touches[0].clientY : e.clientY
      const nx = clientX - offset.current.x
      const ny = clientY - offset.current.y
      if(Math.abs(nx - pos.x) > 5 || Math.abs(ny - pos.y) > 5) moved.current = true
      setPos({ x: nx, y: ny })
    }
    const onUp = ()=>{
      dragging.current = false
      setTimeout(()=>{ moved.current = false }, 100)
    }
    window.addEventListener('mousemove', onMove)
    window.addEventListener('mouseup', onUp)
    window.addEventListener('touchmove', onMove, {passive:false})
    window.addEventListener('touchend', onUp)
    return ()=>{ window.removeEventListener('mousemove', onMove); window.removeEventListener('mouseup', onUp); window.removeEventListener('touchmove', onMove); window.removeEventListener('touchend', onUp) }
  },[pos])

  const onDown = (e)=>{
    dragging.current = true
    moved.current = false
    const clientX = e.touches ? e.touches[0].clientX : e.clientX
    const clientY = e.touches ? e.touches[0].clientY : e.clientY
    offset.current = { x: clientX - pos.x, y: clientY - pos.y }
  }

  const handleClick = ()=>{
    if(moved.current) return
    setOpen(true)
  }

  const checkCode = async (val)=>{
    const CODE = val.toUpperCase()
    setCode(CODE)
    if(CODE.length < 2){ setPreview(null); return }
    // FIX: don't call preview if no userId yet
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
    if(!userId) return alert("Login again - user not found")
    if(!code) return alert("Enter code")
    setLoading(true)
    const res = await fetch("/api/user/gift/claim", {
      method:"POST",
      body: JSON.stringify({ code: code.toUpperCase(), userId }),
      headers: {"Content-Type":"application/json"}
    })
    const data = await res.json()
    setLoading(false)
    if(data.success){
      alert(`🎉 ${data.amount} UGX added to Total Balance!`)
      setOpen(false)
      window.location.reload()
    }else{
      alert(data.message || "Gift code invalid")
    }
  }

  return (
    <>
      <div 
        onMouseDown={onDown}
        onTouchStart={onDown}
        onClick={handleClick}
        style={{ transform: `translate(${pos.x}px, ${pos.y}px)` }}
        className="fixed bottom-24 right-4 z-50 w-14 h-14 bg-gradient-to-r from-yellow-400 to-orange-500 rounded-full flex items-center justify-center shadow-xl cursor-grab active:cursor-grabbing touch-none select-none animate-bounce"
      >
        <span className="text-[28px] leading-none pointer-events-none">🎁</span>
      </div>

      {open && (
        <div className="fixed inset-0 z-[100] bg-black/70 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-sm p-5">
            <h2 className="text-center font-bold text-lg text-black">🎁 Gift Giveaway</h2>
            <p className="text-center text-xs text-gray-500 mb-4">First come, first serve</p>
            
            <div className="flex gap-2 items-center">
              <input
                value={code}
                onChange={(e)=>checkCode(e.target.value)}
                placeholder="Enter code e.g. WIN38K"
                className="flex-1 border rounded-xl px-3 py-3 text-sm text-black uppercase"
              />
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
    </>
  )
}