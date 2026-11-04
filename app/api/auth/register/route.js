import { NextResponse } from 'next/server';
import { Redis } from '@upstash/redis';

const redis = Redis.fromEnv();

function getClientIP(req) {
  const xff = req.headers.get('x-forwarded-for');
  if (xff) return xff.split(',')[0].trim();
  return req.headers.get('x-real-ip') || req.headers.get('cf-connecting-ip') || 'unknown';
}

async function isVPN(ip) {
  if (!ip || ip === 'unknown' || ip === '127.0.0.1' || ip === '::1' || ip.startsWith('192.168.') || ip.startsWith('10.')) return false;
  try {
    const res = await fetch(`http://ip-api.com/json/${ip}?fields=proxy,hosting,status`, { 
      cache: 'no-store',
      signal: AbortSignal.timeout(3500)
    });
    const data = await res.json();
    if (data.status !== 'success') return false;
    return data.proxy === true || data.hosting === true;
  } catch { return false; }
}

// FIXED TIME HELPERS - d/m/yr hr:mins Kampala
const getUgDate = () => new Date().toLocaleDateString('en-GB', { timeZone: 'Africa/Kampala' });
const getUgTime = () => new Date().toLocaleTimeString('en-GB', { timeZone: 'Africa/Kampala', hour:'2-digit', minute:'2-digit', hour12:false });
const getUgDateTime = () => `${getUgDate()} ${getUgTime()}`;

