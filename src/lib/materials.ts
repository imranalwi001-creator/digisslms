import m7digitalKomputer from "@/assets/materi-7-digital-komputer.jpg";
import m7digitalWord from "@/assets/materi-7-digital-word.jpg";
import m7digitalInternet from "@/assets/materi-7-digital-internet.jpg";
import m7ipa from "@/assets/materi-7-ipa.jpg";
import m7mtk from "@/assets/materi-7-mtk.jpg";

import m8digitalExcel from "@/assets/materi-8-digital-excel.jpg";
import m8digitalPpt from "@/assets/materi-8-digital-ppt.jpg";
import m8digitalAlgoritma from "@/assets/materi-8-digital-algoritma.jpg";
import m8ipa from "@/assets/materi-8-ipa.jpg";
import m8bindo from "@/assets/materi-8-bindo.jpg";

import m9digitalCoding from "@/assets/materi-9-digital-coding.jpg";
import m9digitalDesain from "@/assets/materi-9-digital-desain.jpg";
import m9digitalMultimedia from "@/assets/materi-9-digital-multimedia.jpg";
import m9mtk from "@/assets/materi-9-mtk.jpg";
import m9ips from "@/assets/materi-9-ips.jpg";

import course1 from "@/assets/course-1.jpg";
import course2 from "@/assets/course-2.jpg";
import course3 from "@/assets/course-3.jpg";
import course4 from "@/assets/course-4.jpg";

export type Materi = {
  slug: string;
  image: string;
  grade: 7 | 8 | 9;
  semester: 1 | 2;
  element?: string | null;
  subject: string;
  title: string;
  description?: string;
  modules: number;
  duration: string;
  moduleList: string[];
};

