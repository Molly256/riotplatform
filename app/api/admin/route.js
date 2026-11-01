export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'
import { Redis } from '@upstash/redis'
import { NextResponse } from 'next/server'

const redis = Redis.fromEnv()
const P = 'rp:'  // <-- YOUR REAL KEYS, not riot:

const parse = s => { if(typeof s==='object') return s; try{return JSON.parse(s)}catch{return null} }
const getUgDate = () => new Date().toLocaleDateString('en-CA', { timeZone: 'Africa/Kampala' })
const getUgDateTime = () => new Date().toLocaleString('en-CA', { timeZone: 'Africa/Kampala', hour12:false }).replace(',','').slice(0,19)
const normalizePhone = p => { if(!p) return ''; let s=String(p).replace(/\s/g,''); if(s.startsWith('+256')) s='0'+s.slice(4); if(s.startsWith('256')) s='0'+s.slice(3); return s }

async function getUserByQuery(q){
  if(!q) return null
  const raw = String(q).trim()
  const low = raw.toLowerCase()
  // 1. Try direct rp:phone:{raw}
  let userId = await redis.get(`${P}phone:${raw}`)
  if(!userId) userId = await redis.get(`${P}phone:${normalizePhone(raw)}`)
  // 2. Try rp:username:{low}
  if(!userId) userId = await redis.get(`${P}username:${low}`)
  // 3. Try rp:email
  if(!userId) userId = await redis.get(`${P}email:${low}`)
  // 4. Try direct userId - rp:user:{raw} exists
  if(!userId){
    const exists = await redis.exists(`${P}user:${raw}`)
    if(exists) userId = raw
  }
  // 5. Try rp:phone with normalized version
  if(!userId){
    const all = await redis.smembers(`${P}all_users`)
    for(const id of all.slice(0,300)){
      const u = await redis.get(`${P}user:${id}`)
      if(!u) continue
      const uObj = typeof u==='string'? parse(u):u
      if(!uObj) continue
      if(
        String(uObj.phone||'').includes(raw) ||
        normalizePhone(uObj.phone||'').includes(normalizePhone(raw)) ||
        String(uObj.username||'').toLowerCase()===low ||
        String(uObj.userId||'').toLowerCase()===low ||
        String(uObj.userId||'')===raw
      ){
        return uObj
      }
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
    const q = searchParams.get('q') || searchParams.get('phone') || ''

    // PENDING - uses rp:pending:deposits + rp:pending:deposit:{id}  (same as deposit/withdraw fronts)
    if(action==='pending'){
      const depIds = await redis.lrange(`${P}pending:deposits`,0,100)
      const wdIds = await redis.lrange(`${P}pending:withdraws`,0,100)
      const deposits=[]
      for(const id of depIds){
        const tx = await redis.get(`${P}pending:deposit:${id}`)
        if(tx){
          const o = typeof tx==='string'? parse(tx):tx
          if(o && o.status==='pending') deposits.push(o)
        }
      }
      const withdraws=[]
      for(const id of wdIds){
        const tx = await redis.get(`${P}pending:withdraw:${id}`)
        if(tx){
          const o = typeof tx==='string'? parse(tx):tx
          if(o && o.status==='pending') withdraws.push(o)
        }
      }
      return NextResponse.json({ success:true, deposits, withdraws, pending:[...deposits,...withdraws] }, { headers:{'Cache-Control':'no-store'} })
    }

    // USERS - search by phone/username/userId using rp:phone:, rp:username:, rp:user:, rp:all_users
    if(action==='users' || action==='user'){
      if(!q) return NextResponse.json({ success:false, error:'q required' },{status:400})
      const direct = await getUserByQuery(q)
      if(direct){
        return NextResponse.json({ success:true, users:[direct], user:direct })
      }
      // scan partial
      const allIds = await redis.smembers(`${P}all_users`)
      const users=[]
      for(const id of allIds.slice(0,400)){
        const rawU = await redis.get(`${P}user:${id}`)
        if(!rawU) continue
        const u = typeof rawU==='string'? parse(rawU):rawU
        if(!u) continue
        if(
          String(u.phone||'').includes(q) ||
          normalizePhone(u.phone||'').includes(normalizePhone(q)) ||
          String(u.username||'').toLowerCase().includes(q.toLowerCase()) ||
          String(u.userId||'').toLowerCase().includes(q.toLowerCase())
        ){
          users.push(u)
        }
        if(users.length>=20) break
      }
      if(users.length===0) return NextResponse.json({ success:false, error:'User not found' },{status:404})
      return NextResponse.json({ success:true, users, user:users[0] })
    }

    return NextResponse.json({ success:false, error:'Invalid action' },{status:400})
  }catch(err){
    return NextResponse.json({ success:false, error:err.message },{status:500})
  }
}

export async function POST(req){
  try{
    const body = await req.json()
    let { action, id, txId, status, password, phone, q, amount, type } = body
    const actualId = id || txId
    const query = q || phone || ''

    // APPROVE / REJECT - uses rp:pending:deposit:{id} + rp:tx:{userId}
    if(action==='success' || action==='failed' || action==='approve' || action==='reject' || action==='updateStatus'){
      const finalStatus = (status==='success' || action==='approve' || action==='success') ? 'success' : 'failed'
      const txType = type || (String(actualId).startsWith('dep_')?'deposit':'withdraw')
      
      const key = txType==='deposit' ? `${P}pending:deposit:${actualId}` : `${P}pending:withdraw:${actualId}`
      let tx = await redis.get(key)
      if(!tx){
        // try other type
        const altKey = txType==='deposit' ? `${P}pending:withdraw:${actualId}` : `${P}pending:deposit:${actualId}`
        tx = await redis.get(altKey)
      }
      if(!tx) return NextResponse.json({ success:false, error:`Tx not found ${actualId} in ${P}pending:*` },{status:404})
      const txObj = typeof tx==='string'? parse(tx):tx
      
      const user = await getUserByQuery(txObj.userId || txObj.phone)
      if(!user) return NextResponse.json({ success:false, error:'User not found for tx' },{status:404})

      // update balance
      if(finalStatus==='success' && txType==='deposit'){
        user.totalBalance = Number(user.totalBalance||0) + Number(txObj.amount)
        user.balance = user.totalBalance
        user.availableBalance = user.totalBalance
        await redis.set(`${P}user:${user.userId}`, user)
      }
      if(finalStatus==='failed' && txType==='withdraw'){
        // refund
        const refund = Number(txObj.originalAmount||txObj.amount)
        user.totalBalance = Number(user.totalBalance||0) + refund
        user.balance = user.totalBalance
        user.availableBalance = user.totalBalance
        await redis.set(`${P}user:${user.userId}`, user)
      }

      txObj.status = finalStatus
      txObj.updatedAt = getUgDateTime()
      txObj.display = finalStatus==='success' ? `${txType} success ${txObj.amount}` : `${txType} failed`

      // update pending store
      await redis.set(key, txObj)
      // update rp:tx:{userId} list
      const rawList = await redis.lrange(`${P}tx:${txObj.userId}`,0,-1)
      const updatedList = rawList.map(r=>{
        try{
          const o = typeof r==='string'? parse(r):r
          if(o && o.id===actualId) return JSON.stringify({...o, status:finalStatus, display:txObj.display})
          return typeof r==='string'? r:JSON.stringify(r)
        }catch{ return r }
      })
      if(updatedList.length){
        await redis.del(`${P}tx:${txObj.userId}`)
        for(const item of updatedList.reverse()) await redis.lpush(`${P}tx:${txObj.userId}`, item)
      }
      // remove from pending list
      await redis.lrem(`${P}pending:deposits`,1,actualId)
      await redis.lrem(`${P}pending:withdraws`,1,actualId)
      await redis.lrem(`${P}pending:${txType}s`,1,actualId)

      return NextResponse.json({ success:true, user })
    }

    // RESET PASSWORD - modifies rp:user:{userId}.password + hot pink UI uses this
    if(action==='resetPassword'){
      if(!query || !password) return NextResponse.json({ success:false, error:'Missing phone/q and password' },{status:400})
      const u = await getUserByQuery(query)
      if(!u) return NextResponse.json({ success:false, error:'User not found - check rp:phone / rp:username / rp:user' },{status:404})
      u.password = password
      await redis.set(`${P}user:${u.userId}`, u)
      return NextResponse.json({ success:true, user:u })
    }

    // ADMIN DEPOSIT - adds to Total Balance + creates System Increase tx in rp:tx:{userId}
    if(action==='adminDeposit'){
      if(!query || !amount) return NextResponse.json({ success:false, error:'Missing q/phone and amount' },{status:400})
      const u = await getUserByQuery(query)
      if(!u) return NextResponse.json({ success:false, error:'User not found' },{status:404})
      const amt = Number(String(amount).replace(/,/g,''))
      if(isNaN(amt)||amt<=0) return NextResponse.json({ success:false, error:'Invalid amount' },{status:400})

      u.totalBalance = Number(u.totalBalance||0) + amt
      u.balance = u.totalBalance
      u.availableBalance = u.totalBalance
      await redis.set(`${P}user:${u.userId}`, u)

      const nowStr = getUgDateTime()
      const dateOnly = getUgDate()
      // Create tx with header System increase - same style as tx page
      const tx = {
        id: `sys_${Date.now()}_${u.userId}`,
        type: 'system_increase',
        label: 'System increase',
        header: 'System increase',
        title: 'System increase',
        amount: amt,
        display: `System increase ${amt.toLocaleString()} shs`,
        status: 'success',
        dateStr: nowStr,
        date: nowStr,
        createdAt: nowStr,
        timestamp: nowStr,
        fullDate: new Date().toISOString(),
        phone: u.phone,
        userId: u.userId,
        username: u.username
      }
      const txStr = JSON.stringify(tx)
      // Save to rp:tx:{userId} - this is what transactions page reads from Upstash
      await redis.lpush(`${P}tx:${u.userId}`, txStr)
      // also save to history key if your tx page uses
      await redis.lpush(`${P}transactions:${u.userId}`, txStr)
      await redis.lpush(`${P}tx:${u.phone}:${dateOnly}`, txStr)

      return NextResponse.json({ success:true, user:u, tx })
    }

    return NextResponse.json({ success:false, error:'Invalid action' },{status:400})
  }catch(err){
    return NextResponse.json({ success:false, error:err.message },{status:500})
  }
}