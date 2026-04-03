import { NextRequest, NextResponse } from "next/server";
import { v4 as uuidv4 } from "uuid";
import prisma from "@/lib/db";
import { getSession } from "@/lib/session";

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

export async function GET(req: NextRequest) {
  try {
    const session = await getSession();
    if (!session) return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    const tasks = await prisma.task.findMany({
      where: { userId: session.id },
      orderBy: [{ status: "asc" }, { createdAt: "desc" }],
    });
    return NextResponse.json({ success: true, data: tasks.map(mapTask) });
  } catch (err) {
    return NextResponse.json({ success: false, error: "Something went wrong." }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getSession();
    if (!session) return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    const { title, priority = "medium", pomoDuration = 25, reminderTime = null, dueDate = null, notes = "", tags = "", recurring = null } = await req.json();
    if (!title?.trim()) return NextResponse.json({ success: false, error: "Title is required." }, { status: 400 });
    const now = BigInt(Date.now());
    const task = await prisma.task.create({
      data: {
        id: uuidv4(), userId: session.id, title: title.trim(),
        priority, pomoDuration, reminderTime: reminderTime || null,
        dueDate: dueDate || null,
        notes, tags: tags || "", recurring: recurring || null,
        createdAt: now, updatedAt: now,
      },
    });
    return NextResponse.json({ success: true, data: mapTask(task) }, { status: 201 });
  } catch (err) {
    return NextResponse.json({ success: false, error: "Something went wrong." }, { status: 500 });
  }
}
