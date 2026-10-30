import { NextResponse } from "next/server";
import { Redis } from "@upstash/redis";

const redis = Redis.fromEnv();

export async function POST(req) {
  try {
    const { phone, password, countryCode, fullPhone } = await req.json();
    
    if (!phone || !password) {
      return NextResponse.json({ error: "Phone and password required" }, { status: 400 });
    }

    const checkPhone = fullPhone || `${countryCode}${phone}`;

    // 1. Find userId by phone WITH rp: prefix
    let userId = await redis.get(`rp:phone:${checkPhone}`);
    if (!userId) userId = await redis.get(`rp:phone:${phone}`); // fallback

    if (!userId) {
      return NextResponse.json({ error: "User not found - register first" }, { status: 404 });
    }

    // 2. Get user data WITH rp: prefix
    const user = await redis.get(`rp:user:${userId}`);
    if (!user) {
      return NextResponse.json({ error: "User data corrupted" }, { status: 404 });
    }

    // 3. Check real password from Redis (what user registered with)
    if (user.password !== password) {
      return NextResponse.json({ error: "Wrong password" }, { status: 401 });
    }

    // 4. Success
    return NextResponse.json({
      success: true,
      user: {
        phone: user.phone,
        username: user.username,
        email: user.email,
        userId: user.userId,
        inviteCode: user.inviteCode,
      }
    });

  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}