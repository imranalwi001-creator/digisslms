import m7digitalKomputer from "@/assets/materi-7-digital-komputer.jpg";
import m7digitalWord from "@/assets/materi-7-digital-word.jpg";
import m7digitalInternet from "@/assets/materi-7-digital-internet.jpg";
import m8digitalExcel from "@/assets/materi-8-digital-excel.jpg";
import m8digitalPpt from "@/assets/materi-8-digital-ppt.jpg";
import m8digitalAlgoritma from "@/assets/materi-8-digital-algoritma.jpg";
import m9digitalCoding from "@/assets/materi-9-digital-coding.jpg";
import m9digitalDesain from "@/assets/materi-9-digital-desain.jpg";
import m9digitalMultimedia from "@/assets/materi-9-digital-multimedia.jpg";
import course1 from "@/assets/course-1.jpg";
import course2 from "@/assets/course-2.jpg";
import course3 from "@/assets/course-3.jpg";
import course4 from "@/assets/course-4.jpg";

export type Materi = {
  slug: string;
  image: string;
  grade: 7 | 8 | 9;
  subject: string;
  title: string;
  modules: number;
  duration: string;
  moduleList: string[];
};

export const materials: Materi[] = [
  // ==========================================
  // KELAS 7 SMP - INFORMATIKA FASE D DASAR
  // ==========================================
  {
    slug: "berpikir-komputasional-dasar",
    image: course1,
    grade: 7,
    subject: "Informatika",
    title: "Berpikir Komputasional & Logika Masalah",
    modules: 6,
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
    image: m7digitalKomputer,
    grade: 7,
    subject: "Informatika",
    title: "Perangkat Keras & Sistem Operasi Komputer",
    modules: 6,
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
    image: m7digitalWord,
    grade: 7,
    subject: "Informatika",
    title: "Pengolah Kata Efektif & Kolaborasi Dokumen",
    modules: 6,
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
    image: m7digitalInternet,
    grade: 7,
    subject: "Informatika",
    title: "Jaringan Komputer & Internet Sehat",
    modules: 6,
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
    image: course2,
    grade: 7,
    subject: "Informatika",
    title: "Dasar Pemrograman Visual Blok (Scratch)",
    modules: 6,
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
  // KELAS 8 SMP - INFORMATIKA FASE D MENENGAH
  // ==========================================
  {
    slug: "analisis-data-spreadsheet-formula",
    image: m8digitalExcel,
    grade: 8,
    subject: "Informatika",
    title: "Analisis Data & Pemrosesan Spreadsheet",
    modules: 6,
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
    image: course3,
    grade: 8,
    subject: "Informatika",
    title: "Arsitektur Jaringan & Keamanan Siber",
    modules: 6,
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
    image: m8digitalAlgoritma,
    grade: 8,
    subject: "Informatika",
    title: "Algoritma & Pemrograman Berbasis Teks (Python)",
    modules: 6,
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
    image: m8digitalPpt,
    grade: 8,
    subject: "Informatika",
    title: "Presentasi Digital & Komunikasi Visual",
    modules: 5,
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
    image: course4,
    grade: 8,
    subject: "Informatika",
    title: "Dampak Sosial Informatika & Etika Digital",
    modules: 5,
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
  // KELAS 9 SMP - INFORMATIKA FASE D MAHIR
  // ==========================================
  {
    slug: "dasar-coding-web-pemula",
    image: m9digitalCoding,
    grade: 9,
    subject: "Informatika",
    title: "Pemrograman Web Interaktif (HTML, CSS & JS)",
    modules: 6,
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
    image: m9digitalDesain,
    grade: 9,
    subject: "Informatika",
    title: "Desain Antarmuka Pengguna & UI/UX Dasar",
    modules: 6,
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
    image: m9digitalMultimedia,
    grade: 9,
    subject: "Informatika",
    title: "Produksi Konten Multimedia & Editing Video",
    modules: 5,
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
    image: course1,
    grade: 9,
    subject: "Informatika",
    title: "Pengenalan Kecerdasan Buatan (AI) & Masa Depan",
    modules: 5,
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
    image: course2,
    grade: 9,
    subject: "Informatika",
    title: "Praktik Lintas Bidang (PLB) & Rekayasa Produk",
    modules: 6,
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

export function getMaterialBySlug(slug: string): Materi | undefined {
  return materials.find((m) => m.slug === slug);
}
