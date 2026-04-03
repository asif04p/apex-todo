import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db";
import { getSession } from "@/lib/session";
import { getLevelInfo } from "@/lib/auth";

export async function GET() {
  try {
    const session = await getSession();
    if (!session) return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    const user = await prisma.user.findUnique({ where: { id: session.id } });
    if (!user) return NextResponse.json({ success: false, error: "User not found." }, { status: 404 });
    const lvInfo = getLevelInfo(user.xp);
    return NextResponse.json({
      success: true,
      data: {
        id: user.id, name: user.name, email: user.email,
        avatarColor: user.avatarColor, xp: user.xp,
        level: user.level, levelInfo: lvInfo, streak: user.streak,
        completedCount: user.completedCount, pomosTotal: user.pomosTotal,
        minutesFocused: user.minutesFocused,
      },
    });
  } catch (err) {
    return NextResponse.json({ success: false, error: "Something went wrong." }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const session = await getSession();
    if (!session) return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    const body = await req.json();
    if (body.completedPomo) {
      await prisma.user.update({
        where: { id: session.id },
        data: { pomosTotal: { increment: 1 }, minutesFocused: { increment: body.minutesFocused || 25 } },
      });
    }
    const user = await prisma.user.findUnique({ where: { id: session.id } });
    return NextResponse.json({
      success: true,
      data: {
        pomosTotal: user?.pomosTotal || 0,
        minutesFocused: user?.minutesFocused || 0,
        streak: user?.streak || 0,
      }
    });
  } catch (err) {
    return NextResponse.json({ success: false, error: "Something went wrong." }, { status: 500 });
  }
}

// Export tasks
export async function PUT(req: NextRequest) {
  try {
    const session = await getSession();
    if (!session) return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    const { format } = await req.json();
    const tasks = await prisma.task.findMany({ where: { userId: session.id }, orderBy: { createdAt: "desc" } });

    if (format === "csv") {
      const headers = "id,title,priority,status,dueDate,tags,pomoDuration,notes,completedAt,createdAt";
      const rows = tasks.map(t => [
        t.id, `"${t.title.replace(/"/g, '""')}"`, t.priority, t.status,
        t.dueDate || "", `"${(t.tags || "").replace(/"/g, '""')}"`,
        t.pomoDuration, `"${t.notes.replace(/"/g, '""')}"`,
        t.completedAt ? new Date(Number(t.completedAt)).toISOString() : "",
        new Date(Number(t.createdAt)).toISOString(),
      ].join(","));
      const csv = [headers, ...rows].join("\n");
      return new NextResponse(csv, {
        headers: { "Content-Type": "text/csv", "Content-Disposition": "attachment; filename=apex-tasks.csv" },
      });
    }

    // JSON export
    const data = tasks.map(t => ({
      id: t.id, title: t.title, priority: t.priority, status: t.status,
      dueDate: t.dueDate, tags: t.tags, pomoDuration: t.pomoDuration,
      notes: t.notes, recurring: t.recurring,
      completedAt: t.completedAt ? new Date(Number(t.completedAt)).toISOString() : null,
      createdAt: new Date(Number(t.createdAt)).toISOString(),
    }));
    return NextResponse.json({ success: true, data });
  } catch (err) {
    return NextResponse.json({ success: false, error: "Something went wrong." }, { status: 500 });
  }
}
