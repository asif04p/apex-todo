import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db";
import { createSession } from "@/lib/session";

export async function POST(req: NextRequest) {
  try {
    const { token } = await req.json();
    if (!token)
      return NextResponse.json({ success: false, error: "Token required." }, { status: 400 });

    const user = await prisma.user.findFirst({ where: { verificationToken: token } });
    if (!user)
      return NextResponse.json({ success: false, error: "Invalid or expired verification link." }, { status: 400 });

    if (user.emailVerified)
      return NextResponse.json({ success: true, message: "Email already verified. You can log in." });

    if (user.verificationExpires && user.verificationExpires < BigInt(Date.now()))
      return NextResponse.json({
        success: false,
        error: "This link has expired. Please request a new one.",
        expired: true,
        email: user.email,
      }, { status: 400 });

    await prisma.user.update({
      where: { id: user.id },
      data: { emailVerified: true, verificationToken: null, verificationExpires: null },
    });

    const sessionId = await createSession(user.id);
    const response = NextResponse.json({
      success: true,
      message: "Email verified! Welcome to Apex.",
      user: { id: user.id, name: user.name },
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
    console.error("Verify error:", err);
    return NextResponse.json({ success: false, error: "Something went wrong." }, { status: 500 });
  }
}
