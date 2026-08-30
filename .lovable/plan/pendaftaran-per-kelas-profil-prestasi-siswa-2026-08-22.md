# Pendaftaran per kelas + Profil Prestasi Siswa

## 1. Form pendaftaran lebih ringkas
- Hapus field **No. HP** dan **Asal sekolah** dari form daftar (`/login`). Yang tersisa: nama lengkap, kelas, email, kata sandi, konfirmasi.
- Kolom lama di database tetap ada (tidak merusak data), hanya tidak diminta lagi.

## 2. Wajib pilih kelas untuk pendaftar Google
- Setelah login Google (atau akun lama yang belum punya kelas), siswa diarahkan ke layar **"Pilih kelasmu"** (7 / 8 / 9) sebelum bisa masuk dashboard.
- Pilihan disimpan di profil siswa; sekali dipilih, hanya admin yang bisa mengubah kelas (mencegah siswa lompat kelas untuk membuka materi lain).

## 3. Materi terkunci per kelas
- Dashboard siswa hanya menampilkan katalog materi sesuai kelas siswa.
- Halaman detail materi memblokir akses jika kelasnya tidak cocok (pesan "Materi ini untuk Kelas X"), dan tombol daftar/enroll dinonaktifkan.
- Admin tetap bisa melihat semua materi.

## 4. Profil prestasi siswa (premium, bisa dilihat sesama siswa)
Halaman baru `/siswa/$id`:
- Header: avatar, nama, kelas, **level** (Pemula → Berkembang → Mahir → Ahli → Teladan) dan persentase menuju level berikutnya.
- Kartu capaian: modul selesai, materi tuntas, rata-rata nilai kuis, tugas dikumpulkan, sertifikat diraih, streak belajar.
- Grafik momentum 14 hari + daftar lencana (badge) otomatis: "Kuis Sempurna", "Streak 7 Hari", "Materi Pertama Tuntas", dst.
- Sertifikat yang tampil publik-antarsiswa (nomor + materi).

Plus halaman **Papan Peringkat** (`/peringkat`) per kelas: 20 siswa teratas berdasarkan skor prestasi
(`modul selesai×10 + rata-rata kuis + sertifikat×50`), dengan penanda posisi siswa yang sedang login —
inilah pemicu kompetisi sehat yang diminta.

## 5. Rekomendasi tambahan saya
- **Privasi terkendali**: siswa hanya melihat data prestasi (bukan email/HP), dan bisa menyembunyikan diri dari papan peringkat lewat pengaturan.
- **Peringkat mingguan** selain total, supaya siswa yang baru mulai tetap punya peluang menang.
- Pengumuman otomatis "Siswa terbaik minggu ini" dari dashboard admin.

## Catatan teknis
- Migrasi database: kolom `profiles.grade` wajib terisi sebelum akses; kolom `profiles.leaderboard_opt_out boolean default false`;
  view `public.student_public_stats` (security definer, kolom aman saja: id, display_name, avatar_url, grade, agregat progres/kuis/sertifikat) + GRANT SELECT ke `authenticated`.
  Data sensitif (email, phone, school, notes) tidak pernah keluar dari view ini.
- Gate kelas: komponen `RequireGrade` di `RequireRole` chain, plus route `/onboarding/kelas`.
- Materi difilter dengan `materials.filter(m => m.grade === profile.grade)`; enforcement kedua di server function enroll (tolak jika kelas tidak cocok).
- Profil & peringkat dibaca lewat server function publik (`requireSupabaseAuth`) yang query view di atas.
