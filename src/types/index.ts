export type Priority = "high" | "medium" | "low";
export type TaskStatus = "active" | "completed";
export type Recurring = "daily" | "weekly" | "monthly" | null;

export interface Task {
  id: string;
  userId: string;
  title: string;
  priority: Priority;
  pomoDuration: number;
  reminderTime: string | null;
  dueDate: string | null;
  status: TaskStatus;
  notes: string;
  tags: string; // comma-separated
  recurring: Recurring;
  completedAt: number | null;
  createdAt: number;
  updatedAt: number;
}

export interface User {
  id: string;
  name: string;
  email: string;
  emailVerified: boolean;
  avatarColor: string;
  xp: number;
  level: number;
  streak: number;
  completedCount: number;
  pomosTotal: number;
  minutesFocused: number;
  createdAt: number;
}

export interface CreateTaskInput {
  title: string;
  priority?: Priority;
  pomoDuration?: number;
  reminderTime?: string;
  dueDate?: string;
  notes?: string;
  tags?: string;
  recurring?: Recurring;
}

export interface UpdateTaskInput {
  title?: string;
  priority?: Priority;
  pomoDuration?: number;
  reminderTime?: string;
  dueDate?: string;
  status?: TaskStatus;
  notes?: string;
  tags?: string;
  recurring?: Recurring;
}

export interface ApiResponse<T = void> {
  success: boolean;
  data?: T;
  error?: string;
}

export const XP_REWARDS = { high: 100, medium: 50, low: 30 } as const;

export const ACHIEVEMENTS = [
  { id: "first",   emoji: "🌱", name: "First Steps",   desc: "Complete your first task",  req: (u: User) => u.completedCount >= 1 },
  { id: "five",    emoji: "🎯", name: "Sharpshooter",  desc: "Complete 5 tasks",           req: (u: User) => u.completedCount >= 5 },
  { id: "twenty",  emoji: "🔥", name: "On Fire",       desc: "Complete 20 tasks",          req: (u: User) => u.completedCount >= 20 },
  { id: "hundred", emoji: "💯", name: "Centurion",     desc: "Complete 100 tasks",         req: (u: User) => u.completedCount >= 100 },
  { id: "pomo1",   emoji: "🍅", name: "First Focus",   desc: "Complete a pomodoro",        req: (u: User) => u.pomosTotal >= 1 },
  { id: "pomo10",  emoji: "⏱",  name: "Deep Worker",   desc: "Complete 10 pomodoros",      req: (u: User) => u.pomosTotal >= 10 },
  { id: "xp500",   emoji: "⚡", name: "Energized",     desc: "Earn 500 XP",                req: (u: User) => u.xp >= 500 },
  { id: "xp2k",    emoji: "💎", name: "Diamond Mind",  desc: "Earn 2000 XP",               req: (u: User) => u.xp >= 2000 },
  { id: "lv5",     emoji: "🏆", name: "Champion",      desc: "Reach Level 5",              req: (u: User) => u.level >= 5 },
  { id: "lv10",    emoji: "👑", name: "Apex",          desc: "Reach Level 10",             req: (u: User) => u.level >= 10 },
] as const;
