import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import prisma from "@/lib/db";

export async function POST(req: NextRequest) {
  const cookieStore = cookies();
  const sessionId = cookieStore.get("apex_session")?.value;
  if (sessionId) {
    await prisma.session.delete({ where: { id: sessionId } }).catch(() => {});
  }
  const response = NextResponse.json({ success: true });
  response.cookies.set("apex_session", "", { maxAge: 0, path: "/" });
  return response;
}
