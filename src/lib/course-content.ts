import {
  getCourseContentsAction,
  saveCourseContentAction,
  deleteCourseContentAction,
} from "@/lib/turso.functions";

export type LMSContentType = "video" | "pdf" | "audio" | "code" | "file" | "link";

export interface LMSContentItem {
  id: string;
  materialSlug: string;
  moduleIndex: number;
  type: LMSContentType;
  title: string;
  description?: string;
  url: string;
  fileSize?: string;
  duration?: string;
  isDownloadable?: boolean;
  createdAt: string;
}

const STORAGE_KEY = "digisschool_lms_contents_v2";

const DEFAULT_CONTENTS: LMSContentItem[] = [
  {
    id: "content-pertemuan-1",
    materialSlug: "berpikir-komputasional-dasar",
    moduleIndex: 0,
    type: "video",
    title: "pertemuan pertama",
    description: "materi pertama",
    url: "https://www.youtube.com/watch?v=kM9ASKAni_s",
    duration: "18:45",
    createdAt: new Date().toISOString(),
  },
  {
    id: "content-1",
    materialSlug: "berpikir-komputasional-dasar",
    moduleIndex: 0,
    type: "video",
    title: "Video Pembelajaran: 4 Pilar Berpikir Komputasional",
    description: "Penjelasan mendalam tentang Dekomposisi, Pengenalan Pola, Abstraksi, dan Algoritma disertai contoh kehidupan sehari-hari.",
    url: "https://www.youtube.com/watch?v=kM9ASKAni_s",
    duration: "18:45",
    createdAt: new Date().toISOString(),
  },
  {
    id: "content-2",
    materialSlug: "berpikir-komputasional-dasar",
    moduleIndex: 0,
    type: "pdf",
    title: "E-Book & Handout Modul: 4 Pilar Berpikir Komputasional.pdf",
    description: "Buku panduan resmi Kurikulum Merdeka Kemendikbudristek untuk jenjang SMP Kelas 7.",
    url: "https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf",
    fileSize: "3.2 MB",
    isDownloadable: true,
    createdAt: new Date().toISOString(),
  },
  {
    id: "content-3",
    materialSlug: "berpikir-komputasional-dasar",
    moduleIndex: 0,
    type: "code",
    title: "Lab Interaktif: Algoritma Pencarian Pola",
    description: "Coba langsung logika pola algoritma di sandbox kode browser.",
    url: "#playground",
    createdAt: new Date().toISOString(),
  },
  {
    id: "content-4",
    materialSlug: "berpikir-komputasional-dasar",
    moduleIndex: 0,
    type: "audio",
    title: "Podcast Audio Guru: Penjelasan Logika Algoritma (MP3)",
    description: "Dengarkan ringkasan audio penjelasan materi saat sedang santai atau perjalanan.",
    url: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3",
    duration: "08:12",
    createdAt: new Date().toISOString(),
  },
  {
    id: "content-5",
    materialSlug: "berpikir-komputasional-dasar",
    moduleIndex: 0,
    type: "file",
    title: "Lembar_Kerja_Siswa_Latihan_Studi_Kasus.docx",
    description: "Template dokumen tugas untuk dikerjakan dan dikumpulkan ke guru pengampu.",
    url: "#",
    fileSize: "1.4 MB",
    isDownloadable: true,
    createdAt: new Date().toISOString(),
  },
];

export function getStoredContents(materialSlug?: string, moduleIndex?: number): LMSContentItem[] {
  if (typeof window === "undefined") return DEFAULT_CONTENTS;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    let all: LMSContentItem[] = raw ? JSON.parse(raw) : DEFAULT_CONTENTS;
    if (!raw) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(DEFAULT_CONTENTS));
    }
    if (materialSlug) {
      all = all.filter((c) => c.materialSlug === materialSlug);
    }
    if (typeof moduleIndex === "number") {
      all = all.filter((c) => c.moduleIndex === moduleIndex || c.moduleIndex === -1);
    }
    return all;
  } catch {
    return DEFAULT_CONTENTS;
  }
}

/**
 * Syncs and fetches all contents from Turso Cloud DB to ensure cross-device consistency across Mobile & Desktop.
 */
export async function syncCloudContents(materialSlug?: string, moduleIndex?: number): Promise<LMSContentItem[]> {
  try {
    const res = await getCourseContentsAction({ data: { materialSlug, moduleIndex } });
    const local = getStoredContents();
    const cloudItems: LMSContentItem[] = res?.success && res.contents && res.contents.length > 0 ? res.contents : [];

    // Auto-migrate any local desktop items to Cloud DB if not present in Cloud DB
    const cloudIds = new Set(cloudItems.map((c) => c.id));
    for (const locItem of local) {
      if (!cloudIds.has(locItem.id)) {
        saveCourseContentAction({ data: locItem }).catch(() => {});
        cloudItems.push(locItem);
        cloudIds.add(locItem.id);
      }
    }

    if (typeof window !== "undefined") {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(cloudItems));
      window.dispatchEvent(new CustomEvent("digisschool:content_updated"));
    }
    return getStoredContents(materialSlug, moduleIndex);
  } catch (err) {
    console.warn("[CloudSync] Turso cloud sync error, fallback to local:", err);
  }
  return getStoredContents(materialSlug, moduleIndex);
}

export function addContentItem(item: Omit<LMSContentItem, "id" | "createdAt">): LMSContentItem {
  const current = getStoredContents();
  const newItem: LMSContentItem = {
    id: `content-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    createdAt: new Date().toISOString(),
    ...item,
  };
  const updated = [newItem, ...current];
  if (typeof window !== "undefined") {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    window.dispatchEvent(new CustomEvent("digisschool:content_updated"));
  }

  // Persist to Turso Cloud Database immediately
  saveCourseContentAction({ data: newItem }).catch((err) => {
    console.error("[CloudSync] Failed to save content item to cloud:", err);
  });

  return newItem;
}

export function deleteContentItem(id: string) {
  const current = getStoredContents();
  const updated = current.filter((c) => c.id !== id);
  if (typeof window !== "undefined") {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    window.dispatchEvent(new CustomEvent("digisschool:content_updated"));
  }

  // Delete from Turso Cloud Database immediately
  deleteCourseContentAction({ data: { id } }).catch((err) => {
    console.error("[CloudSync] Failed to delete content item from cloud:", err);
  });
}
