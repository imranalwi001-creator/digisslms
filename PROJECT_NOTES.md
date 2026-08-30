# 📋 CATATAN PERKEMBANGAN HARIAN PROYEK DIGISSCHOOL LMS
**Tanggal Rangkuman:** 30 Agustus 2026  
**Domain Resmi Live:** [https://digisschool.my.id](https://digisschool.my.id)  
**Repository GitHub:** [https://github.com/imranalwi001-creator/digisslms](https://github.com/imranalwi001-creator/digisslms) (Branch: `main`)  
**Status Deployment:** ✅ Live di Vercel (Production SSR via Nitro Engine)

---

## 🏛️ 1. Domain & Infrastruktur Cloud
- **Domain Resmi**: `digisschool.my.id` berhasil terhubung ke Vercel dengan status **Valid Configuration (Centang Biru 🔵)**, SSL HTTPS Aktif 🔒, dan HTTP/2 200 OK.
- **DNS DomaiNesia**: Nameserver default hosting `nsx1.domainesia.com` & `nsx2.domainesia.com` dengan A-Record mengarah ke IP server `216.198.79.1` dan CNAME `www` mengarah ke `cname.vercel-dns.com`.
- **SSR Engine**: Nitro Vite plugin terkonfigurasi pada `vite.config.ts` untuk server-side rendering tanpa error `404: NOT_FOUND`.
- **Database Fallbacks**: Terpasang *safe public database credentials* untuk Supabase dan Turso LibSQL Cloud agar Vercel deployment tidak memunculkan peringatan missing env.

---

## 📚 2. Kurikulum Terpadu Informatika Fase D (Semester 1 & 2)
Telah selesai disusun dan diterapkan 100% untuk **24 Modul Pembelajaran Resmi** berbasis 8 Elemen Kurikulum Merdeka Kemendikbudristek:

### A. Kelas 7 SMP (Fase D Dasar)
- **Semester 1 (Ganjil)**:
  1. `berpikir-komputasional-dasar` — 4 Pilar BK, Dekomposisi, Abstraksi, Bebras Task.
  2. `perangkat-keras-dan-sistem-komputer` — Hardware CPU/RAM, OS Windows/Linux, CLI vs GUI.
  3. `aplikasi-perkantoran-pengolah-kata` — Pengolah Kata Formal, Otomatisasi Daftar Isi, Cloud Docs.
  4. `jaringan-komputer-dan-internet-sehat` — Jaringan LAN/Wi-Fi, Netiket Islami, Proteksi Phishing.
- **Semester 2 (Genap)**:
  5. `analisis-data-dasar-kelas-7` — Pengumpulan Data Daring, Data Cleaning, Statistik Rata-rata, Grafik.
  6. `pemrograman-visual-scratch` — Logika Blok Visual, Sprite, Gerakan/Suara, Game Kuis Edukatif.
  7. `dampak-sosial-informatika-kelas-7` — Jejak Digital Aktif/Pasif, Privasi Data, Anti-Cyberbullying.
  8. `praktik-lintas-bidang-kelas-7` — Proyek Kolaboratif Media Edukasi Digital Sekolah.

### B. Kelas 8 SMP (Fase D Menengah)
- **Semester 1 (Ganjil)**:
  1. `berpikir-komputasional-lanjutan-kelas-8` — Graf, Pohon (Tree), Linear/Binary Search, Sorting, Greedy.
  2. `analisis-data-spreadsheet-formula` — Formula Majemuk (SUMIFS), Nested IF, VLOOKUP, Pivot Table.
  3. `keamanan-jaringan-dan-enkripsi` — Topologi, TCP/IP, Subnetting, Kriptografi Caesar Cipher, Firewall.
  4. `presentasi-digital-multimedia` — Desain Slide Kontras, Infografis, Morph Transition, Video Interaktif.
- **Semester 2 (Genap)**:
  5. `dasar-algoritma-pemrograman` — Pemrograman Teks Python, Tipe Data, If-Else, Loop, Fungsi (`def`).
  6. `sistem-komputer-dan-iot-sederhana` — Siklus CPU, Sensor Suhu/Gerak, Simulator Micro:bit/Arduino.
  7. `dampak-sosial-dan-etika-digital` — HAKI, Lisensi Open Source Creative Commons, Etika UU ITE.
  8. `praktik-lintas-bidang-kelas-8` — Proyek Solusi Masalah Komunitas Asrama dengan Python.

### C. Kelas 9 SMP (Fase D Mahir & Mandiri)
- **Semester 1 (Ganjil)**:
  1. `berpikir-komputasional-abstraksi-kelas-9` — Rekursi (Fibonacci, Hanoi), Dynamic Programming, Notasi Big-O.
  2. `dasar-coding-web-pemula` — Pemrograman Web HTML5 Semantik, CSS Grid/Flexbox, JavaScript DOM.
  3. `desain-grafis-dan-ui-ux` — UI/UX Metodologi, User Persona, Wireframe, Figma Design System.
  4. `multimedia-dan-editing-video` — Storyboard, Sinematografi, Video Cutting Multi-Layer, Audio Mixing.
- **Semester 2 (Genap)**:
  5. `pengenalan-kecerdasan-buatan-ai` — AI vs Machine Learning, Generative AI & LLM, Prompt Engineering.
  6. `basis-data-dan-sql-dasar-kelas-9` — Database Relasional, ERD, Primary/Foreign Key, Kueri SQL (`JOIN`).
  7. `keamanan-siber-dan-privasi-data-kelas-9` — CIA Triad, Mitigasi Serangan Siber, SSL/TLS, Respons Data Breach.
  8. `praktik-lintas-bidang-proyek-terpadu` — Proyek Akhir Rekayasa Produk Digital Terpadu (Agile Kanban).

---

## 🎥 3. Focused LMS Video Player (Zero-Distraction)
- **Komponen**: `src/components/lms/FocusedLMSVideoPlayer.tsx`.
- **Fitur Bebas Distraksi**:
  - Menghilangkan link dan logo eksternal yang mengarahkan keluar dari platform.
  - Kontrol native LMS lengkap: Play/Pause, Rewind/Forward 10s, Timeline Scrubber, Volume/Mute, Playback Speed (0.75x–2.0x), Fullscreen.
  - Pelacak ketuntasan otomatis (*Auto-Completion +50 XP*) ketika video ditonton >90%.
  - Kompatibilitas universal (Universal High-Compatibility Embed) untuk Desktop, HP Android, dan iPhone/iPad.

---

## 🗄️ 4. Sinkronisasi Data Lintas Perangkat (Cross-Device Cloud Sync)
- **Database Backend**: Turso LibSQL Cloud (`course_contents`, `materials`, `student_notes`, `course_qa`, `certificates`).
- **Auto-Migration Engine**:
  - Modul `src/lib/course-content.ts` secara otomatis mendeteksi setiap konten lokal di desktop (termasuk video *"pertemuan pertama"*) dan mengunggahnya ke server cloud di latar belakang.
  - Menghindari data hilang di HP dengan cache key `v2` dan sinkronisasi real-time via `syncCloudContents()`.

---

## 💻 5. Multi-Language Interactive Coding Sandbox
- **Komponen**: `src/components/lms/InteractiveCodingSandbox.tsx`.
- **4 Mode Studio Interaktif**:
  1. 🗄️ **SQL Database Studio**: In-memory SQLite engine dengan tabel `santri` & `nilai_akademik`, eksekusi kueri `SELECT`, `WHERE`, `JOIN`, `GROUP BY`, dan visualisasi tabel data interaktif dengan waktu eksekusi (*ms*).
  2. ⚡ **JavaScript Engine**: Eksekusi algoritma array (`.map`, `.filter`, `.reduce`), `console.log`, dan simulasi Bubble Sort bertahap.
  3. 🐍 **Python 3 WASM**: Eksekusi logika pemrograman, perhitungan nilai capaian santri, dan format predikat.
  4. 🌐 **Web Studio (HTML5/CSS3)**: Sandboxed live iframe rendering untuk desain antarmuka santri.

---

## 🎯 6. Target Coding Harian & Komunitas Santri
- **Target Coding Harian**: Menggunakan tabel Supabase `habits` & `habit_logs` dengan UI `DailyCodingTrackerCard.tsx`, streak harian, dan bonus XP.
- **Ruang Chat Santri**: Terintegrasi pada tab Dashboard (`chat`) dan profil santri dengan dukungan chat grup angkatan, channel coding, direct message (DM), dan cuplikan kode.

---

## 📌 7. Rencana Pengembangan Lanjutan untuk Esok Hari:
1. Pengujian interaksi langsung fitur kuis dan pengumpulan tugas oleh santri di berbagai kelas.
2. Penambahan bank soal kuis Kurikulum Merdeka untuk materi Semester 2.
3. Kustomisasi sertifikat digital otomatis ber-barcode untuk setiap modul yang diselesaikan.
4. Optimalisasi performa dan audit berkala data sekolah.

---
*Semua perubahan kode hari ini telah tersimpan aman di repositori GitHub `imranalwi001-creator/digisslms` dan live di `https://digisschool.my.id`.*
