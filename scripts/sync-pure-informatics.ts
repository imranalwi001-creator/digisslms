import { createClient } from "@libsql/client";
import * as fs from "node:fs";
import * as path from "node:path";

// Load .env
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

const INFORMATIKA_MATERIALS = [
  // ==========================================
  // KELAS 7 SMP
  // ==========================================
  {
    slug: "berpikir-komputasional-dasar",
    grade: 7,
    subject: "Informatika",
    title: "Berpikir Komputasional & Logika Masalah",
    duration: "4,5 jam",
    moduleList: [
      "4 Pilar Berpikir Komputasional (Dekomposisi, Pola, Abstraksi, Algoritma)",
      "Pola dan Abstraksi dalam Pemecahan Masalah",
      "Representasi Data Biner & Bilangan Digital",
      "Struktur Data Sederhana: Antrean (Queue) & Tumpukan (Stack)",
      "Logika Pengambilan Keputusan Sehari-hari",
      "Evaluasi & Latihan Logika Bebras Task",
    ],
  },
  {
    slug: "perangkat-keras-dan-sistem-komputer",
    grade: 7,
    subject: "Informatika",
    title: "Perangkat Keras & Sistem Operasi Komputer",
    duration: "5 jam",
    moduleList: [
      "Komponen Utama Komputer (CPU, RAM, Storage)",
      "Perangkat Input, Output, dan Pemroses",
      "Peran dan Cara Kerja Sistem Operasi (OS)",
      "Interaksi Pengguna dengan Komputer (GUI vs CLI)",
      "Penyimpanan File dan Manajemen Direktori",
      "Perawatan & Troubleshooting Dasar Komputer",
    ],
  },
  {
    slug: "aplikasi-perkantoran-pengolah-kata",
    grade: 7,
    subject: "Informatika",
    title: "Pengolah Kata Efektif & Kolaborasi Dokumen",
    duration: "5 jam",
    moduleList: [
      "Antarmuka & Navigasi Pengolah Kata Modern",
      "Format Teks, Penataan Paragraf & Hierarki Dokumen",
      "Penyisipan Gambar, Tabel & Bagan SmartArt",
      "Pembuatan Daftar Isi & Nomor Halaman Otomatis",
      "Kolaborasi Dokumen Daring di Cloud (Google Docs)",
      "Proyek Akhir: Pembuatan Laporan Makalah Digital",
    ],
  },
  {
    slug: "jaringan-komputer-dan-internet-sehat",
    grade: 7,
    subject: "Informatika",
    title: "Jaringan Komputer & Internet Sehat",
    duration: "4,5 jam",
    moduleList: [
      "Konsep Dasar Jaringan Komputer (LAN, MAN, WAN)",
      "Konektivitas Internet (Wi-Fi, Data Seluler, Fiber)",
      "Cara Kerja Web Browser & Teknik Search Engine Cermat",
      "Etika Berkomunikasi Digital (Netiket)",
      "Keamanan Akun, Password Kuat & Deteksi Phishing",
      "Mengenali Fakta vs Hoax di Media Digital",
    ],
  },
  {
    slug: "pemrograman-visual-scratch",
    grade: 7,
    subject: "Informatika",
    title: "Dasar Pemrograman Visual Blok (Scratch)",
    duration: "6 jam",
    moduleList: [
      "Pengenalan Lingkungan Kerja Scratch & Sprite",
      "Blok Pergerakan (Motion) & Tampilan (Looks)",
      "Penggunaan Variabel & Operasi Hitung",
      "Struktur Kontrol Perulangan (Looping)",
      "Struktur Kontrol Kondisional (If - Else)",
      "Proyek Akhir: Pembuatan Game Animasi Interaktif",
    ],
  },

  // ==========================================
  // KELAS 8 SMP
  // ==========================================
  {
    slug: "analisis-data-spreadsheet-formula",
    grade: 8,
    subject: "Informatika",
    title: "Analisis Data & Pemrosesan Spreadsheet",
    duration: "6 jam",
    moduleList: [
      "Struktur Workbook & Tipe Data Spreadsheet",
      "Formula Matematika & Statistik Dasar (SUM, AVERAGE, MAX, MIN)",
      "Fungsi Logika Percabangan IF & Kondisi Majemuk",
      "Pencarian Data Referensi (VLOOKUP & HLOOKUP)",
      "Pengurutan (Sort) & Penyaringan (Filter) Data Lanjutan",
      "Visualisasi Data Menggunakan Diagram & Chart Interaktif",
    ],
  },
  {
    slug: "keamanan-jaringan-dan-enkripsi",
    grade: 8,
    subject: "Informatika",
    title: "Arsitektur Jaringan & Keamanan Siber",
    duration: "5 jam",
    moduleList: [
      "Model Jaringan Client-Server vs Peer-to-Peer",
      "Topologi Jaringan Komputer & Perangkat Penghubung",
      "Pengalamatan IP Address & Konsep DNS",
      "Dasar Kriptografi & Enkripsi Data Sederhana",
      "Ancaman Malware, Ransomware & Proteksi Firewall",
      "Keamanan Transaksi & Otentikasi Dua Faktor (2FA)",
    ],
  },
  {
    slug: "dasar-algoritma-pemrograman",
    grade: 8,
    subject: "Informatika",
    title: "Algoritma & Pemrograman Berbasis Teks (Python)",
    duration: "6 jam",
    moduleList: [
      "Logika Berpikir Algoritmik & Pseudocode",
      "Instalasi & Pengenalan Sintaks Bahasa Python",
      "Variabel, Tipe Data & Input/Output Konsol",
      "Operator Aritmatika, Perbandingan & Logika",
      "Struktur Percabangan (if, elif, else)",
      "Struktur Perulangan (for & while loop) & Proyek Mini",
    ],
  },
  {
    slug: "presentasi-digital-multimedia",
    grade: 8,
    subject: "Informatika",
    title: "Presentasi Digital & Komunikasi Visual",
    duration: "4,5 jam",
    moduleList: [
      "Prinsip Desain Slide Efektif & Hierarki Visual",
      "Pemilihan Tipografi & Harmoni Warna Presentasi",
      "Penerapan Animasi & Transisi Dinamis yang Profesional",
      "Penyisipan Video, Audio & Elemen Interaktif",
      "Teknik Public Speaking Berbantuan Media Presentasi",
    ],
  },
  {
    slug: "dampak-sosial-dan-etika-digital",
    grade: 8,
    subject: "Informatika",
    title: "Dampak Sosial Informatika & Etika Digital",
    duration: "4 jam",
    moduleList: [
      "Transformasi Digital & Perubahan Pola Hidup Masyarakat",
      "Jejak Digital (Digital Footprint) & Manajemen Reputasi",
      "Hak Cipta, Lisensi Perangkat Lunak & Creative Commons",
      "Mencegah Plagiarisme & Menghargai Karya Intelektual",
      "Kesehatan Fisik dan Mental di Era Layar Digital",
    ],
  },

  // ==========================================
  // KELAS 9 SMP
  // ==========================================
  {
    slug: "dasar-coding-web-pemula",
    grade: 9,
    subject: "Informatika",
    title: "Pemrograman Web Interaktif (HTML, CSS & JS)",
    duration: "7 jam",
    moduleList: [
      "Struktur Dasar & Tag Semantik HTML5",
      "Styling Modern & Desain Estetik dengan CSS3",
      "Tata Letak Responsif Menggunakan Flexbox & Grid",
      "Dasar Interaktivitas Halaman Web dengan JavaScript",
      "Pengolahan Form Input & Event Listener",
      "Proyek Akhir: Membangun Web Portofolio Pribadi",
    ],
  },
  {
    slug: "desain-grafis-dan-ui-ux",
    grade: 9,
    subject: "Informatika",
    title: "Desain Antarmuka Pengguna & UI/UX Dasar",
    duration: "6 jam",
    moduleList: [
      "Prinsip Dasar User Interface (UI) & User Experience (UX)",
      "Tahapan Perancangan: Wireframing & Moodboarding",
      "Desain Komponen Antarmuka Aplikasi di Figma",
      "Pembuatan Prototipe Interaktif (Clickable Prototype)",
      "Pengujian Keterpakaian Aplikasi (Usability Testing)",
      "Proyek Desain Aplikasi Solusi Masalah Sekolah",
    ],
  },
  {
    slug: "multimedia-dan-editing-video",
    grade: 9,
    subject: "Informatika",
    title: "Produksi Konten Multimedia & Editing Video",
    duration: "5,5 jam",
    moduleList: [
      "Dasar Storyboard & Perencanaan Video Edukasi",
      "Teknik Perekaman Gambar & Audio Berkualitas",
      "Proses Editing: Cutting, Transitions & Text Overlay",
      "Pengaturan Audio, Backsound & Color Grading",
      "Exporting, Kompresi Video & Etika Publikasi Konten",
    ],
  },
  {
    slug: "pengenalan-kecerdasan-buatan-ai",
    grade: 9,
    subject: "Informatika",
    title: "Pengenalan Kecerdasan Buatan (AI) & Masa Depan",
    duration: "5 jam",
    moduleList: [
      "Konsep Dasar AI, Machine Learning & Deep Learning",
      "Cara Kerja Generative AI & Large Language Model (LLM)",
      "Prompt Engineering Efektif untuk Pembelajaran",
      "Etika, Hak Cipta & Tantangan Penggunaan AI",
      "Peluang Karier & Masa Depan Dunia Teknologi Digital",
    ],
  },
  {
    slug: "praktik-lintas-bidang-proyek-terpadu",
    grade: 9,
    subject: "Informatika",
    title: "Praktik Lintas Bidang (PLB) & Rekayasa Produk",
    duration: "8 jam",
    moduleList: [
      "Identifikasi Masalah Nyata di Lingkungan Sekitar",
      "Perumusan Ide Solusi Digital & Pembagian Peran Tim",
      "Manajemen Proyek Kolaboratif (Agile & Kanban Dasar)",
      "Pengembangan Prototipe Solusi Produk Digital",
      "Dokumentasi Proyek, Uji Coba & Perbaikan Bug",
      "Presentasi Demo Produk (Pitching) di Depan Kelas",
    ],
  },
];

