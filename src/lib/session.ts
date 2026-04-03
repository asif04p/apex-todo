// ── SERVER-ONLY SESSION HELPERS ───────────────────────────────
// Only import this file in Server Components and API routes,
// never in "use client" components.
import { cookies } from "next/headers";
import { v4 as uuidv4 } from "uuid";
import prisma from "./db";

export interface SessionUser {
  id: string; name: string; email: string; emailVerified: boolean;
  avatarColor: string; xp: number; level: number; streak: number;
  completedCount: number; pomosTotal: number; minutesFocused: number;
}

export async function createSession(userId: string): Promise<string> {
  const sessionId = uuidv4();
  const expiresAt = BigInt(Date.now() + 30 * 24 * 60 * 60 * 1000);
  await prisma.session.create({
    data: { id: sessionId, userId, expiresAt, createdAt: BigInt(Date.now()) },
  });
  return sessionId;
}

export async function getSession(): Promise<SessionUser | null> {
  try {
    const cookieStore = cookies();
    const sessionId = cookieStore.get("apex_session")?.value;
    if (!sessionId) return null;
    const session = await prisma.session.findFirst({
      where: { id: sessionId, expiresAt: { gt: BigInt(Date.now()) } },
    });
    if (!session) return null;
    const user = await prisma.user.findUnique({ where: { id: session.userId } });
    if (!user) return null;
    return {
      id: user.id, name: user.name, email: user.email,
      emailVerified: user.emailVerified, avatarColor: user.avatarColor,
      xp: user.xp, level: user.level, streak: user.streak,
      completedCount: user.completedCount, pomosTotal: user.pomosTotal,
      minutesFocused: user.minutesFocused,
    };
  } catch {
    return null;
  }
}
