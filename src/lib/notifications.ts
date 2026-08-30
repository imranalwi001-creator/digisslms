export type NotificationCategory = "all" | "academic" | "social" | "system";

export interface LMSNotification {
  id: string;
  category: "academic" | "social" | "system";
  type:
    | "material_enrolled"
    | "module_completed"
    | "note_saved"
    | "qa_posted"
    | "qa_replied"
    | "quiz_submitted"
    | "assignment_submitted"
    | "assignment_created"
    | "certificate_issued"
    | "rapor_ready"
    | "attendance_logged"
    | "system_sync";
  title: string;
  message: string;
  timestamp: string;
  read: boolean;
  link?: string;
}

const STORAGE_KEY = "digisschool_notifications_v1";

const DEFAULT_NOTIFICATIONS: LMSNotification[] = [
  {
    id: "notif-1",
    category: "academic",
    type: "assignment_created",
    title: "Tugas Baru: Laporan Makalah Digital",
    message: "Guru Informatika menerbitkan tugas baru untuk materi Pengolah Kata. Batas pengumpulan: 3 hari lagi.",
    timestamp: "10 menit yang lalu",
    read: false,
    link: "/dashboard",
  },
  {
    id: "notif-2",
    category: "social",
    type: "qa_replied",
    title: "Tanggapan Guru pada Forum Q&A",
    message: "Ustadz Imran Alwi membalas pertanyaan Anda di materi 'Algoritma & Pemrograman Python'.",
    timestamp: "45 menit yang lalu",
    read: false,
    link: "/materi/dasar-algoritma-pemrograman",
  },
  {
    id: "notif-3",
    category: "academic",
    type: "quiz_submitted",
    title: "Nilai Kuis: 95/100 (Lulus KKM)",
    message: "Kuis 'Berpikir Komputasional & Logika Masalah' berhasil diserahkan dengan nilai sempurna!",
    timestamp: "Kemarin",
    read: false,
    link: "/dashboard",
  },
  {
    id: "notif-4",
    category: "academic",
    type: "certificate_issued",
    title: "Sertifikat Kelulusan Terbit 🏆",
    message: "Selamat! Sertifikat resmi digital Anda untuk kelas 'Dasar Pemrograman Visual Scratch' telah terverifikasi.",
    timestamp: "2 hari yang lalu",
    read: true,
    link: "/dashboard",
  },
  {
    id: "notif-5",
    category: "system",
    type: "system_sync",
    title: "Sinkronisasi Cloud Turso Aktif",
    message: "Data progres, catatan, dan rekap nilai berhasil disinkronkan dengan database cloud.",
    timestamp: "3 hari yang lalu",
    read: true,
  },
];

export function getStoredNotifications(): LMSNotification[] {
  if (typeof window === "undefined") return DEFAULT_NOTIFICATIONS;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(DEFAULT_NOTIFICATIONS));
      return DEFAULT_NOTIFICATIONS;
    }
    return JSON.parse(raw);
  } catch {
    return DEFAULT_NOTIFICATIONS;
  }
}

export function saveNotifications(items: LMSNotification[]) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
    window.dispatchEvent(new CustomEvent("digisschool:notif_updated"));
  } catch (err) {
    console.error("Failed to save notifications:", err);
  }
}

/** Dispatches a new notification globally in the LMS */
export function pushNotification(notif: Omit<LMSNotification, "id" | "timestamp" | "read">) {
  const current = getStoredNotifications();
  const newItem: LMSNotification = {
    id: `notif-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    timestamp: "Baru saja",
    read: false,
    ...notif,
  };
  const updated = [newItem, ...current];
  saveNotifications(updated);
}

export function isNotificationSupported(): boolean {
  return typeof window !== "undefined" && "Notification" in window;
}

export function getNotificationPermission(): NotificationPermission | "unsupported" {
  if (!isNotificationSupported()) return "unsupported";
  return Notification.permission;
}

export async function requestNotificationPermission(): Promise<NotificationPermission | "unsupported"> {
  if (!isNotificationSupported()) return "unsupported";
  try {
    return await Notification.requestPermission();
  } catch {
    return "denied";
  }
}

export function rescheduleAllReminders(habits?: any[]): void {
  // Gracefully handle scheduled reminders in browser
}
