/**
 * Automatic reminders before a scheduled class starts.
 * Settings are layered: a global default, per-class overrides, and per-student
 * follow-up flags (teachers get the watched students' names in the reminder).
 */
import { useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import type { Schedule } from "./teaching";

const KEY = "continuum.class-reminders.v2";
const SENT_KEY = "continuum.class-reminders.sent.v1";

export type ReminderChannel = "browser" | "inapp" | "both";
export type ReminderFrequency = "every" | "first" | "off";

export type ScopePrefs = {
  enabled: boolean;
  leadMinutes: number;
  channel: ReminderChannel;
  frequency: ReminderFrequency;
};

export type ReminderSettings = {
  global: ScopePrefs;
  /** keyed by grade ("7" | "8" | "9") */
  classes: Record<string, Partial<ScopePrefs>>;
  /** student ids the teacher wants highlighted in the reminder */
  watchedStudents: string[];
};

export const defaultScope: ScopePrefs = {
  enabled: false,
  leadMinutes: 15,
  channel: "both",
  frequency: "every",
};

export const defaultSettings: ReminderSettings = {
  global: defaultScope,
  classes: {},
  watchedStudents: [],
};

export const channelLabel: Record<ReminderChannel, string> = {
  browser: "Notifikasi browser",
  inapp: "Notifikasi dalam aplikasi",
  both: "Browser + dalam aplikasi",
};

export const frequencyLabel: Record<ReminderFrequency, string> = {
  every: "Setiap pertemuan",
  first: "Sekali sehari (kelas pertama)",
  off: "Nonaktif untuk kelas ini",
};

export const leadOptions = [5, 10, 15, 30, 60];

export function loadSettings(): ReminderSettings {
  if (typeof window === "undefined") return defaultSettings;
  try {
    const raw = window.localStorage.getItem(KEY);
    if (!raw) return defaultSettings;
    const parsed = JSON.parse(raw);
    return {
      global: { ...defaultScope, ...(parsed.global ?? {}) },
      classes: parsed.classes ?? {},
      watchedStudents: parsed.watchedStudents ?? [],
    };
  } catch {
    return defaultSettings;
  }
}

export function saveSettings(settings: ReminderSettings) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(KEY, JSON.stringify(settings));
}

/** Effective preferences for one class, merging the global defaults. */
export function resolveScope(settings: ReminderSettings, grade: number | string): ScopePrefs {
  return { ...settings.global, ...(settings.classes[String(grade)] ?? {}) };
}

function markSent(key: string): boolean {
  try {
    const raw = window.localStorage.getItem(SENT_KEY);
    const list: string[] = raw ? JSON.parse(raw) : [];
    if (list.includes(key)) return false;
    const today = new Date().toISOString().slice(0, 10);
    const kept = list.filter((k) => k.startsWith(today)).concat(key);
    window.localStorage.setItem(SENT_KEY, JSON.stringify(kept));
    return true;
  } catch {
    return true;
  }
}

/** Upcoming occurrences of today's schedules, sorted by start time. */
export function upcomingToday(schedules: Schedule[], now = new Date()) {
  const day = now.getDay();
  return schedules
    .filter((s) => s.dayOfWeek === day)
    .map((s) => {
      const [h, m] = s.startTime.split(":").map(Number);
      const start = new Date(now);
      start.setHours(h ?? 0, m ?? 0, 0, 0);
      return { schedule: s, start };
    })
    .filter((x) => x.start.getTime() > now.getTime() - 60 * 60 * 1000)
    .sort((a, b) => a.start.getTime() - b.start.getTime());
}

function fire(channel: ReminderChannel, title: string, body: string, tag: string) {
  if (channel !== "inapp" && typeof window !== "undefined" && "Notification" in window) {
    if (Notification.permission === "granted") {
      new Notification(title, { body, tag, icon: "/favicon.ico" });
    }
  }
  if (channel !== "browser") {
    toast.info(title, { description: body, duration: 10000 });
  }
}

export type WatchedStudent = { id: string; name: string; grade: number | null };

/**
 * Schedules reminders for today's classes using the resolved per-class settings.
 * `audience` tailors the message for teachers (absensi + jurnal) or students.
 */
