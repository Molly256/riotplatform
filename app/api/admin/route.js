export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'
import { Redis } from '@upstash/redis'
import { NextResponse } from 'next/server'

const redis = Redis.fromEnv()
const P = 'rp:'

const parse = s => { if(typeof s==='object') return s; try{return JSON.parse(s)}catch{return null} }

const getUgDate = () => new Date().toLocaleDateString('en-GB', { timeZone: 'Africa/Kampala' })
const getUgTime = () => new Date().toLocaleTimeString('en-GB', { timeZone: 'Africa/Kampala', hour:'2-digit', minute:'2-digit', hour12:false })
const getUgDateTimeDisplay = () => `${getUgDate()} ${getUgTime()}`

const normalizePhone = p => { if(!p) return ''; let s=String(p).replace(/\s/g,''); if(s.startsWith('+256')) s='0'+s.slice(4); if(s.startsWith('256')) s='0'+s.slice(3); return s }

async function getUserByQuery(q){
  if(!q) return null
  const raw = String(q).trim()
  const low = raw.toLowerCase()
  let userId = null
  if(/^\d{4,6}$/.test(raw)){
    const exists = await redis.exists(`${P}user:${raw}`)
    if(exists) userId = raw
  }
  if(!userId) userId = await redis.get(`${P}phone:${raw}`)
  if(!userId) userId = await redis.get(`${P}phone:${normalizePhone(raw)}`)
  if(!userId) userId = await redis.get(`${P}username:${low}`)
  if(!userId) userId = await redis.get(`${P}email:${low}`)
  if(!userId){
    const exists = await redis.exists(`${P}user:${raw}`)
    if(exists) userId = raw
  }
  if(!userId){
    const all = await redis.smembers(`${P}all_users`)
    for(const id of all.slice(0,400)){
      const u = await redis.get(`${P}user:${id}`); if(!u) continue
      const uObj = typeof u==='string'? parse(u):u; if(!uObj) continue
      if(String(uObj.phone||'').includes(raw) || normalizePhone(uObj.phone||'').includes(normalizePhone(raw)) || String(uObj.username||'').toLowerCase()===low || String(uObj.userId||'').toLowerCase()===low) return uObj
    }
    return null
  }
  const u = await redis.get(`${P}user:${userId}`)
  if(!u) return null
  return typeof u==='string'? parse(u):u
}

export async function GET(req){
  try{
    const { searchParams } = new URL(req.url)
    const action = searchParams.get('action')
    const q = searchParams.get('q') || ''
    const type = searchParams.get('type')
    const statusF = searchParams.get('status')
    const dateF = searchParams.get('date')
    const qF = searchParams.get('q') || searchParams.get('filter') || ''

    if(action==='pending'){
      const depIds = await redis.lrange(`${P}pending:deposits`,0,500)
      const wdIds = await redis.lrange(`${P}pending:withdraws`,0,500)
      const deposits=[]; for(const id of depIds){ const tx = await redis.get(`${P}pending:deposit:${id}`); if(tx){ const o = typeof tx==='string'? parse(tx):tx; if(o && o.status==='pending') deposits.push(o) } }
      const withdraws=[]; for(const id of wdIds){ const tx = await redis.get(`${P}pending:withdraw:${id}`); if(tx){ const o = typeof tx==='string'? parse(tx):tx; if(o && o.status==='pending') withdraws.push(o) } }
      return NextResponse.json({ success:true, deposits, withdraws, pending:[...deposits,...withdraws] }, { headers:{'Cache-Control':'no-store'} })
    }

    if(action==='history'){
      let depHist = await redis.lrange(`${P}admin:history:deposit`,0,5000)
      let wdHist = await redis.lrange(`${P}admin:history:withdraw`,0,5000)
      let pDep = depHist.map(v=>parse(v)).filter(Boolean)
      let pWd = wdHist.map(v=>parse(v)).filter(Boolean)

      const filterFn = (tx) => {
        if(statusF && statusF!=='all'){
          const s = (tx.historyStatus||tx.status||'').toLowerCase()
          if(statusF==='approved' && !(s==='success'||s==='approved')) return false
          if(statusF==='rejected' && !(s==='failed'||s==='rejected')) return false
        }
        if(dateF && !String(tx.date||tx.displayTime||tx.dateStr||'').includes(dateF)) return false
        if(qF && type){
          const hay = `${tx.phone||''} ${tx.username||''} ${tx.userId||''} ${tx.wallet||''} ${tx.withdrawPhone||''}`.toLowerCase()
          if(!hay.includes(qF.toLowerCase())) return false
        }
        return true
      }
      pDep = pDep.filter(filterFn)
      pWd = pWd.filter(filterFn)

      if(type==='deposit') return NextResponse.json({ success:true, history:pDep })
      if(type==='withdraw') return NextResponse.json({ success:true, history:pWd })
      return NextResponse.json({ success:true, deposits:pDep, withdraws:pWd, history:[...pDep,...pWd] })
    }

    if(action==='users' || action==='user'){
      if(!q) return NextResponse.json({ success:false, error:'q required' },{status:400})
      const direct = await getUserByQuery(q)
      if(direct) return NextResponse.json({ success:true, users:[direct], user:direct })
      return NextResponse.json({ success:false, error:'User not found' },{status:404})
    }
    return NextResponse.json({ success:false, error:'Invalid action' },{status:400})
  }catch(err){ return NextResponse.json({ success:false, error:err.message },{status:500}) }
}

