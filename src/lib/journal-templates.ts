/** Reusable daily-journal templates (built-in presets + teacher's own, stored locally). */

export type JournalTemplate = {
  id: string;
  name: string;
  activities: string;
  obstacles: string;
  reflection: string;
  builtin?: boolean;
};

export const builtinJournalTemplates: JournalTemplate[] = [
  {
    id: "praktik-lab",
    name: "Praktik di lab komputer",
    builtin: true,
    activities:
      "1. Pembukaan & presensi (10 menit)\n2. Apersepsi materi sebelumnya\n3. Demonstrasi guru di layar utama\n4. Praktik mandiri siswa di komputer masing-masing\n5. Penguatan & penutup",
    obstacles: "Perangkat/jaringan: \nPemahaman siswa: ",
    reflection: "Yang berhasil: \nYang perlu diperbaiki: \nRencana pertemuan berikutnya: ",
  },
  {
    id: "teori-diskusi",
    name: "Teori & diskusi kelas",
    builtin: true,
    activities:
      "1. Pembukaan & tujuan pembelajaran\n2. Penyampaian materi inti\n3. Diskusi kelompok (4-5 siswa)\n4. Presentasi hasil diskusi\n5. Kesimpulan bersama",
    obstacles: "Partisipasi siswa: \nManajemen waktu: ",
    reflection: "Pemahaman siswa: \nTindak lanjut: ",
  },
  {
    id: "proyek",
    name: "Pembelajaran berbasis proyek",
    builtin: true,
    activities:
      "1. Review progres proyek tiap kelompok\n2. Bimbingan teknis per kelompok\n3. Pengerjaan proyek\n4. Catatan progres & target berikutnya",
    obstacles: "Kendala teknis: \nKerja sama kelompok: ",
    reflection: "Progres keseluruhan: \nDukungan yang dibutuhkan: ",
  },
  {
    id: "evaluasi",
    name: "Evaluasi / ulangan",
    builtin: true,
    activities:
      "1. Penjelasan aturan evaluasi\n2. Pelaksanaan kuis/ulangan\n3. Pembahasan soal bersama\n4. Umpan balik hasil",
    obstacles: "Kesulitan soal: \nKedisiplinan: ",
    reflection: "Rata-rata capaian: \nRemedial/pengayaan: ",
  },
];

const KEY = "continuum.journal-templates.v1";

export function loadCustomTemplates(): JournalTemplate[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? (parsed as JournalTemplate[]) : [];
  } catch {
    return [];
  }
}

export function saveCustomTemplate(template: Omit<JournalTemplate, "id" | "builtin">): JournalTemplate[] {
  const list = loadCustomTemplates();
  const existing = list.find((t) => t.name.toLowerCase() === template.name.toLowerCase());
  const next = existing
    ? list.map((t) => (t.id === existing.id ? { ...t, ...template } : t))
    : [...list, { ...template, id: `custom-${Date.now()}` }];
  window.localStorage.setItem(KEY, JSON.stringify(next));
  return next;
}

export function deleteCustomTemplate(id: string): JournalTemplate[] {
  const next = loadCustomTemplates().filter((t) => t.id !== id);
  window.localStorage.setItem(KEY, JSON.stringify(next));
  return next;
}
