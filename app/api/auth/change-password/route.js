import { NextResponse } from 'next/server';
import { Redis } from '@upstash/redis';

const redis = Redis.fromEnv();

export async function POST(req) {
  try {
    const { userId, oldPassword, newPassword } = await req.json();

    if (!userId || !oldPassword || !newPassword) {
      return NextResponse.json({ error: "Missing fields" }, { status: 400 });
    }

    if (newPassword.length < 6) {
      return NextResponse.json({ error: "New password too short" }, { status: 400 });
    }

    // Get user from your exact key
    let user = await redis.get(`rp:user:${userId}`);
    
    // Fallback: try find by phone/email/username if userId not direct
    if (!user) {
      // Try phone lookup
      const idByPhone = await redis.get(`rp:phone:${userId}`);
      if (idByPhone) user = await redis.get(`rp:user:${idByPhone}`);
    }
    if (!user) {
      const idByEmail = await redis.get(`rp:email:${userId}`);
      if (idByEmail) user = await redis.get(`rp:user:${idByEmail}`);
    }
    if (!user) {
      const idByUsername = await redis.get(`rp:username:${userId.toLowerCase()}`);
      if (idByUsername) user = await redis.get(`rp:user:${idByUsername}`);
    }

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // === EXACT CHECK FROM YOUR REGISTER ===
    if (user.password !== oldPassword) {
      return NextResponse.json({ error: "Invalid old password" }, { status: 401 });
    }

    // Update password in DB
    user.password = newPassword;
    user.updatedAt = Date.now();

    // Save back to same key
    await redis.set(`rp:user:${user.userId}`, user);

    // Also update if accessed via other mapping, keep same userId key as source
    console.log(`✅ Password changed for ${user.userId}`);

    return NextResponse.json({ success: true, message: "Saved successful" });

  } catch (err) {
    console.error("change-password error:", err);
    return NextResponse.json({ error: "Server error: " + err.message }, { status: 500 });
  }
}