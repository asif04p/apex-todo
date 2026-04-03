import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db";
import { generateVerificationToken } from "@/lib/auth";
import { sendVerificationEmail } from "@/lib/email";

export async function POST(req: NextRequest) {
  try {
    const { email } = await req.json();
    if (!email) return NextResponse.json({ success: false, error: "Email required." }, { status: 400 });
    const user = await prisma.user.findUnique({ where: { email: email.toLowerCase().trim() } });
    if (!user) return NextResponse.json({ success: false, error: "No account found with that email." }, { status: 404 });
    if (user.emailVerified) return NextResponse.json({ success: false, error: "Account already verified." }, { status: 400 });
    const token = generateVerificationToken();
    const expires = BigInt(Date.now() + 24 * 60 * 60 * 1000);
    await prisma.user.update({ where: { id: user.id }, data: { verificationToken: token, verificationExpires: expires } });
    const result = await sendVerificationEmail(email, user.name, token, req.nextUrl.origin);
    return NextResponse.json({ success: true, message: "Verification email sent! Check your inbox.", devToken: result.devToken });
  } catch (err) {
    console.error("Resend error:", err);
    return NextResponse.json({ success: false, error: "Something went wrong." }, { status: 500 });
  }
}
