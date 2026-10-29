import { NextResponse } from 'next/server';

const getStore = () => {
  if (!global.codeStore) global.codeStore = new Map();
  return global.codeStore;
};

export async function POST(req) {
  try {
    const { phone, code, username, email, password } = await req.json();

    if (!phone || !code || !username || !email || !password) {
      return NextResponse.json(
        { error: "All fields required" },
        { status: 400 }
      );
    }

    const store = getStore();
    const record = store.get(phone);

    if (!record) {
      return NextResponse.json(
        { error: "Please request code first" },
        { status: 400 }
      );
    }

    if (Date.now() > record.expires) {
      store.delete(phone);
      return NextResponse.json(
        { error: "Code expired, request new one" },
        { status: 400 }
      );
    }

    if (record.code !== code) {
      return NextResponse.json({ error: "Invalid code" }, { status: 400 });
    }

    // CODE VALID - create real user
    // TODO: Replace with your DB save
    // Example: await prisma.user.create({ data: { phone, username, email, password: hashed } })

    const userId = Math.floor(10000 + Math.random() * 89999).toString();
    const inviteCode = Math.floor(100000 + Math.random() * 899999).toString();

    // Clear code after use
    store.delete(phone);

    const user = {
      phone,
      username,
      email,
      userId,
      inviteCode,
    };

    console.log("New user registered:", user);

    return NextResponse.json({
      success: true,
      user,
    });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}