import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import prisma from "@/lib/db";
import { createSession } from "@/lib/session";

export async function POST(req: NextRequest) {
  try {
    const { email, password } = await req.json();
    if (!email?.trim() || !password)
      return NextResponse.json({ success: false, error: "Email and password are required." }, { status: 400 });

    const user = await prisma.user.findUnique({ where: { email: email.toLowerCase().trim() } });
    if (!user) return NextResponse.json({ success: false, error: "Invalid email or password." }, { status: 401 });

    const match = await bcrypt.compare(password, user.passwordHash);
    if (!match) return NextResponse.json({ success: false, error: "Invalid email or password." }, { status: 401 });

    if (!user.emailVerified)
      return NextResponse.json({
        success: false,
        error: "Please verify your email before logging in.",
        needsVerification: true,
        email: user.email,
      }, { status: 403 });

    await prisma.user.update({ where: { id: user.id }, data: { lastActive: new Date().toISOString() } });
    const sessionId = await createSession(user.id);

    const response = NextResponse.json({
      success: true,
      user: { id: user.id, name: user.name, email: user.email, avatarColor: user.avatarColor },
    });
    response.cookies.set("apex_session", sessionId, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 30 * 24 * 60 * 60,
      path: "/",
    });
    return response;
  } catch (err) {
    console.error("Login error:", err);
    return NextResponse.json({ success: false, error: "Something went wrong." }, { status: 500 });
  }
}
