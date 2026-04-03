import nodemailer from "nodemailer";

function buildEmailHtml(name: string, verifyUrl: string): string {
  return `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width">
<title>Verify your Apex account</title>
<style>
  body { margin: 0; padding: 0; background: #faf7f2; font-family: 'Helvetica Neue', Arial, sans-serif; }
  .wrapper { max-width: 560px; margin: 40px auto; background: white; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 24px rgba(15,14,12,0.1); }
  .header { background: #0f0e0c; padding: 36px 40px; text-align: center; }
  .logo-mark { display: inline-block; width: 36px; height: 36px; background: rgba(224,179,64,0.15); border: 1px solid rgba(224,179,64,0.3); border-radius: 9px; font-size: 18px; color: #e0b340; font-style: italic; line-height: 36px; text-align: center; margin-right: 10px; vertical-align: middle; }
  .logo-name { font-size: 22px; color: rgba(255,255,255,0.9); font-weight: 300; vertical-align: middle; }
  .body { padding: 40px; }
  h1 { font-size: 24px; color: #0f0e0c; font-weight: 400; margin: 0 0 12px; }
  p { font-size: 15px; color: #6b6560; line-height: 1.7; margin: 0 0 20px; }
  .btn { display: inline-block; background: #0f0e0c; color: #f5d78a !important; text-decoration: none; padding: 14px 32px; border-radius: 10px; font-size: 14px; font-weight: 600; letter-spacing: 0.04em; margin: 8px 0 24px; }
  .divider { height: 1px; background: #e9e1d5; margin: 24px 0; }
  .link-box { background: #faf7f2; border: 1px solid #e9e1d5; border-radius: 8px; padding: 12px 16px; font-size: 12px; color: #8c8479; word-break: break-all; font-family: monospace; }
  .expire-note { font-size: 13px; color: #8c8479; background: #fdf3d8; border: 1px solid rgba(196,154,42,0.2); border-radius: 8px; padding: 10px 14px; }
  .footer { padding: 20px 40px; text-align: center; font-size: 12px; color: #b5aea5; border-top: 1px solid #e9e1d5; }
</style>
</head>
<body>
<div class="wrapper">
  <div class="header">
    <span class="logo-mark">A</span>
    <span class="logo-name">Apex</span>
  </div>
  <div class="body">
    <h1>Verify your email address</h1>
    <p>Hi <strong>${name}</strong>, welcome to Apex! Click the button below to verify your email and activate your account.</p>
    <a href="${verifyUrl}" class="btn">Verify Email Address →</a>
    <p class="expire-note">⏰ This link expires in <strong>24 hours</strong>.</p>
    <div class="divider"></div>
    <p style="margin-bottom:8px;font-size:13px">Or copy and paste this URL into your browser:</p>
    <div class="link-box">${verifyUrl}</div>
    <div class="divider"></div>
    <p style="font-size:13px;color:#b5aea5;margin:0">If you didn't create an Apex account, you can safely ignore this email.</p>
  </div>
  <div class="footer">© ${new Date().getFullYear()} Apex Task Mastery · Automated email</div>
</div>
</body>
</html>`;
}

export async function sendVerificationEmail(
  email: string,
  name: string,
  token: string,
  baseUrl: string
): Promise<{ success: boolean; devToken?: string }> {
  const verifyUrl = `${baseUrl}/verify-email?token=${token}`;

  // Dev mode — no credentials set
  if (!process.env.GMAIL_USER || !process.env.GMAIL_PASS) {
    console.log("\n========================================");
    console.log("📧 DEV MODE — No GMAIL_USER/GMAIL_PASS set");
    console.log(`Verification URL: ${verifyUrl}`);
    console.log("========================================\n");
    return { success: true, devToken: token };
  }

  try {
    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.GMAIL_USER,
        pass: process.env.GMAIL_PASS,
      },
    });

    await transporter.sendMail({
      from: `"Apex Tasks" <${process.env.GMAIL_USER}>`,
      to: email,
      subject: "Verify your Apex account",
      html: buildEmailHtml(name, verifyUrl),
    });

    return { success: true };
  } catch (err) {
    console.error("Email send failed:", err);
    return { success: false };
  }
}