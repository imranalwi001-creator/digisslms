---
name: lms-fullstack-architecture
description: Fullstack engineering best practices for scalable LMS applications. Covers high-concurrency database queries with Turso/LibSQL, TanStack Start server functions, optimistic UI caching, role-based access control (RBAC), and streaming performance.
---

# LMS Fullstack Architecture & Performance

Gunakan keahlian ini untuk membangun fondasi teknis LMS yang tahan beban tinggi, cepat, aman, dan modular.

## 1. Arsitektur Data & Kueri Efisien (Turso/LibSQL)
- **Batching & Connection Reuse**: Gunakan transaksi `batch` untuk operasi multi-tabel (misal: pendaftaran kelas + inisialisasi progres).
- **Indexing Strategis**: Pastikan kolom pencarian cepat terindeks (`user_id`, `material_slug`, `created_at`, `status`).
- **Optimistic UI Updates**: Tampilkan perubahan antarmuka secara instan pada aksi pengguna (misal: mencentang modul, menambah catatan) sembari melakukan mutasi server di latar belakang.

## 2. Keamanan & Role-Based Access Control (RBAC)
- Pisahkan otorisasi berdasarkan peran:
  - **Admin**: Kontrol sistem penuh, analitik global, manajemen periode dan akun.
  - **Guru/Instructor**: Manajemen materi, pembuatan bank soal kuis, penilaian rubrik tugas, dan rekap absensi.
  - **Siswa/Student**: Mengakses materi sesuai tingkatan kelas, mengerjakan kuis, mengumpulkan tugas, mencatat, dan berdiskusi.
  - **Orang Tua/Parent**: Memantau rapor nilai, riwayat presensi, dan progres ketuntasan belajar anak.

## 3. Server Functions & Zero-Latency Routing (TanStack Start)
- Manfaatkan `createServerFn` untuk API backend bertipe data kuat (*type-safe*).
- Gunakan SSR (*Server Side Rendering*) pada halaman katalog dan metadata materi untuk kecepatan muat awal dan SEO optimal.
