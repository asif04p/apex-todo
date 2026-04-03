import { redirect } from "next/navigation";
import { getSession } from "@/lib/session";
import { getLevelInfo } from "@/lib/auth";
import prisma from "@/lib/db";
import DashboardClient from "@/components/dashboard/DashboardClient";

export default async function DashboardPage() {
  const session = await getSession();
  if (!session) redirect("/login");

  const user = await prisma.user.findUnique({ where: { id: session.id } });
  if (!user) redirect("/login");

  const tasks = await prisma.task.findMany({
    where: { userId: session.id },
    orderBy: [{ status: "asc" }, { createdAt: "desc" }],
  });

  const lvInfo = getLevelInfo(user.xp);

  return (
    <DashboardClient
      initialUser={{
        id: user.id, name: user.name, email: user.email,
        avatarColor: user.avatarColor, xp: user.xp,
        level: user.level, levelInfo: lvInfo, streak: user.streak,
        completedCount: user.completedCount, pomosTotal: user.pomosTotal,
        minutesFocused: user.minutesFocused,
      }}
      initialTasks={tasks.map(t => ({
        id: t.id, userId: t.userId, title: t.title,
        priority: t.priority as any, pomoDuration: t.pomoDuration,
        reminderTime: t.reminderTime, status: t.status as any,
        notes: t.notes,
        completedAt: t.completedAt ? Number(t.completedAt) : null,
        createdAt: Number(t.createdAt), updatedAt: Number(t.updatedAt),
      }))}
    />
  );
}
