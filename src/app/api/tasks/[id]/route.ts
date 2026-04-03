import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db";
import { getSession } from "@/lib/session";
import { getLevelInfo } from "@/lib/auth";
import { v4 as uuidv4 } from "uuid";

type Params = { params: { id: string } };

function mapTask(t: any) {
  return {
    id: t.id, userId: t.userId, title: t.title, priority: t.priority,
    pomoDuration: t.pomoDuration, reminderTime: t.reminderTime,
    dueDate: t.dueDate || null,
    status: t.status, notes: t.notes,
    tags: t.tags || "",
    recurring: t.recurring || null,
    completedAt: t.completedAt ? Number(t.completedAt) : null,
    createdAt: Number(t.createdAt), updatedAt: Number(t.updatedAt),
  };
}

export async function PATCH(req: NextRequest, { params }: Params) {
  try {
    const session = await getSession();
    if (!session) return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    const task = await prisma.task.findFirst({ where: { id: params.id, userId: session.id } });
    if (!task) return NextResponse.json({ success: false, error: "Task not found." }, { status: 404 });

    const body = await req.json();
    const now = BigInt(Date.now());
    const data: any = { updatedAt: now };

    if (body.title !== undefined) data.title = body.title.trim();
    if (body.priority !== undefined) data.priority = body.priority;
    if (body.pomoDuration !== undefined) data.pomoDuration = body.pomoDuration;
    if (body.reminderTime !== undefined) data.reminderTime = body.reminderTime || null;
    if (body.dueDate !== undefined) data.dueDate = body.dueDate || null;
    if (body.notes !== undefined) data.notes = body.notes;
    if (body.tags !== undefined) data.tags = body.tags || "";
    if (body.recurring !== undefined) data.recurring = body.recurring || null;

    let xpGained = 0;
    let leveledUp = false;

    if (body.status !== undefined && body.status !== task.status) {
      data.status = body.status;
      if (body.status === "completed") {
        data.completedAt = now;
        const xpMap: Record<string, number> = { high: 100, medium: 50, low: 30 };
        xpGained = xpMap[task.priority] || 50;
        const user = await prisma.user.findUnique({ where: { id: session.id } });
        if (user) {
          const newXp = user.xp + xpGained;
          const oldLv = getLevelInfo(user.xp).lv;
          const newLv = getLevelInfo(newXp).lv;
          leveledUp = newLv > oldLv;

          // Streak logic
          const today = new Date().toISOString().slice(0, 10);
          const yesterday = new Date(Date.now() - 86400000).toISOString().slice(0, 10);
          let newStreak = user.streak;
          if (user.lastActive === yesterday) {
            newStreak = user.streak + 1;
          } else if (user.lastActive !== today) {
            newStreak = 1;
          }

          await prisma.user.update({
            where: { id: session.id },
            data: {
              xp: newXp, level: newLv,
              completedCount: { increment: 1 },
              streak: newStreak,
              lastActive: today,
            },
          });
        }

        // Handle recurring: create a new task if recurring
        if (task.recurring) {
          let nextDue: string | null = null;
          if (task.dueDate) {
            const d = new Date(task.dueDate);
            if (task.recurring === "daily") d.setDate(d.getDate() + 1);
            else if (task.recurring === "weekly") d.setDate(d.getDate() + 7);
            else if (task.recurring === "monthly") d.setMonth(d.getMonth() + 1);
            nextDue = d.toISOString().slice(0, 10);
          }
          await prisma.task.create({
            data: {
              id: uuidv4(),
              userId: task.userId,
              title: task.title,
              priority: task.priority,
              pomoDuration: task.pomoDuration,
              reminderTime: task.reminderTime,
              dueDate: nextDue,
              notes: task.notes,
              tags: task.tags,
              recurring: task.recurring,
              createdAt: now,
              updatedAt: now,
            },
          });
        }
      } else if (body.status === "active") {
        data.completedAt = null;
      }
    }

    const updated = await prisma.task.update({ where: { id: params.id }, data });
    const user = await prisma.user.findUnique({ where: { id: session.id } });

    // Get newly spawned recurring task if any
    let newRecurringTask = null;
    if (body.status === "completed" && task.recurring) {
      const newest = await prisma.task.findFirst({
        where: { userId: session.id, title: task.title, status: "active" },
        orderBy: { createdAt: "desc" },
      });
      if (newest && newest.id !== task.id) newRecurringTask = mapTask(newest);
    }

    return NextResponse.json({
      success: true,
      data: {
        task: mapTask(updated),
        xpGained, leveledUp,
        newRecurringTask,
        user: {
          xp: user?.xp || 0, level: user?.level || 1,
          completedCount: user?.completedCount || 0, streak: user?.streak || 0
        },
      },
    });
  } catch (err) {
    console.error("Update task error:", err);
    return NextResponse.json({ success: false, error: "Something went wrong." }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: Params) {
  try {
    const session = await getSession();
    if (!session) return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    const task = await prisma.task.findFirst({ where: { id: params.id, userId: session.id } });
    if (!task) return NextResponse.json({ success: false, error: "Task not found." }, { status: 404 });
    await prisma.task.delete({ where: { id: params.id } });
    return NextResponse.json({ success: true });
  } catch (err) {
    return NextResponse.json({ success: false, error: "Something went wrong." }, { status: 500 });
  }
}
