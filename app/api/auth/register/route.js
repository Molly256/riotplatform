import { NextResponse } from 'next/server';
import { Redis } from '@upstash/redis';

// Upstash auto reads from env
const redis = Redis.fromEnv();

export async function POST(req) {
  try {
    const { phone, username, email, password } = await req.json();

    if (!phone || !username || !email || !password) {
      return NextResponse.json({ error: "All fields required" }, { status: 400 });
    }

    // 1. Check if phone/email/username already exists WITH rp: prefix
    const existingPhone = await redis.get(`rp:phone:${phone}`);
    if (existingPhone) {
      return NextResponse.json({ error: "Phone already registered" }, { status: 400 });
    }
    const existingEmail = await redis.get(`rp:email:${email}`);
    if (existingEmail) {
      return NextResponse.json({ error: "Email already registered" }, { status: 400 });
    }
    const existingUsername = await redis.get(`rp:username:${username.toLowerCase()}`);
    if (existingUsername) {
      return NextResponse.json({ error: "Username taken" }, { status: 400 });
    }

    // 2. Generate UNIQUE userId + inviteCode
    let userId, inviteCode;
    let tries = 0;
    do {
      userId = Math.floor(10000 + Math.random() * 89999).toString();
      tries++;
    } while (await redis.exists(`rp:user:${userId}`) && tries < 10);

    tries = 0;
    do {
      inviteCode = Math.floor(100000 + Math.random() * 899999).toString();
      tries++;
    } while (await redis.exists(`rp:invite:${inviteCode}`) && tries < 10);

    const user = {
      phone,
      username,
      email,
      password, // TODO: hash with bcrypt later
      userId,
      inviteCode,
      createdAt: Date.now(),
    };

    // 3. SAVE TO REDIS WITH rp: prefix - Main save
    await redis.set(`rp:user:${userId}`, user);
    await redis.set(`rp:phone:${phone}`, userId);
    await redis.set(`rp:email:${email}`, userId);
    await redis.set(`rp:username:${username.toLowerCase()}`, userId);
    await redis.set(`rp:invite:${inviteCode}`, userId);

    // Optional: Add to all users list
    await redis.sadd("rp:all_users", userId);

    console.log("New RIOT user saved to Upstash:", userId, inviteCode);

    return NextResponse.json({ success: true, user });

  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Server error: " + err.message }, { status: 500 });
  }
}