export function useClassReminders(
  schedules: Schedule[],
  audience: "staff" | "student",
  roster: WatchedStudent[] = [],
) {
  const [settings, setSettings] = useState<ReminderSettings>(defaultSettings);
  const [permission, setPermission] = useState<NotificationPermission | "unsupported">("default");

  useEffect(() => {
    setSettings(loadSettings());
    setPermission(
      typeof window !== "undefined" && "Notification" in window ? Notification.permission : "unsupported",
    );
  }, []);

  const persist = useCallback((next: ReminderSettings) => {
    setSettings(next);
    saveSettings(next);
  }, []);

  const updateGlobal = useCallback(
    (patch: Partial<ScopePrefs>) =>
      setSettings((prev) => {
        const next = { ...prev, global: { ...prev.global, ...patch } };
        saveSettings(next);
        return next;
      }),
    [],
  );

  const updateClass = useCallback(
    (grade: number | string, patch: Partial<ScopePrefs>) =>
      setSettings((prev) => {
        const key = String(grade);
        const next = {
          ...prev,
          classes: { ...prev.classes, [key]: { ...(prev.classes[key] ?? {}), ...patch } },
        };
        saveSettings(next);
        return next;
      }),
    [],
  );

  const resetClass = useCallback(
    (grade: number | string) =>
      setSettings((prev) => {
        const classes = { ...prev.classes };
        delete classes[String(grade)];
        const next = { ...prev, classes };
        saveSettings(next);
        return next;
      }),
    [],
  );

  const toggleStudent = useCallback(
    (studentId: string) =>
      setSettings((prev) => {
        const has = prev.watchedStudents.includes(studentId);
        const next = {
          ...prev,
          watchedStudents: has
            ? prev.watchedStudents.filter((id) => id !== studentId)
            : [...prev.watchedStudents, studentId],
        };
        saveSettings(next);
        return next;
      }),
    [],
  );

  const enable = useCallback(async () => {
    if (typeof window === "undefined" || !("Notification" in window)) {
      setPermission("unsupported");
      updateGlobal({ enabled: true, channel: "inapp" });
      return "unsupported" as const;
    }
    const result = await Notification.requestPermission();
    setPermission(result);
    updateGlobal({ enabled: true, channel: result === "granted" ? "both" : "inapp" });
    return result;
  }, [updateGlobal]);

  const upcoming = useMemo(() => upcomingToday(schedules), [schedules]);

  useEffect(() => {
    if (!settings.global.enabled || !schedules.length) return;
    const timers: ReturnType<typeof setTimeout>[] = [];
    const now = new Date();
    const list = upcomingToday(schedules, now);
    const firedForClass = new Set<string>();

    for (const { schedule, start } of list) {
      const scope = resolveScope(settings, schedule.grade);
      if (!scope.enabled || scope.frequency === "off") continue;
      if (scope.frequency === "first") {
        if (firedForClass.has(String(schedule.grade))) continue;
        firedForClass.add(String(schedule.grade));
      }
      const delay = start.getTime() - scope.leadMinutes * 60 * 1000 - now.getTime();
      if (delay <= 0 || delay > 12 * 60 * 60 * 1000) continue;

      const key = `${now.toISOString().slice(0, 10)}:${schedule.id}:${scope.leadMinutes}`;
      const watched = roster
        .filter((s) => settings.watchedStudents.includes(s.id) && s.grade === schedule.grade)
        .map((s) => s.name);

      timers.push(
        setTimeout(() => {
          if (!markSent(key)) return;
          const title =
            audience === "staff"
              ? `Kelas ${schedule.grade} mulai ${scope.leadMinutes} menit lagi`
              : `Pelajaran mulai ${scope.leadMinutes} menit lagi`;
          const base =
            audience === "staff"
              ? `${schedule.title} (${schedule.startTime}). Jangan lupa isi absensi dan jurnal harian.`
              : `${schedule.title} pukul ${schedule.startTime}${schedule.room ? ` di ${schedule.room}` : ""}.`;
          const body = watched.length ? `${base} Pantau: ${watched.join(", ")}.` : base;
          fire(scope.channel, title, body, key);
        }, delay),
      );
    }
    return () => timers.forEach(clearTimeout);
  }, [settings, permission, schedules, audience, roster]);

  return {
    settings,
    persist,
    updateGlobal,
    updateClass,
    resetClass,
    toggleStudent,
    permission,
    enable,
    upcoming,
    resolve: (grade: number | string) => resolveScope(settings, grade),
  };
}