export async function POST(req) {
  try {
    const { phone, username, email, password, inviterCode } = await req.json();

    if (!phone || !username || !email || !password) {
      return NextResponse.json({ error: "All fields required" }, { status: 400 });
    }
    if (!inviterCode || !/^\d{6}$/.test(inviterCode)) {
      return NextResponse.json({ error: "Invite code required - must be 6 digits" }, { status: 400 });
    }

    const ip = getClientIP(req);

    if (await isVPN(ip)) {
      return NextResponse.json({ success: false, error: "VPN_DETECTED", message: "Can't create account with VPN on please turn off VPN" }, { status: 403 });
    }

    if (ip !== 'unknown') {
      const existingIp = await redis.get(`rp:ip:${ip}`);
      if (existingIp) {
        return NextResponse.json({ success: false, error: "IP_EXISTS", message: "Can't create account in same IP address" }, { status: 403 });
      }
    }

    const inviterUserId = await redis.get(`rp:invite:${inviterCode}`);
    if (!inviterUserId) return NextResponse.json({ error: "Invalid invite code - inviter not found" }, { status: 400 });
    const inviterUser = await redis.get(`rp:user:${inviterUserId}`);
    if (!inviterUser) return NextResponse.json({ error: "Invalid invite code - inviter not found" }, { status: 400 });

    const existingPhone = await redis.get(`rp:phone:${phone}`);
    if (existingPhone) return NextResponse.json({ error: "Phone already registered" }, { status: 400 });
    const existingEmail = await redis.get(`rp:email:${email}`);
    if (existingEmail) return NextResponse.json({ error: "Email already registered" }, { status: 400 });
    const existingUsername = await redis.get(`rp:username:${username.toLowerCase()}`);
    if (existingUsername) return NextResponse.json({ error: "Username taken" }, { status: 400 });

    let userId, inviteCodeNew;
    let tries = 0;
    do {
      userId = Math.floor(10000 + Math.random() * 89999).toString();
      tries++;
    } while (await redis.exists(`rp:user:${userId}`) && tries < 10);

    tries = 0;
    do {
      inviteCodeNew = Math.floor(100000 + Math.random() * 899999).toString();
      tries++;
    } while (await redis.exists(`rp:invite:${inviteCodeNew}`) && tries < 10);

    const displayTime = getUgDateTime();
    const dateOnly = getUgDate();
    const timeOnly = getUgTime();

    const user = {
      phone,
      username,
      email,
      password,
      userId,
      inviteCode: inviteCodeNew,
      referredBy: inviterCode,
      referredByUserId: inviterUserId,
      balance: 1000,
      totalBalance: 1000,
      availableBalance: 1000,
      totalChargePower: 0,
      turboAvailable: 0,
      turboLifetime: 0,
      totalTurboWatts: 0,
      ip,
      createdAt: Date.now(),
      createdAtStr: displayTime,
      createdAtDate: dateOnly,
      createdAtTime: timeOnly
    };

    await redis.set(`rp:user:${userId}`, user);
    await redis.set(`rp:phone:${phone}`, userId);
    await redis.set(`rp:email:${email}`, userId);
    await redis.set(`rp:username:${username.toLowerCase()}`, userId);
    await redis.set(`rp:invite:${inviteCodeNew}`, userId);
    await redis.sadd("rp:all_users", userId);

    if (ip !== 'unknown') {
      await redis.set(`rp:ip:${ip}`, userId);
      await redis.set(`rp:user:${userId}:ip`, ip);
      await redis.set(`rp:phone:${phone}:ip`, ip);
    }

    // FIXED TX WITH d/m/yr hr:mins
    const tx = {
      id: `reg_${Date.now()}`,
      type: "registration_reward",
      label: "Registration reward",
      amount: 1000,
      display: "Registration reward success 1000shs",
      status: "success",
      timestamp: Date.now(),
      displayTime: displayTime, // 04/11/2025 15:32
      date: dateOnly, // 04/11/2025
      time: timeOnly, // 15:32
      dateStr: displayTime,
      createdAt: displayTime
    };
    await redis.lpush(`rp:tx:${userId}`, JSON.stringify(tx));
    await redis.lpush(`rp:tx:history:${phone}`, JSON.stringify(tx));
    await redis.lpush(`rp:transactions:${userId}`, JSON.stringify(tx));

    // TEAM
    await redis.sadd(`rp:downlines:${inviterUserId}:level1`, userId);
    await redis.sadd(`rp:team:${inviterUserId}:A`, userId);
    await redis.set(`rp:user:${userId}:inviter`, inviterUserId);
    await redis.set(`rp:parent:${userId}`, inviterUserId);

    if (inviterUser.referredByUserId) {
      await redis.sadd(`rp:downlines:${inviterUser.referredByUserId}:level2`, userId);
      await redis.sadd(`rp:team:${inviterUser.referredByUserId}:B`, userId);
      const level1User = await redis.get(`rp:user:${inviterUser.referredByUserId}`);
      if (level1User && level1User.referredByUserId) {
        await redis.sadd(`rp:downlines:${level1User.referredByUserId}:level3`, userId);
        await redis.sadd(`rp:team:${level1User.referredByUserId}:C`, userId);
      }
    }

    const turboKey = `rp:turbocharge:${inviterUserId}`;
    let turboData = await redis.get(turboKey);
    if (!turboData) turboData = { totalPower: 0, members: 0, lifetime: 0 };
    
    turboData.totalPower = Number((Number(turboData.totalPower || 0) + 0.25).toFixed(2));
    turboData.lifetime = Number((Number(turboData.lifetime || 0) + 0.25).toFixed(2));
    turboData.members = Number(turboData.members || 0) + 1;
    turboData.lastUpdate = Date.now();
    await redis.set(turboKey, turboData);

    const inviter = await redis.get(`rp:user:${inviterUserId}`);
    if(inviter){
      inviter.totalChargePower = turboData.totalPower;
      inviter.turboAvailable = turboData.totalPower;
      inviter.turboLifetime = turboData.lifetime;
      inviter.totalTurboWatts = turboData.lifetime;
      await redis.set(`rp:user:${inviterUserId}`, inviter);
    }

    const turboTx = {
      id: `turbo_inv_${Date.now()}_${userId}`,
      type: "invite",
      watts: 0.25,
      from: phone,
      display: `Received 0.25W from ${phone}`,
      amount: 0.25,
      power: 0.25,
      status: "success",
      timestamp: Date.now(),
      displayTime: displayTime,
      date: dateOnly,
      time: timeOnly,
      dateStr: displayTime,
      createdAt: displayTime,
      note: `0.25W from ${phone} registration`
    };

    await redis.lpush(`rp:turbo:${inviterUserId}:earn_history`, JSON.stringify(turboTx));
    await redis.lpush(`rp:turbo:${inviterUserId}:history`, JSON.stringify(turboTx));
    await redis.lpush(`rp:tx:${inviterUserId}:history`, JSON.stringify(turboTx));

    console.log(`✅ ${inviterUserId} got 0.25W from ${phone} - IP: ${ip}`);

    return NextResponse.json({ success: true, user });

  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Server error: " + err.message }, { status: 500 });
  }
}