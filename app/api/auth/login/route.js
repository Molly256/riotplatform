import { NextResponse } from "next/server";
import twilio from "twilio";

const client = twilio(
  process.env.TWILIO_SID,
  process.env.TWILIO_TOKEN
);

export async function POST(req) {
  try {
    const { phone, password, countryCode } = await req.json();
    
    if (!phone || !password) {
      return NextResponse.json({ error: "Phone and password required" }, { status: 400 });
    }

    const fullPhone = `${countryCode}${phone}`; // e.g. +256772229389

    // TODO: Check your database here
    // const user = await db.users.findOne({ phone: fullPhone })
    // For now mock check:
    if (password.length < 4) {
      return NextResponse.json({ error: "Invalid password" }, { status: 401 });
    }

    // Optional: Send login alert via your US number
    // await client.messages.create({
    //   body: `RIOT LOGIN: ${fullPhone} just logged in`,
    //   from: process.env.TWILIO_PHONE, // +17372508034
    //   to: fullPhone
    // });

    return NextResponse.json({ success: true, phone: fullPhone });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}