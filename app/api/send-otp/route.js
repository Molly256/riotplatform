import { redis, key } from "@/app/lib/redis";

export async function POST(req) {
  try {
    const { phone } = await req.json();
    if (!phone) return Response.json({ error: "Phone required" }, { status: 400 });

    // Generate 6 digit code
    const code = Math.floor(100000 + Math.random() * 900000).toString();

    // Save in Upstash Redis for 5 minutes using your key helper -> rp:otp:+966...
    await redis.set(key("otp", phone), code, { ex: 300 });

    // LOG for testing - you see this in terminal / Vercel logs
    console.log(`\n=== RIOT OTP for ${phone}: ${code} ===\n`);

    // REAL SMS - Uncomment after you add Twilio env in Vercel
    if (process.env.TWILIO_SID) {
      const twilio = require('twilio')(process.env.TWILIO_SID, process.env.TWILIO_TOKEN);
      await twilio.messages.create({
        body: `Your RIOT code is: ${code}. Valid for 5 minutes.`,
        from: process.env.TWILIO_PHONE,
        to: phone,
      });
      console.log(`SMS sent to ${phone}`);
    }

    return Response.json({ success: true, message: "Code sent" });
  } catch (e) {
    console.error(e);
    return Response.json({ error: "Failed to send code" }, { status: 500 });
  }
}