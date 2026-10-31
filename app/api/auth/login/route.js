import { NextResponse } from "next/server";
import { Redis } from "@upstash/redis";

const redis = Redis.fromEnv();

export async function POST(req) {
  try {
    const body = await req.json();
    const { password } = body;
    const identifier = (body.identifier || body.phone || body.email || body.username || "").trim();

    if (!identifier || !password) {
      return NextResponse.json({ error: "All fields required" }, { status: 400 });
    }

    let userId = null;

    // 1. try as phone (with +256)
    if (body.fullPhone) userId = await redis.get(`rp:phone:${body.fullPhone}`);
    if (!userId) userId = await redis.get(`rp:phone:${identifier}`);
    if (!userId && body.countryCode) userId = await redis.get(`rp:phone:${body.countryCode}${identifier}`);

    // 2. try as email - real from DB
    if (!userId) userId = await redis.get(`rp:email:${identifier.toLowerCase()}`);
    if (!userId) userId = await redis.get(`rp:email:${identifier}`);

    // 3. try as username - real from DB
    if (!userId) userId = await redis.get(`rp:username:${identifier.toLowerCase()}`);
    if (!userId) userId = await redis.get(`rp:username:${identifier}`);

    if (!userId) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const user = await redis.get(`rp:user:${userId}`);
    if (!user) {
      return NextResponse.json({ error: "User data not found" }, { status: 404 });
    }

    if (user.password !== password) {
      return NextResponse.json({ error: "Wrong password" }, { status: 401 });
    }

    return NextResponse.json({
      success: true,
      user
    });

  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}