import { redis, key } from "@/app/lib/redis";

export async function POST(req) {
  try {
    const { phone, code } = await req.json();
    if (!phone || !code) return Response.json({ error: "Phone and code required" }, { status: 400 });

    // Get from Redis rp:otp:phone
    const saved = await redis.get(key("otp", phone));

    if (!saved) return Response.json({ error: "Code expired, please resend" }, { status: 400 });
    if (saved.toString() !== code.toString()) return Response.json({ error: "Wrong code" }, { status: 400 });

    // Delete after success
    await redis.del(key("otp", phone));

    return Response.json({ success: true, message: "Verified" });
  } catch (e) {
    console.error(e);
    return Response.json({ error: "Verification failed" }, { status: 500 });
  }
}