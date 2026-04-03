import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import prisma from "@/lib/db";
import { generateVerificationToken, AVATAR_COLORS } from "@/lib/auth";
import { sendVerificationEmail } from "@/lib/email";

export async function POST(req: NextRequest) {
  try {
    const { name, email, password } = await req.json();
    if (!name?.trim() || !email?.trim() || !password)
      return NextResponse.json({ success: false, error: "All fields are required." }, { status: 400 });
    if (!/^[^@]+@[^@]+\.[^@]+$/.test(email))
      return NextResponse.json({ success: false, error: "Invalid email address." }, { status: 400 });
    if (password.length < 8)
      return NextResponse.json({ success: false, error: "Password must be at least 8 characters." }, { status: 400 });
    if (name.trim().length < 2)
      return NextResponse.json({ success: false, error: "Name must be at least 2 characters." }, { status: 400 });

    const existing = await prisma.user.findUnique({ where: { email: email.toLowerCase().trim() } });
    if (existing) {
      if (existing.emailVerified)
        return NextResponse.json({ success: false, error: "An account with this email already exists." }, { status: 409 });
      const token = generateVerificationToken();
      const expires = BigInt(Date.now() + 24 * 60 * 60 * 1000);
      await prisma.user.update({ where: { id: existing.id }, data: { verificationToken: token, verificationExpires: expires } });
      const result = await sendVerificationEmail(email, name, token, req.nextUrl.origin);
      return NextResponse.json({ success: true, message: "Verification email resent. Check your inbox.", devToken: result.devToken });
    }

    const count = await prisma.user.count();
    const avatarColor = AVATAR_COLORS[count % AVATAR_COLORS.length];
    const passwordHash = await bcrypt.hash(password, 12);
    const verificationToken = generateVerificationToken();
    const verificationExpires = BigInt(Date.now() + 24 * 60 * 60 * 1000);

    await prisma.user.create({
      data: {
        name: name.trim(),
        email: email.toLowerCase().trim(),
        passwordHash,
        emailVerified: false,
        verificationToken,
        verificationExpires,
        avatarColor,
        createdAt: BigInt(Date.now()),
      },
    });

    const emailResult = await sendVerificationEmail(email, name, verificationToken, req.nextUrl.origin);
    return NextResponse.json({
      success: true,
      message: "Account created! Please check your email to verify your account.",
      devToken: emailResult.devToken,
    }, { status: 201 });
  } catch (err) {
    console.error("Register error:", err);
    return NextResponse.json({ success: false, error: "Something went wrong. Please try again." }, { status: 500 });
  }
}
