import { createClient } from "@libsql/client";
import * as fs from "node:fs";
import * as path from "node:path";

const envPath = path.resolve(process.cwd(), ".env");
if (fs.existsSync(envPath)) {
  const content = fs.readFileSync(envPath, "utf-8");
  for (const line of content.split("\n")) {
    const trimmed = line.trim();
    if (trimmed && !trimmed.startsWith("#") && trimmed.includes("=")) {
      const idx = trimmed.indexOf("=");
      const key = trimmed.slice(0, idx).trim();
      let val = trimmed.slice(idx + 1).trim();
      if (val.startsWith('"') && val.endsWith('"')) val = val.slice(1, -1);
      process.env[key] = val;
    }
  }
}

const client = createClient({
  url: process.env.TURSO_DATABASE_URL!,
  authToken: process.env.TURSO_AUTH_TOKEN!,
});

const defaultMaterials = [
  {
    slug: "klasifikasi-makhluk-hidup",
    title: "Klasifikasi Makhluk Hidup",
    subject: "IPA",
    grade: 7,
    duration: "5 jam",
    modules: ["Pengertian Makhluk Hidup", "Ciri-ciri Makhluk Hidup", "Klasifikasi Kingdom Animalia", "Klasifikasi Kingdom Plantae", "Klasifikasi Kingdom Fungi", "Protista dan Monera", "Diversitas Hayati Indonesia", "Hubungan Antarmakhluk Hidup", "Ekosistem dan Habitat", "Evaluasi Pembelajaran"],
  },
  {
    slug: "bilangan-bulat-pecahan",
    title: "Bilangan Bulat & Pecahan",
    subject: "Matematika",
    grade: 7,
    duration: "6 jam",
    modules: ["Pengenalan Bilangan Bulat", "Operasi Penjumlahan", "Operasi Pengurangan", "Operasi Perkalian", "Operasi Pembagian", "Sifat-sifat Operasi", "Pengenalan Pecahan", "Pecahan Senilai", "Operasi Pecahan", "Desimal dan Persen", "Aplikasi Kehidupan Nyata", "Latihan Soal"],
  },
  {
    slug: "dasar-komputer-perangkat-keras",
    title: "Dasar Komputer & Perangkat Keras",
    subject: "Informatika",
    grade: 7,
    duration: "4 jam",
    modules: ["Komponen Utama Komputer", "Input & Output Devices", "Storage & Memory", "Motherboard & Processor", "Merawat Komputer"],
  },
  {
    slug: "pengolah-kata-efektif",
    title: "Pengolah Kata Efektif (Docs)",
    subject: "Informatika",
    grade: 7,
    duration: "4 jam",
    modules: ["Format Teks & Paragraf", "Tabel & Grafik", "Daftar Isi Otomatis", "Kolaborasi Dokumen"],
  },
  {
    slug: "internet-sehat-dan-aman",
    title: "Internet Sehat & Aman",
    subject: "Informatika",
    grade: 7,
    duration: "3 jam",
    modules: ["Etika Berinternet", "Keamanan Akun & Password", "Mengenali Hoax", "Privasi Data"],
  },
  {
    slug: "sistem-pencernaan-manusia",
    title: "Sistem Pencernaan Manusia",
    subject: "IPA",
    grade: 8,
    duration: "5 jam",
    modules: ["Nutrisi Makanan", "Organ Pencernaan", "Enzim Pencernaan", "Gangguan Pencernaan", "Pola Makan Sehat"],
  },
  {
    slug: "teks-eksplorasi-dan-laporan",
    title: "Teks Eksplorasi & Laporan",
    subject: "Bahasa Indonesia",
    grade: 8,
    duration: "4 jam",
    modules: ["Struktur Teks Laporan", "Ciri Kebahasaan", "Teknik Observasi", "Menulis Laporan Hasil Observasi"],
  },
  {
    slug: "pengolah-angka-dan-formula",
    title: "Pengolah Angka & Formula (Spreadsheet)",
    subject: "Informatika",
    grade: 8,
    duration: "6 jam",
    modules: ["Formula Dasar SUM, AVERAGE", "Fungsi Logika IF", "VLOOKUP & HLOOKUP", "Visualisasi Data dengan Chart"],
  },
  {
    slug: "presentasi-visual-menarik",
    title: "Presentasi Visual Menarik (Slides)",
    subject: "Informatika",
    grade: 8,
    duration: "4 jam",
    modules: ["Prinsip Desain Slide", "Animasi & Transisi Efektif", "Penyampaian Presentasi yang Memikat"],
  },
  {
    slug: "dasar-algoritma-pemrograman",
    title: "Dasar Algoritma & Pemrograman",
    subject: "Informatika",
    grade: 8,
    duration: "6 jam",
    modules: ["Logika Berpikir Komputasional", "Flowchart & Pseudocode", "Variabel & Tipe Data", "Percabangan & Perulangan"],
  },
  {
    slug: "persamaan-kuadrat-fungsi",
    title: "Persamaan Kuadrat & Fungsi",
    subject: "Matematika",
    grade: 9,
    duration: "6 jam",
    modules: ["Bentuk Umum Persamaan Kuadrat", "Metode Pemfaktoran", "Rumus Kuadratik ABC", "Grafik Fungsi Kuadrat"],
  },
  {
    slug: "interaksi-antarruang-benua",
    title: "Interaksi Antarruang & Benua",
    subject: "IPS",
    grade: 9,
    duration: "5 jam",
    modules: ["Karakteristik Benua di Dunia", "Pengaruh Perubahan Ruang", "Globalisasi & Kerjasama Internasional"],
  },
  {
    slug: "dasar-coding-web-pemula",
    title: "Dasar Coding Web Pemula (HTML & CSS)",
    subject: "Informatika",
    grade: 9,
    duration: "8 jam",
    modules: ["Struktur HTML5", "Styling Modern CSS3", "Layout Flexbox & Grid", "Membuat Landing Page Responsif"],
  },
  {
    slug: "desain-grafis-dan-ui-ux",
    title: "Desain Grafis & UI/UX Dasar",
    subject: "Informatika",
    grade: 9,
    duration: "6 jam",
    modules: ["Prinsip Warna & Tipografi", "Wireframing & Prototyping", "Desain Antarmuka Aplikasi"],
  },
  {
    slug: "multimedia-dan-editing-video",
    title: "Multimedia & Editing Video Kreatif",
    subject: "Informatika",
    grade: 9,
    duration: "6 jam",
    modules: ["Dasar Storyboarding", "Teknik Cutting & Transition", "Audio Mixing & Color Grading", "Export & Publikasi Konten"],
  }
];