export const materials: Materi[] = [
  // =========================================================================
  // KELAS 7 SMP - INFORMATIKA FASE D (DASAR)
  // =========================================================================

  // --- KELAS 7 SEMESTER 1 (GANJIL) ---
  {
    slug: "berpikir-komputasional-dasar",
    image: course1,
    grade: 7,
    semester: 1,
    element: "Berpikir Komputasional (BK)",
    subject: "Informatika",
    title: "Berpikir Komputasional & Logika Masalah",
    description: "Fondasi logika komputasi melalui 4 pilar dekomposisi, pengenalan pola, abstraksi, dan perancangan algoritma pemecahan masalah.",
    modules: 6,
    duration: "4,5 jam",
    moduleList: [
      "4 Pilar Berpikir Komputasional (Dekomposisi, Pola, Abstraksi, Algoritma)",
      "Pola dan Abstraksi dalam Pemecahan Masalah Kehidupan Nyata",
      "Representasi Data Biner, Oktal & Bilangan Digital",
      "Struktur Data Sederhana: Antrean (Queue) & Tumpukan (Stack)",
      "Logika Pengambilan Keputusan Sehari-hari",
      "Evaluasi & Latihan Logika Bebras Task Internasional",
    ],
  },
  {
    slug: "perangkat-keras-dan-sistem-komputer",
    image: m7digitalKomputer,
    grade: 7,
    semester: 1,
    element: "Sistem Komputer (SK)",
    subject: "Informatika",
    title: "Perangkat Keras & Sistem Operasi Komputer",
    description: "Memahami arsitektur hardware, mekanisme pemrosesan CPU/RAM, dan peran sistem operasi dalam mengelola sumber daya digital.",
    modules: 6,
    duration: "5 jam",
    moduleList: [
      "Komponen Utama Komputer (CPU, Motherboard, RAM, Storage)",
      "Perangkat Input, Output, dan Pemroses Tambahan",
      "Peran dan Cara Kerja Sistem Operasi (Windows, Linux, macOS)",
      "Interaksi Pengguna dengan Komputer (GUI vs CLI)",
      "Penyimpanan File dan Manajemen Struktur Direktori",
      "Perawatan & Troubleshooting Kerusakan Dasar Komputer",
    ],
  },
  {
    slug: "aplikasi-perkantoran-pengolah-kata",
    image: m7digitalWord,
    grade: 7,
    semester: 1,
    element: "Teknologi Informasi & Komunikasi (TIK)",
    subject: "Informatika",
    title: "Pengolah Kata Efektif & Kolaborasi Dokumen",
    description: "Keterampilan mengolah dokumen formal, otomatisasi daftar isi, pembuatan laporan terstruktur, dan kolaborasi cloud.",
    modules: 6,
    duration: "5 jam",
    moduleList: [
      "Antarmuka & Navigasi Pengolah Kata Modern",
      "Format Teks, Penataan Paragraf & Hierarki Heading Dokumen",
      "Penyisipan Gambar, Tabel & Diagram SmartArt Dinamis",
      "Pembuatan Daftar Isi & Penomoran Halaman Otomatis",
      "Kolaborasi Dokumen Daring Realtime (Google Docs & OneDrive)",
      "Proyek Akhir: Pembuatan Laporan Makalah Digital Berstandar",
    ],
  },
  {
    slug: "jaringan-komputer-dan-internet-sehat",
    image: m7digitalInternet,
    grade: 7,
    semester: 1,
    element: "Jaringan Komputer & Internet (JKI)",
    subject: "Informatika",
    title: "Jaringan Komputer & Internet Sehat",
    description: "Dasar konektivitas LAN/Wi-Fi, cara kerja internet, serta etika digital (netiket) dan proteksi akun santri.",
    modules: 6,
    duration: "4,5 jam",
    moduleList: [
      "Konsep Dasar Jaringan Komputer (LAN, MAN, WAN)",
      "Konektivitas Internet (Wi-Fi, Data Seluler, Fiber Optik)",
      "Cara Kerja Web Browser & Teknik Search Engine Cermat",
      "Etika Berkomunikasi Digital Islami (Netiket & Adab)",
      "Keamanan Akun, Password Kuat & Deteksi Serangan Phishing",
      "Mengenali Fakta vs Hoax di Media Digital & Cek Sumber",
    ],
  },

  // --- KELAS 7 SEMESTER 2 (GENAP) ---
  {
    slug: "analisis-data-dasar-kelas-7",
    image: m7mtk,
    grade: 7,
    semester: 2,
    element: "Analisis Data (AD)",
    subject: "Informatika",
    title: "Analisis Data & Representasi Informasi Digital",
    description: "Mengumpulkan data, mengorganisasi tabel, pembersihan data sederhana, dan merepresentasikan informasi dalam bentuk visual informatif.",
    modules: 6,
    duration: "5 jam",
    moduleList: [
      "Pengenalan Data, Informasi, dan Sumber Data Terpercaya",
      "Pengumpulan Data Digital melalui Formulir Daring (Google Form)",
      "Organisasi Tabel & Tipe Data (Teks, Angka, Tanggal, Logika)",
      "Pembersihan Data (Data Cleaning) & Validasi Entri Sederhana",
      "Kalkulasi Nilai Rata-rata, Modus, dan Median Otomatis",
      "Visualisasi Grafik Kolom & Lingkaran untuk Presentasi Data",
    ],
  },
  {
    slug: "pemrograman-visual-scratch",
    image: course2,
    grade: 7,
    semester: 2,
    element: "Algoritma & Pemrograman (AP)",
    subject: "Informatika",
    title: "Dasar Pemrograman Visual Blok (Scratch)",
    description: "Membangun logika berpikir komputasi melalui pemrograman berbasis blok visual, animasi karakter, dan game edukatif interaktif.",
    modules: 6,
    duration: "6 jam",
    moduleList: [
      "Pengenalan Lingkungan Kerja Scratch, Panggung & Sprite",
      "Blok Pergerakan (Motion), Suara (Sound) & Tampilan (Looks)",
      "Penggunaan Variabel Skor, Waktu & Operasi Hitung",
      "Struktur Kontrol Perulangan (Repeat, Forever)",
      "Struktur Kontrol Kondisional (If - Then - Else & Sensing)",
      "Proyek Akhir: Pembuatan Game Animasi Kuis Islami Interaktif",
    ],
  },
  {
    slug: "dampak-sosial-informatika-kelas-7",
    image: m7ipa,
    grade: 7,
    semester: 2,
    element: "Dampak Sosial Informatika (DSI)",
    subject: "Informatika",
    title: "Dampak Sosial Informatika & Jejak Digital",
    description: "Menganalisis pengaruh teknologi terhadap pola hidup santri, perlindungan privasi data pribadi, dan jejak digital masa depan.",
    modules: 5,
    duration: "4 jam",
    moduleList: [
      "Perkembangan Teknologi Digital & Perubahan Kebiasaan Belajar",
      "Konsep Jejak Digital (Digital Footprint) Aktif dan Pasif",
      "Perlindungan Data Pribadi (Nama, Alamat, Identitas Keluarga)",
      "Bahaya Cyberbullying & Cara Penanganan yang Tepat",
      "Manajemen Waktu Layar (Screen Time) & Kesehatan Mental Santri",
    ],
  },
  {
    slug: "praktik-lintas-bidang-kelas-7",
    image: course4,
    grade: 7,
    semester: 2,
    element: "Praktik Lintas Bidang (PLB)",
    subject: "Informatika",
    title: "Praktik Lintas Bidang: Media Edukasi Digital",
    description: "Proyek kolaboratif mengintegrasikan materi pengolah kata, grafis, dan logika komputasi untuk menghasilkan karya edukatif sekolah.",
    modules: 5,
    duration: "6 jam",
    moduleList: [
      "Penetapan Tema Proyek Kolaborasi Edukasi Sekolah/Pesantren",
      "Penyusunan Perencanaan, Pembagian Tugas & Timeline Kerja",
      "Pengumpulan Data Riset & Pembuatan Materi Interaktif",
      "Pengujian Produk Media Digital Bersama Teman Sekelas",
      "Pameran Karya Mini & Evaluasi Refleksi Pembelajaran",
    ],
  },

  // =========================================================================
  // KELAS 8 SMP - INFORMATIKA FASE D (MENENGAH)
  // =========================================================================

  // --- KELAS 8 SEMESTER 1 (GANJIL) ---
  {
    slug: "berpikir-komputasional-lanjutan-kelas-8",
    image: course3,
    grade: 8,
    semester: 1,
    element: "Berpikir Komputasional (BK)",
    subject: "Informatika",
    title: "Berpikir Komputasional: Struktur Data & Optimasi",
    description: "Eksplorasi struktur data abstrak graf dan pohon (tree), algoritma pencarian (searching), pengurutan (sorting), dan optimasi rute.",
    modules: 6,
    duration: "5,5 jam",
    moduleList: [
      "Struktur Data Pohon (Tree) & Hierarki Klasifikasi Informasi",
      "Struktur Data Graf (Graph) & Pemodelan Jaringan Jalan",
      "Algoritma Pencarian: Linear Search vs Binary Search",
      "Algoritma Pengurutan: Bubble Sort & Insertion Sort",
      "Strategi Algoritmik Greedy & Pencarian Jalur Terpendek",
      "Studi Kasus & Pembahasan Soal Tantangan Bebras Task Kelas 8",
    ],
  },
  {
    slug: "analisis-data-spreadsheet-formula",
    image: m8digitalExcel,
    grade: 8,
    semester: 1,
    element: "Analisis Data (AD)",
    subject: "Informatika",
    title: "Analisis Data Lanjutan & Pemrosesan Spreadsheet",
    description: "Penguasaan formula multi-kondisi, pengolahan tabel besar, relasi tabel VLOOKUP/XLOOKUP, dan dashboard visualisasi interaktif.",
    modules: 6,
    duration: "6 jam",
    moduleList: [
      "Struktur Workbook Kompleks & Tipe Data Spreadsheet",
      "Formula Matematika & Statistik Majemuk (SUMIFS, COUNTIFS, AVERAGEIFS)",
      "Fungsi Logika Percabangan Majemuk (Nested IF & AND/OR)",
      "Pencarian Data Referensi Lintas Sheet (VLOOKUP, HLOOKUP, XLOOKUP)",
      "Pengurutan Bertingkat & Penyaringan Data dengan Pivot Table",
      "Pembuatan Dashboard Visualisasi Data Akademik Santri",
    ],
  },
  {
    slug: "keamanan-jaringan-dan-enkripsi",
    image: course1,
    grade: 8,
    semester: 1,
    element: "Jaringan Komputer & Internet (JKI)",
    subject: "Informatika",
    title: "Arsitektur Jaringan, Routing & Keamanan Siber",
    description: "Mempelajari protokol TCP/IP, pengalamatan IPv4/IPv6, cara kerja router, dan dasar enkripsi kriptografi untuk keamanan data.",
    modules: 6,
    duration: "5 jam",
    moduleList: [
      "Model Komunikasi Jaringan Client-Server vs Peer-to-Peer",
      "Topologi Jaringan Komputer & Peran Switch, Hub, Router",
      "Pengalamatan IP Address (IPv4, Subnetting Dasar & DHCP)",
      "Konsep Domain Name System (DNS) & Protokol HTTPS",
      "Dasar Kriptografi: Enkripsi Simetris (Caesar Cipher) & Asimetris",
      "Proteksi Firewall, Antivirus & Pencegahan Penipuan Siber",
    ],
  },
  {
    slug: "presentasi-digital-multimedia",
    image: m8digitalPpt,
    grade: 8,
    semester: 1,
    element: "Teknologi Informasi & Komunikasi (TIK)",
    subject: "Informatika",
    title: "Presentasi Digital & Komunikasi Visual Interaktif",
    description: "Teknik merancang slide presentasi modern dengan hierarki visual, infografis, animasi transisi halus, dan seni penyampaian gagasan.",
    modules: 5,
    duration: "4,5 jam",
    moduleList: [
      "Prinsip Desain Slide Efektif: Kontras, Ruang, dan Fokus",
      "Pemilihan Tipografi & Palet Harmoni Warna Presentasi",
      "Visualisasi Konsep Rumit Menjadi Infografis Sederhana",
      "Penerapan Animasi & Transisi Morph Dinamis Profesional",
      "Penyisipan Video, Audio & Elemen Kuis Interaktif",
    ],
  },

  // --- KELAS 8 SEMESTER 2 (GENAP) ---
  {
    slug: "dasar-algoritma-pemrograman",
    image: m8digitalAlgoritma,
    grade: 8,
    semester: 2,
    element: "Algoritma & Pemrograman (AP)",
    subject: "Informatika",
    title: "Algoritma & Pemrograman Berbasis Teks (Python)",
    description: "Transisi dari blok visual ke bahasa pemrograman teks Python modern: variabel, struktur kendali percabangan, loop, dan fungsi.",
    modules: 6,
    duration: "6,5 jam",
    moduleList: [
      "Pengenalan Sintaks Bahasa Python & Eksekutor Konsol",
      "Variabel, Tipe Data Primitif (int, float, str, bool) & Input Konsol",
      "Operator Aritmatika, Perbandingan & Logika Logis",
      "Struktur Percabangan Bersarang (if, elif, else)",
      "Struktur Perulangan (for range & while loop)",
      "Pembuatan Fungsi (def) & Proyek Mini Program Kasir/Kalkulator",
    ],
  },
  {
    slug: "sistem-komputer-dan-iot-sederhana",
    image: m8ipa,
    grade: 8,
    semester: 2,
    element: "Sistem Komputer (SK)",
    subject: "Informatika",
    title: "Sistem Komputer, Sensor & Otomasi Digital",
    description: "Mempelajari interaksi perangkat lunak dengan perangkat keras fisik melalui sensor digital, mikrokontroler (Micro:bit/Arduino), dan otomasi.",
    modules: 5,
    duration: "5 jam",
    moduleList: [
      "Mekanisme Siklus Fetch-Decode-Execute pada Mikroprosesor",
      "Pengenalan Sensor Digital (Suhu, Cahaya, Gerak, Ultrasonik)",
      "Pemrograman Mikrokontroler Edukasi (Micro:bit / Arduino Simulator)",
      "Logika Otomasi: Membaca Sensor & Memicu Aktuator (LED, Buzzer)",
      "Proyek Mini: Rancang Bangun Sistem Alarm / Smart Lamp Sederhana",
    ],
  },
  {
    slug: "dampak-sosial-dan-etika-digital",
    image: course4,
    grade: 8,
    semester: 2,
    element: "Dampak Sosial Informatika (DSI)",
    subject: "Informatika",
    title: "Dampak Sosial Informatika, Hak Cipta & Etika",
    description: "Menelaah undang-undang ITE, hak kekayaan intelektual (HAKI), lisensi open-source Creative Commons, dan literasi media sosial beretika.",
    modules: 5,
    duration: "4 jam",
    moduleList: [
      "Transformasi Digital & Pergeseran Lapangan Pekerjaan Masa Depan",
      "Hak Cipta, Paten & Lisensi Perangkat Lunak (Proprietary vs FOSS)",
      "Penggunaan Karya Orang Lain dengan Lisensi Creative Commons",
      "Mencegah Plagiarisme Digital & Teknik Parafrase Tepat",
      "Etika Beropini di Media Sosial & Kesadaran Hukum UU ITE",
    ],
  },
  {
    slug: "praktik-lintas-bidang-kelas-8",
    image: m8bindo,
    grade: 8,
    semester: 2,
    element: "Praktik Lintas Bidang (PLB)",
    subject: "Informatika",
    title: "Praktik Lintas Bidang: Solusi Masalah Komunitas",
    description: "Proyek rekayasa digital kelompok untuk memecahkan persoalan nyata di sekolah/pesantren dengan perpaduan Python dan data.",
    modules: 5,
    duration: "6,5 jam",
    moduleList: [
      "Identifikasi Masalah di Lingkungan Asrama / Sekolah Santri",
      "Perancangan Diagram Alir (Flowchart) Solusi Komputasional",
      "Pengembangan Program Python Pengolah Data Kelompok",
      "Uji Coba Validitas Data & Penanganan Error (Exception Handling)",
      "Presentasi Laporan Akhir & Demonstrasi Program kepada Guru",
    ],
  },

  // =========================================================================
  // KELAS 9 SMP - INFORMATIKA FASE D (MAHIR & MANDIRI)
  // =========================================================================

  // --- KELAS 9 SEMESTER 1 (GANJIL) ---
  {
    slug: "berpikir-komputasional-abstraksi-kelas-9",
    image: course2,
    grade: 9,
    semester: 1,
    element: "Berpikir Komputasional (BK)",
    subject: "Informatika",
    title: "Berpikir Komputasional: Rekursi & Analisis Masalah",
    description: "Tingkat mahir berpikir komputasional: fungsi rekursif, penguraian masalah kompleks, dan evaluasi efisiensi waktu algoritma.",
    modules: 6,
    duration: "5,5 jam",
    moduleList: [
      "Konsep Pemecahan Masalah Rekursif (Faktorial, Fibonacci, Menara Hanoi)",
      "Representasi Graf Lanjutan: Matriks Keterhubungan",
      "Teknik Pemrograman Dinamis (Dynamic Programming) Sederhana",
      "Pengukuran Kompleksitas Algoritma (Notasi Big-O Pengantar)",
      "Studi Kasus Logika Penalaran Deduktif & Induktif",
      "Simulasi & Pembahasan Soal Kompetisi Bebras Task Fase D",
    ],
  },
  {
    slug: "dasar-coding-web-pemula",
    image: m9digitalCoding,
    grade: 9,
    semester: 1,
    element: "Algoritma & Pemrograman (AP)",
    subject: "Informatika",
    title: "Pemrograman Web Interaktif (HTML, CSS & JS)",
    description: "Membangun website modern dari nol menggunakan struktur semantik HTML5, tata letak CSS3 Flexbox/Grid, dan interaktivitas JavaScript DOM.",
    modules: 6,
    duration: "7 jam",
    moduleList: [
      "Struktur Dokumen Semantik HTML5 & Elemen Multimedia",
      "Styling Modern dengan CSS3: Selektor, Warna, Box Model",
      "Tata Letak Halaman Responsif Menggunakan Flexbox & CSS Grid",
      "Dasar Interaktivitas Web dengan JavaScript & DOM Manipulation",
      "Pengolahan Form Input Pengguna & Validasi Interaktif",
      "Proyek Akhir: Membangun Website Portofolio Digital Santri",
    ],
  },
  {
    slug: "desain-grafis-dan-ui-ux",
    image: m9digitalDesain,
    grade: 9,
    semester: 1,
    element: "Teknologi Informasi & Komunikasi (TIK)",
    subject: "Informatika",
    title: "Desain Antarmuka Pengguna & UI/UX Produk Digital",
    description: "Metodologi perancangan produk digital: User Persona, Wireframe, Design System di Figma, dan pengujian kegunaan antarmuka.",
    modules: 6,
    duration: "6 jam",
    moduleList: [
      "Perbedaan User Interface (UI) dan User Experience (UX)",
      "Riset Pengguna, Pembuatan Empathy Map & User Persona",
      "Perancangan Kerangka Halaman: Sketsa Wireframe & Moodboard",
      "Desain Komponen Modern di Figma: Auto-Layout, Warna & Komponen",
      "Pembuatan Prototipe Interaktif yang Dapat Diklik (Clickable Prototype)",
      "Pengujian Keterpakaian Aplikasi (Usability Testing) Bersama Teman",
    ],
  },
  {
    slug: "multimedia-dan-editing-video",
    image: m9digitalMultimedia,
    grade: 9,
    semester: 1,
    element: "Teknologi Informasi & Komunikasi (TIK)",
    subject: "Informatika",
    title: "Produksi Konten Multimedia & Editing Video Kreatif",
    description: "Seni pembuatan video edukasi islami: storyboard, teknik pengambilan gambar, editing timeline, audio mixing, dan ekspor berkualitas.",
    modules: 5,
    duration: "5,5 jam",
    moduleList: [
      "Penyusunan Naskah Cerita & Storyboard Video Pembelajaran",
      "Teknik Komposisi Kamera, Sudut Pengambilan & Pencahayaan",
      "Proses Editing: Timeline, Pemotongan Klip, Transisi & Teks Bergerak",
      "Penyesuaian Audio: Backsound Halal, Voice Over & Sound Effects",
      "Color Correction, Rendering Ekspor Video & Etika Publikasi",
    ],
  },

  // --- KELAS 9 SEMESTER 2 (GENAP) ---
  {
    slug: "pengenalan-kecerdasan-buatan-ai",
    image: course1,
    grade: 9,
    semester: 2,
    element: "Dampak Sosial Informatika (DSI)",
    subject: "Informatika",
    title: "Kecerdasan Buatan (AI), Machine Learning & Masa Depan",
    description: "Memahami cara kerja AI, model bahasa besar (LLM), teknik prompt engineering cerdas, serta etika dan masa depan profesi digital.",
    modules: 6,
    duration: "6 jam",
    moduleList: [
      "Sejarah & Konsep Dasar AI: Perbedaan AI, Machine Learning, dan Deep Learning",
      "Cara Komputer Belajar: Supervised vs Unsupervised Learning Sederhana",
      "Generative AI & Cara Kerja Large Language Model (LLM)",
      "Seni Prompt Engineering untuk Riset & Pembuatan Media Pembelajaran",
      "Tantangan Etika AI: Hak Cipta Karya, Deepfake & Bias Algoritma",
      "Peta Karier Masa Depan: Data Scientist, AI Engineer, dan Cybersecurity",
    ],
  },
  {
    slug: "basis-data-dan-sql-dasar-kelas-9",
    image: m9mtk,
    grade: 9,
    semester: 2,
    element: "Analisis Data (AD)",
    subject: "Informatika",
    title: "Basis Data Relasional & Manajemen Informasi SQL",
    description: "Mendesain tabel basis data relasional, membuat Entity Relationship Diagram (ERD), dan kueri dasar SQL (SELECT, INSERT, UPDATE, JOIN).",
    modules: 6,
    duration: "6 jam",
    moduleList: [
      "Konsep Basis Data Relasional vs File Tradisional",
      "Perancangan Skema Tabel: Primary Key & Foreign Key",
      "Pemodelan Data Menggunakan Entity Relationship Diagram (ERD)",
      "Perintah Dasar SQL: SELECT, WHERE, ORDER BY, dan LIMIT",
      "Operasi Mutasi Data: INSERT, UPDATE, DELETE & Integritas Data",
      "Penggabungan Tabel Relasional Menggunakan Perintah JOIN",
    ],
  },
  {
    slug: "keamanan-siber-dan-privasi-data-kelas-9",
    image: course3,
    grade: 9,
    semester: 2,
    element: "Jaringan Komputer & Internet (JKI)",
    subject: "Informatika",
    title: "Keamanan Siber Lanjutan, Kriptografi & Privasi Digital",
    description: "Mendeteksi ancaman siber modern, prinsip CIA Triad (Confidentiality, Integrity, Availability), dan perlindungan infrastruktur digital.",
    modules: 5,
    duration: "5 jam",
    moduleList: [
      "Prinsip Keamanan Siber: CIA Triad & Ancaman Serangan Masa Kini",
      "Ragam Serangan Siber: Social Engineering, Man-in-the-Middle, DDoS",
      "Kriptografi Modern: Public-Private Key & Sertifikat SSL/TLS",
      "Audit Keamanan Akun & Manajemen Kata Sandi Terenkripsi",
      "Panduan Tanggap Insiden Kebocoran Data (Data Breach)",
    ],
  },
  {
    slug: "praktik-lintas-bidang-proyek-terpadu",
    image: m9ips,
    grade: 9,
    semester: 2,
    element: "Praktik Lintas Bidang (PLB)",
    subject: "Informatika",
    title: "Praktik Lintas Bidang: Rekayasa Produk Digital Terpadu",
    description: "Karya puncak kelulusan: merancang dan membangun produk digital terpadu (web/aplikasi) secara kolaboratif dengan standar industri.",
    modules: 6,
    duration: "8 jam",
    moduleList: [
      "Identifikasi Masalah Strategis & Perumusan Solusi Produk Digital",
      "Penyusunan Dokumen Spesifikasi Produk & Arsitektur Sistem",
      "Manajemen Proyek Kolaboratif Menggunakan Metode Agile Kanban",
      "Implementasi & Coding Integrasi Antarmuka Pengguna dengan Logika",
      "Pengujian Kualitas Perangkat Lunak (Quality Assurance & Bug Fix)",
      "Pameran Sidang Karya Akhir Digital & Pitching di Depan Penguji",
    ],
  },
];

export function getMaterialBySlug(slug: string): Materi | undefined {
  return materials.find((m) => m.slug === slug);
}
