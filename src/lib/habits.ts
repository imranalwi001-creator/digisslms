import { supabase } from "@/integrations/supabase/client";

export type HabitFrequency =
  | { type: "daily" }
  | { type: "weekdays"; days: number[] } // 0=Sun, 1=Mon, ..., 6=Sat
  | { type: "weekly"; times: number };

export interface Habit {
  id: string;
  name: string;
  description: string;
  color: string;
  frequency: HabitFrequency;
  reminderTime: string | null; // "HH:MM" or null
  createdAt: string;
  userId?: string;
}

export interface HabitLog {
  habitId: string;
  date: string; // YYYY-MM-DD
  userId?: string;
}

const HABITS_KEY = "digisschool_coding_habits_v1";
const LOGS_KEY = "digisschool_coding_logs_v1";

export const HABIT_COLORS = [
  "oklch(0.38 0.08 160)", // forest
  "oklch(0.55 0.15 200)", // ocean
  "oklch(0.60 0.15 50)",  // amber
  "oklch(0.50 0.15 320)", // berry
  "oklch(0.55 0.12 270)", // lavender
  "oklch(0.50 0.10 100)", // olive
];

export const MILESTONE_STREAKS = [7, 14, 21, 30, 50, 100, 200, 365];
export const DAY_LABELS = ["Min", "Sen", "Sel", "Rab", "Kam", "Jum", "Sab"];

export const DEFAULT_CODING_GOALS: Omit<Habit, "id" | "createdAt">[] = [
  {
    name: "🐍 Latihan Logika Python & Algoritma",
    description: "Selesaikan minimal 1 studi kasus pemecahan masalah algoritma (20 Menit).",
    color: "#10b981",
    frequency: { type: "daily" },
    reminderTime: "16:00",
  },
  {
    name: "💻 Praktik Web HTML, CSS & JavaScript",
    description: "Eksplorasi pembuatan komponen antarmuka web interaktif di browser sandbox.",
    color: "#0ea5e9",
    frequency: { type: "daily" },
    reminderTime: "19:30",
  },
  {
    name: "🎯 Selesaikan 1 Kuis / Evaluasi Modul",
    description: "Uji pemahaman materi dengan latihan kuis mandiri berstandar Kurikulum Merdeka.",
    color: "#f59e0b",
    frequency: { type: "daily" },
    reminderTime: null,
  },
];

export function getHabits(): Habit[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(HABITS_KEY);
    if (!raw) {
      const seeded: Habit[] = DEFAULT_CODING_GOALS.map((g, i) => ({
        ...g,
        id: `coding-goal-${i + 1}`,
        createdAt: new Date().toISOString(),
      }));
      localStorage.setItem(HABITS_KEY, JSON.stringify(seeded));
      return seeded;
    }
    const habits = JSON.parse(raw) as Habit[];
    return habits.map((h) => ({
      ...h,
      frequency: h.frequency ?? { type: "daily" },
      reminderTime: h.reminderTime ?? null,
    }));
  } catch {
    return [];
  }
}

export function saveHabits(habits: Habit[]) {
  if (typeof window === "undefined") return;
  localStorage.setItem(HABITS_KEY, JSON.stringify(habits));
}