async function seed() {
  console.log("🚀 Menjalankan migrasi tabel lengkap & seeding data ke Turso...");

  // 1. Create Extra tables
  await client.batch([
    `CREATE TABLE IF NOT EXISTS profiles (
      id TEXT PRIMARY KEY,
      email TEXT UNIQUE,
      full_name TEXT,
      role TEXT DEFAULT 'student',
      grade INTEGER,
      avatar_url TEXT,
      bio TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );`,
    `CREATE TABLE IF NOT EXISTS announcements (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      body TEXT NOT NULL,
      created_by TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );`,
    `CREATE TABLE IF NOT EXISTS academic_terms (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      semester INTEGER NOT NULL,
      year TEXT NOT NULL,
      is_active INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );`,
    `CREATE TABLE IF NOT EXISTS class_schedules (
      id TEXT PRIMARY KEY,
      material_slug TEXT NOT NULL,
      grade INTEGER NOT NULL,
      day_of_week INTEGER NOT NULL,
      start_time TEXT NOT NULL,
      end_time TEXT NOT NULL,
      room TEXT,
      teacher_name TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );`,
    `CREATE TABLE IF NOT EXISTS attendance_records (
      id TEXT PRIMARY KEY,
      schedule_id TEXT NOT NULL,
      user_id TEXT NOT NULL,
      date TEXT NOT NULL,
      status TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );`,
    `CREATE TABLE IF NOT EXISTS teaching_journals (
      id TEXT PRIMARY KEY,
      teacher_id TEXT NOT NULL,
      material_slug TEXT NOT NULL,
      grade INTEGER NOT NULL,
      date TEXT NOT NULL,
      topic TEXT NOT NULL,
      notes TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );`,
    `CREATE TABLE IF NOT EXISTS assessment_rubrics (
      id TEXT PRIMARY KEY,
      material_slug TEXT NOT NULL,
      title TEXT NOT NULL,
      criteria TEXT NOT NULL,
      max_score INTEGER DEFAULT 100,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );`
  ], "write");

  // 2. Insert Catalog Materials
  for (const m of defaultMaterials) {
    await client.execute({
      sql: `INSERT INTO materials (id, slug, title, subject, grade, duration, module_list, is_published, is_custom)
            VALUES (?, ?, ?, ?, ?, ?, ?, 1, 0)
            ON CONFLICT(slug) DO UPDATE SET
              title=excluded.title,
              subject=excluded.subject,
              grade=excluded.grade,
              duration=excluded.duration,
              module_list=excluded.module_list;`,
      args: [
        `mat-${m.slug}`,
        m.slug,
        m.title,
        m.subject,
        m.grade,
        m.duration,
        JSON.stringify(m.modules)
      ]
    });
  }

  // 3. Insert Default Announcement
  await client.execute({
    sql: `INSERT OR IGNORE INTO announcements (id, title, body)
          VALUES (?, ?, ?);`,
    args: [
      "ann-welcome",
      "Selamat Datang di Continuum LMS!",
      "Platform pembelajaran interaktif berbasis kurikulum merdeka dengan pengalaman belajar modern sekelas Udemy."
    ]
  });

  const tables = await client.execute("SELECT name FROM sqlite_master WHERE type='table' ORDER BY name;");
  console.log("\n✅ Selesai! Tabel yang aktif di database Turso saat ini:");
  for (const t of tables.rows) {
    if (String(t.name).startsWith("_")) continue;
    const count = await client.execute(`SELECT COUNT(*) as total FROM "${t.name}";`);
    console.log(`  - ${t.name}: ${count.rows[0].total} baris data`);
  }
}

seed();
