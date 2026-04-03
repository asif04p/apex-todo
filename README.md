# Apex — Task Mastery v4

A production-ready task manager built with **Next.js 14**, **TypeScript**, **Prisma + SQLite**, and **Tailwind CSS**.

## ✨ Features (v4)
- 🔐 Register / Login with **email verification**
- ✅ Task management — create, complete, reopen, delete
- ✏️ **Inline title editing** — double-click any task title to rename
- 📝 **Per-task notes** — inline editor on every task
- 🎯 Priority system — High / Medium / Low
- 📅 **Due dates** — with overdue & "due soon" indicators
- 🏷️ **Tags/labels** — preset + custom tags, filter by tags
- 🔁 **Recurring tasks** — daily / weekly / monthly auto-respawn
- ⏱ **Pomodoro timer** — focus sessions with ring timer + document title countdown
- 🎵 **Ambient sounds** — Rain / Fire / Café via Web Audio API (no files needed)
- 🏆 XP, levels, confetti rewards, achievements
- 📊 Stats dashboard — streaks, completions, pomodoros
- 📋 List + Board (kanban) views
- 🔔 Time-based reminders
- 🌙 **Dark mode** — persistent, toggle in sidebar
- 🔍 **Search** — find tasks by title, notes, or tags
- ☑️ **Bulk actions** — select multiple tasks to complete or delete
- 📤 **Export** — download as CSV or JSON
- ↕️ **Drag-to-reorder** tasks
- ⌨️ **Keyboard shortcuts** — `N` new, `F` focus, `/` search, `1-5` views
- 📊 **Pomodoro stats** — live Total/Mins in the timer panel

## 🚀 Quick Start

```bash
npm install
npx prisma db push
npm run dev
```

Open **http://localhost:3000**

> **No email setup needed for local dev** — a clickable verification link appears on screen after registering.

## ⌨️ Keyboard Shortcuts

| Key | Action |
|-----|--------|
| `N` | Add new task (focuses input) |
| `F` | Toggle Focus Timer |
| `/` | Open search |
| `1` | Today view |
| `2` | Upcoming view |
| `3` | All Tasks view |
| `4` | Completed view |
| `5` | Stats view |
| `Esc` | Close modal/timer |

## 📧 Email Setup (Gmail)

```
DATABASE_URL="file:./data/apex.db"
GMAIL_USER=your@gmail.com
GMAIL_PASS=your-app-password
```

## 🛠 Tech Stack

| Layer     | Tech                          |
|-----------|-------------------------------|
| Framework | Next.js 14 (App Router)       |
| Language  | TypeScript                    |
| Database  | SQLite via Prisma ORM         |
| Auth      | HTTP-only cookies + bcrypt    |
| Email     | Nodemailer (Gmail/SMTP)       |
| Styling   | Tailwind CSS + CSS Variables  |
| Audio     | Web Audio API                 |
| Icons     | Lucide React                  |