export async function POST(req){
  try{
    const body = await req.json()
    let { action, id, txId, status, password, phone, q, amount, type, userId, username } = body
    const actualId = id || txId
    const query = body.userId || userId || q || phone || username || ''

    if(action==='success' || action==='failed' || action==='approve' || action==='reject'){
      const finalStatus = (status==='success' || action==='success' || action==='approve') ? 'success' : 'failed'
      const historyStatus = finalStatus==='success' ? 'approved' : 'rejected'
      let txObj = null; let isDeposit = true; let pendingKey = ''
      let tx = await redis.get(`${P}pending:deposit:${actualId}`)
      if(tx){ txObj = typeof tx==='string'? parse(tx):tx; isDeposit=true; pendingKey=`${P}pending:deposit:${actualId}` }
      if(!txObj){
        tx = await redis.get(`${P}pending:withdraw:${actualId}`)
        if(tx){ txObj = typeof tx==='string'? parse(tx):tx; isDeposit=false; pendingKey=`${P}pending:withdraw:${actualId}` }
      }
      if(!txObj) return NextResponse.json({ success:false, error:`Tx not found ${actualId}` },{status:404})
      const user = await getUserByQuery(txObj.userId || txObj.phone)
      if(!user) return NextResponse.json({ success:false, error:'User not found' },{status:404})

      if(finalStatus==='success' && isDeposit){
        user.totalBalance = Number(user.totalBalance||0) + Number(txObj.amount)
        user.balance = user.totalBalance; user.availableBalance = user.totalBalance
        await redis.set(`${P}user:${user.userId}`, user)
      }
      if(finalStatus==='failed' && !isDeposit){
        const refund = Number(txObj.originalAmount||txObj.amount)
        user.totalBalance = Number(user.totalBalance||0) + refund
        user.balance = user.totalBalance; user.availableBalance = user.totalBalance
        await redis.set(`${P}user:${user.userId}`, user)
      }

      const displayTime = getUgDateTimeDisplay()
      txObj.status = finalStatus; txObj.historyStatus = historyStatus; txObj.updatedAt = displayTime; txObj.approvedAt = displayTime; txObj.displayTime = displayTime; txObj.date = getUgDate(); txObj.time = getUgTime()

      const histKey = isDeposit ? `${P}admin:history:deposit` : `${P}admin:history:withdraw`
      await redis.lpush(histKey, JSON.stringify(txObj))
      await redis.del(pendingKey)
      await redis.lrem(`${P}pending:deposits`,0,actualId)
      await redis.lrem(`${P}pending:withdraws`,0,actualId)

      try{
        const rawList = await redis.lrange(`${P}tx:${txObj.userId}`,0,-1)
        const updatedList = rawList.map(r=>{ try{ const o = typeof r==='string'? parse(r):r; if(o && o.id===actualId) return JSON.stringify({...o, status:finalStatus, historyStatus, displayTime}); return typeof r==='string'? r:JSON.stringify(r) }catch{ return r } })
        if(updatedList.length){ await redis.del(`${P}tx:${txObj.userId}`); for(const item of updatedList.reverse()) await redis.lpush(`${P}tx:${txObj.userId}`, item) }
      }catch{}

      return NextResponse.json({ success:true, user, tx:txObj })
    }

    if(action==='resetPassword'){
      if(!query || !password) return NextResponse.json({ success:false, error:'Missing' },{status:400})
      const u = await getUserByQuery(query); if(!u) return NextResponse.json({ success:false, error:'User not found' },{status:404})
      u.password = password; await redis.set(`${P}user:${u.userId}`, u)
      return NextResponse.json({ success:true, user:u })
    }

    if(action==='adminDeposit'){
      if(!query || !amount) return NextResponse.json({ success:false, error:'Missing' },{status:400})
      const u = await getUserByQuery(query); if(!u) return NextResponse.json({ success:false, error:'User not found' },{status:404})
      const amt = Number(String(amount).replace(/,/g,'')); if(isNaN(amt)||amt<=0) return NextResponse.json({ success:false, error:'Invalid' },{status:400})
      u.totalBalance = Number(u.totalBalance||0) + amt; u.balance = u.totalBalance; u.availableBalance = u.totalBalance
      await redis.set(`${P}user:${u.userId}`, u)
      const displayTime = getUgDateTimeDisplay();
      const tx = { id: `sys_${Date.now()}_${u.userId}`, type: 'deposit', label: 'Admin Deposit', amount: amt, display: `Admin Deposit ${amt.toLocaleString()}`, status: 'success', historyStatus:'approved', dateStr: displayTime, displayTime, date: getUgDate(), time: getUgTime(), timestamp: Date.now(), phone: u.phone, userId: u.userId, username: u.username, method:'ADMIN' }
      const txStr = JSON.stringify(tx)
      await redis.lpush(`${P}tx:${u.userId}`, txStr)
      await redis.lpush(`${P}admin:history:deposit`, txStr)
      return NextResponse.json({ success:true, user:u, tx })
    }
    return NextResponse.json({ success:false, error:'Invalid action' },{status:400})
  }catch(err){ return NextResponse.json({ success:false, error:err.message },{status:500}) }
}