export function getLogs(): HabitLog[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(LOGS_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function saveLogs(logs: HabitLog[]) {
  if (typeof window === "undefined") return;
  localStorage.setItem(LOGS_KEY, JSON.stringify(logs));
}

export function todayKey(): string {
  return new Date().toISOString().split("T")[0];
}

export function isScheduledForDate(habit: Habit, dateStr: string): boolean {
  const freq = habit.frequency;
  if (freq.type === "daily") return true;
  if (freq.type === "weekdays") {
    const dayOfWeek = new Date(dateStr + "T00:00:00").getDay();
    return freq.days.includes(dayOfWeek);
  }
  return true;
}

export function isScheduledToday(habit: Habit): boolean {
  return isScheduledForDate(habit, todayKey());
}

export function isCompletedToday(habitId: string, logs: HabitLog[]): boolean {
  const today = todayKey();
  return logs.some((l) => l.habitId === habitId && l.date === today);
}

export function toggleHabit(habitId: string, logs: HabitLog[]): HabitLog[] {
  const today = todayKey();
  const exists = logs.some((l) => l.habitId === habitId && l.date === today);
  let updated: HabitLog[];
  if (exists) {
    updated = logs.filter((l) => !(l.habitId === habitId && l.date === today));
  } else {
    updated = [...logs, { habitId, date: today }];
  }
  saveLogs(updated);
  return updated;
}

export function getStreak(habitId: string, logs: HabitLog[], _habits?: Habit[]): number {
  const dates = new Set(logs.filter((l) => l.habitId === habitId).map((l) => l.date));
  let streak = 0;
  const d = new Date();

  // Check today first, if not completed today check starting yesterday
  const today = todayKey();
  if (!dates.has(today)) {
    d.setDate(d.getDate() - 1);
  }

  while (true) {
    const key = d.toISOString().split("T")[0];
    if (dates.has(key)) {
      streak++;
      d.setDate(d.getDate() - 1);
    } else {
      break;
    }
  }

  return streak;
}

export function getLast30DaysMap(habitId: string, logs: HabitLog[]): Map<string, boolean> {
  const map = new Map<string, boolean>();
  const habitLogs = new Set(logs.filter((l) => l.habitId === habitId).map((l) => l.date));

  for (let i = 29; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const key = d.toISOString().split("T")[0];
    map.set(key, habitLogs.has(key));
  }
  return map;
}

export function createHabit(
  name: string,
  description: string,
  color: string,
  frequency: HabitFrequency = { type: "daily" },
  reminderTime: string | null = null,
): Habit {
  return {
    id: crypto.randomUUID(),
    name,
    description,
    color,
    frequency,
    reminderTime,
    createdAt: new Date().toISOString(),
  };
}

export function updateHabit(habits: Habit[], updated: Habit): Habit[] {
  return habits.map((h) => (h.id === updated.id ? updated : h));
}

export function frequencyLabel(freq: HabitFrequency): string {
  if (freq.type === "daily") return "Setiap hari";
  if (freq.type === "weekdays") {
    return freq.days.map((d) => DAY_LABELS[d]).join(", ");
  }
  if (freq.type === "weekly") {
    return `${freq.times}× per minggu`;
  }
  return "Setiap hari";
}

export function getMilestoneMessage(streak: number): string | null {
  if (!MILESTONE_STREAKS.includes(streak)) return null;
  const messages: Record<number, string> = {
    7: "🌱 Satu minggu konsisten coding!",
    14: "🌿 Dua minggu — momentum koding terbentuk!",
    21: "🍃 Tiga minggu! Logika algoritma makin terasah.",
    30: "🌳 Satu bulan! Kebiasaan programmer sejati.",
    50: "🏔️ Lima puluh hari! Dedikasi luar biasa.",
    100: "💯 Seratus hari! Master coder.",
  };
  return messages[streak] || null;
}

/* =========================================================================
 * SUPABASE DATABASE PERSISTENCE & SYNC (habits & habit_logs tables)
 * ========================================================================= */

export async function fetchHabitsFromDb(userId: string): Promise<Habit[]> {
  try {
    const { data, error } = await supabase
      .from("habits")
      .select("*")
      .eq("user_id", userId)
      .order("position", { ascending: true });

    if (error || !data || data.length === 0) {
      return getHabits();
    }

    const mapped: Habit[] = data.map((d: any) => ({
      id: d.id,
      name: d.name,
      description: d.description || "",
      color: d.color || "#10b981",
      frequency: (d.frequency as HabitFrequency) || { type: "daily" },
      reminderTime: d.reminder_time,
      createdAt: d.created_at,
      userId: d.user_id,
    }));

    saveHabits(mapped);
    return mapped;
  } catch (err) {
    console.warn("DB habits fetch fallback to local:", err);
    return getHabits();
  }
}

export async function fetchHabitLogsFromDb(userId: string): Promise<HabitLog[]> {
  try {
    const { data, error } = await supabase
      .from("habit_logs")
      .select("habit_id, date, user_id")
      .eq("user_id", userId);

    if (error || !data) {
      return getLogs();
    }

    const mapped: HabitLog[] = data.map((d: any) => ({
      habitId: d.habit_id,
      date: d.date,
      userId: d.user_id,
    }));

    saveLogs(mapped);
    return mapped;
  } catch (err) {
    console.warn("DB habit logs fallback to local:", err);
    return getLogs();
  }
}

export async function saveHabitToDb(userId: string, habit: Habit) {
  saveHabits([...getHabits().filter((h) => h.id !== habit.id), habit]);
  try {
    await supabase.from("habits").upsert({
      id: habit.id,
      user_id: userId,
      name: habit.name,
      description: habit.description,
      color: habit.color,
      frequency: habit.frequency as any,
      reminder_time: habit.reminderTime,
      position: 0,
    });
  } catch (err) {
    console.warn("Save habit to DB warning:", err);
  }
}

export async function deleteHabitFromDb(userId: string, habitId: string) {
  saveHabits(getHabits().filter((h) => h.id !== habitId));
  try {
    await supabase.from("habits").delete().eq("id", habitId).eq("user_id", userId);
  } catch (err) {
    console.warn("Delete habit from DB warning:", err);
  }
}

export async function toggleHabitLogDb(userId: string, habitId: string, dateStr = todayKey()): Promise<boolean> {
  const currentLogs = getLogs();
  const exists = currentLogs.some((l) => l.habitId === habitId && l.date === dateStr);

  // Optimistic update
  toggleHabit(habitId, currentLogs);

  try {
    if (exists) {
      await supabase
        .from("habit_logs")
        .delete()
        .eq("user_id", userId)
        .eq("habit_id", habitId)
        .eq("date", dateStr);
      return false;
    } else {
      await supabase.from("habit_logs").insert({
        user_id: userId,
        habit_id: habitId,
        date: dateStr,
      });
      return true;
    }
  } catch (err) {
    console.warn("Toggle habit log DB warning:", err);
    return !exists;
  }
}
