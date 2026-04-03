// ── SHARED UTILITIES (safe to import anywhere) ────────────────
import { v4 as uuidv4 } from "uuid";

export const AVATAR_COLORS = [
  "#e0b340","#6ec3a4","#e07b7b","#7ba8e0","#c47be0",
  "#e0a87b","#7be0c4","#a87be0","#e07bb5","#7bc4e0",
];

export function getInitials(name: string): string {
  return name.split(" ").map(w => w[0]).join("").slice(0, 2).toUpperCase();
}

export function getLevelInfo(xp: number) {
  const thresholds = [200,400,700,1100,1600,2200,3000,4000,5500];
  let cum = 0;
  for (let i = 0; i < thresholds.length; i++) {
    if (xp < cum + thresholds[i]) return { lv: i + 1, cur: xp - cum, need: thresholds[i] };
    cum += thresholds[i];
  }
  return { lv: 10, cur: xp, need: 1 };
}

export function generateVerificationToken(): string {
  return uuidv4().replace(/-/g, "") + uuidv4().replace(/-/g, "");
}

export function getGreeting(): string {
  const h = new Date().getHours();
  return h < 12 ? "morning" : h < 17 ? "afternoon" : "evening";
}
