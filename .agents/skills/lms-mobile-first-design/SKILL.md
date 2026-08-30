---
name: lms-mobile-first-design
description: Mobile-first UX/UI engineering for native-like LMS web applications (Udemy/Coursera mobile standard). Covers bottom app navigation dock, thumb-zone ergonomics, bottom sheet drawers, touch target sizing (min 44px), horizontal snap carousels, responsive video theater, and safe-area insets.
---

# Mobile-First LMS UX/UI Excellence

Gunakan keahlian ini untuk merancang dan menyempurnakan tampilan antarmuka LMS agar terasa seperti aplikasi mobile native (iOS / Android) yang bersih, ramah pengguna (*friendly*), bebas hambatan (*frictionless*), dan nyaman diakses dengan satu tangan (*one-thumb ergonomics*).

---

## 1. Ergonomi & Navigasi Mobile Native
- **Bottom Navigation Dock**:
  - Pada layar mobile (`< 768px`), tampilkan bilah navigasi bawah tetap (*fixed bottom bar*) berisi 4 menu utama: **Beranda**, **Belajar Saya**, **Peringkat**, dan **Profil**.
  - Berikan ruang *safe-area-inset-bottom* agar tidak terpotong tombol navigasi sistem HP.
- **Zona Jangkauan Jempol (Thumb Zone)**:
  - Tempatkan tombol aksi primer (*CTA*, tombol *Lanjut Belajar*, *Mulai Kuis*) di area bawah layar yang mudah dijangkau satu tangan.
  - Ukuran target sentuh minimal **44x44px** dengan jarak antar tombol yang cukup untuk mencegah salah klik.

---

## 2. Struktur Tampilan Bersih & Minimalis (Clean & Airy)
- **Kartu Horizontal Snap-Scroll**:
  - Tampilkan daftar materi yang sedang dipelajari dan rekomendasi dalam format kartu geser horizontal (*horizontal snap-carousel*) dengan efek *peek* (kartu berikutnya terlihat sebagian agar memancing gestur geser).
- **Progressive Disclosure**:
  - Sembunyikan detail sekunder di balik *collapsible drawer* atau *accordion* agar layar tidak sesak.
- **Tipografi Proporsional**:
  - Ukuran heading mobile yang seimbang (`1.25rem - 1.75rem`), kontras warna teks yang tajam, dan *line-height* yang nyaman dibaca tanpa *zoom*.

---

## 3. Mobile Course Player & Bottom Sheet Drawer
- **Player Fleksibel di Layar Atas (Sticky Top)**:
  - Video atau materi modul menempel rapi di bagian atas layar dengan rasio `16:9` yang tajam.
- **Bottom Sheet Drawer untuk Silabus & Catatan**:
  - Ganti modal pop-up desktop yang kaku dengan *Bottom Sheet* atau tab geser bawah yang ramah sentuhan.
- **Sticky Lesson Progress Controller**:
  - Tombol *Modul Sebelumnya*, *Tandai Selesai*, dan *Lanjut* selalu melayang rapi di bawah player.

---

## 4. Performa & Sentuhan Halus (Haptic Feel)
- Transisi halus `duration-200` pada saat *tap* (`active:scale-[0.97]`).
- Hindari elemen yang memicu *horizontal scrollbar* tak sengaja dengan menyetel `overflow-x: clip` pada kontainer utama.
