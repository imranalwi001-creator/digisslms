# 🎨 Digisschool LMS — Human Craftsmanship Design System (Hallmark)

Sistem desain resmi untuk **Digisschool LMS**, dirancang dari prinsip ketelitian manusia (*craftsmanship*), tanpa elemen klise atau ornamen palsu hasil generate AI (*Anti-AI-Slop*).

---

## 1. Filosofi & Karakter Visual

- **Genre:** Editorial-Academic & Modern Craftsmanship.
- **Karakter:** Tenang, berwibawa, terstruktur, bebas distraksi visual (*zero cognitive noise*).
- **Penolakan Slop:**
  - ❌ Tidak ada gradien pelangi/wash-out (`purple-to-pink`, `primary-to-secondary` wash).
  - ❌ Tidak ada ikon klise `✨ Sparkles` atau emoji roket `🚀` sebagai ornamen hiasan.
  - ❌ Tidak ada animasi bola mengambang (*floating orbs*), bayangan berpendar neon (*neon glow halos*), atau glassmorphism dekoratif tanpa fungsi.
  - ❌ Tidak ada klaim metrik fiktif (*invented metrics*).
  - ❌ Tidak ada judul dengan huruf miring (*italic headers*).
  - ✅ Menggunakan permukaan kertas padat bertingkat (*tactile tinted paper surfaces*).
  - ✅ Tipografi 2+1 bermartabat dengan kontras tinggi.
  - ✅ Data dan kurikulum nyata: 24 Modul Informatika Fase D Kurikulum Merdeka Kemendikbudristek.

---

## 2. Palet Warna (OKLCH Clean Paper & Warm Ochre)

Semua komponen wajib mengonsumsi token resmi tanpa mendeklarasikan nilai warna acak (*no mid-render token improvisation*):

```css
:root {
  /* Paper band: Light (L > 85%) */
  --background: oklch(0.985 0.004 85);    /* Kertas hangat bersih */
  --foreground: oklch(0.18 0.015 65);     /* Tinta gelap berkarakter */
  --card: oklch(1 0 0);                   /* Kartu permukaan putih murni */
  --surface-alt: oklch(0.96 0.008 85);    /* Permukaan sekunder/aksen lembut */
  --primary: oklch(0.56 0.18 48);         /* Deep Warm Ochre / Amber Emas Kaya */
  --primary-foreground: oklch(0.99 0 0);  /* Putih Bersih untuk Kontras Maksimal */
  --secondary: oklch(0.94 0.015 80);
  --secondary-foreground: oklch(0.22 0.02 65);
  --muted: oklch(0.94 0.01 80);
  --muted-foreground: oklch(0.48 0.025 65);
  --border: oklch(0.90 0.008 80);
  --input: oklch(0.90 0.008 80);
}

.dark {
  /* Paper band: Dark (L < 30%) */
  --background: oklch(0.13 0.012 60);    /* Deep Charcoal bertekstur */
  --foreground: oklch(0.94 0.008 80);    /* Tinta terang lembut */
  --card: oklch(0.18 0.014 60);          /* Elevasi kartu solid */
  --surface-alt: oklch(0.16 0.012 60);
  --primary: oklch(0.65 0.18 55);        /* Amber Ember menyala hangat */
  --primary-foreground: oklch(0.99 0 0); /* Putih Bersih */
  --border: oklch(0.26 0.012 60);
}
```

---

## 3. Sistem Tipografi (2+1 Canon)

1. **Display Face:** `Newsreader` (Georgia/Cambria fallback)
   - Digunakan untuk tajuk besar, judul modul, dan angka capaian penting.
   - Wajib tegak (`font-style: normal`), tidak menggunakan italic pada heading.
2. **Body & UI Face:** `Plus Jakarta Sans`
   - Digunakan untuk teks bacaan modul, navigasi, tombol, dan elemen formulir.
3. **Tabular & Code Face:** `Geist Mono`
   - Digunakan untuk editor kode interaktif, angka presensi, waktu belajar, dan kode kuis.
   - Wajib menyertakan `font-variant-numeric: tabular-nums` pada setiap tampilan kolom angka.

---

## 4. Struktur & Tata Letak

- **Rhythm Spacing:** Skala kelipatan 4-pt Tailwind (`p-4`, `p-6`, `p-8`, `gap-5`, `gap-6`).
- **Mobile Hard Floor:**
  - `html, body { overflow-x: clip; }` untuk mencegah pergeseran horizontal.
  - Target sentuh minimal 44px (`min-h-[44px]` pada tombol navigasi).
  - Teks tombol dan tautan navigasi tidak boleh terputus menjadi 2 baris (*no wrap-to-two-lines clickable text*).
- **Containment:** Satu lapisan kontainer yang jelas (*single containment layer*), menghindari nesting berulang tanpa arti semantik.