async function syncInformaticsMaterials() {
  console.log("🧹 Membersihkan materi non-Informatika dari Turso...");

  // Clear existing materials and populate pure Informatics materials
  await client.execute("DELETE FROM materials;");

  console.log(`🚀 Menyimpan ${INFORMATIKA_MATERIALS.length} materi Informatika SMP resmi ke Turso...`);

  for (const m of INFORMATIKA_MATERIALS) {
    await client.execute({
      sql: `INSERT INTO materials (id, slug, title, subject, grade, duration, module_list, is_published, is_custom)
            VALUES (?, ?, ?, ?, ?, ?, ?, 1, 0);`,
      args: [
        `mat-${m.slug}`,
        m.slug,
        m.title,
        m.subject,
        m.grade,
        m.duration,
        JSON.stringify(m.moduleList),
      ],
    });
  }

  const result = await client.execute("SELECT grade, title, subject, duration FROM materials ORDER BY grade ASC, title ASC;");
  console.log(`\n✅ Berhasil menyelaraskan database Turso! Total materi Informatika SMP aktif: ${result.rows.length}\n`);

  const grouped: Record<number, any[]> = { 7: [], 8: [], 9: [] };
  result.rows.forEach(r => {
    grouped[Number(r.grade)].push(r);
  });

  for (const [grade, list] of Object.entries(grouped)) {
    console.log(`=== KELAS ${grade} SMP (${list.length} Materi) ===`);
    list.forEach((item, i) => {
      console.log(`  ${i + 1}. [${item.subject}] ${item.title} (${item.duration})`);
    });
  }
}

syncInformaticsMaterials().catch(console.error);
