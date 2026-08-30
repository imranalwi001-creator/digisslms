import { Link } from "@tanstack/react-router";
import {
  GraduationCap,
  Users,
  BookOpen,
  Award,
  ClipboardCheck,
  Video,
  MessagesSquare,
  FileBadge,
  LineChart,
  ShieldCheck,
  Clock,
  ArrowRight,
  CheckCircle2,
} from "lucide-react";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { materials } from "@/lib/materials";
import { useSiteSettings } from "@/lib/site-settings";

/* ─── Stat strip ─── */
const stats = [
  { icon: Users, value: "1.250+", label: "Siswa Informatika Aktif" },
  { icon: BookOpen, value: "15 Modul", label: "Kurikulum Merdeka SMP" },
  { icon: ClipboardCheck, value: "86 Bab", label: "Lab Coding & Teori" },
  { icon: Award, value: "98.4%", label: "Tingkat Ketuntasan Belajar" },
];

export function StatsStrip() {
  const { settings } = useSiteSettings();
  const icons = [Users, BookOpen, ClipboardCheck, Award];
  const items = settings.stats.map((s, i) => ({
    icon: icons[i % icons.length],
    value: s.value || stats[i]?.value || "",
    label: s.label,
  }));

  return (
    <section className="border-y border-border/50 bg-card/60 backdrop-blur-sm">
      <div className="mx-auto grid max-w-6xl grid-cols-2 gap-6 px-5 py-8 md:grid-cols-4">
        {items.map((s) => (
          <div key={s.label} className="flex items-center gap-3.5">
            <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-2xl bg-primary/10 text-primary border border-primary/20 shadow-2xs">
              <s.icon className="h-5 w-5" />
            </div>
            <div className="min-w-0">
              <p className="text-2xl font-bold tracking-tight text-foreground font-mono">{s.value}</p>
              <p className="truncate text-xs text-muted-foreground font-medium">{s.label}</p>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

/* ─── Learning paths per grade ─── */
const paths = [
  {
    grade: 7 as const,
    title: "Kelas 7 · Fondasi Komputasi",
    desc: "Membangun pola berpikir komputasional, memahami perangkat keras & OS, internet sehat, dan coding visual Scratch.",
  },
  {
    grade: 8 as const,
    title: "Kelas 8 · Logika & Analisis Data",
    desc: "Pengolahan formula spreadsheet data, arsitektur jaringan & kriptografi, serta pengenalan bahasa pemrograman Python.",
  },
  {
    grade: 9 as const,
    title: "Kelas 9 · Rekayasa Web & AI Terapan",
    desc: "Pemrograman web interaktif (HTML/CSS/JS), desain UI/UX, literasi kecerdasan buatan (AI), dan Praktik Lintas Bidang (PLB).",
  },
];

export function LearningPaths() {
  return (
    <section id="paths" className="py-24">
      <div className="mx-auto max-w-6xl px-5">
        <div className="mb-12 max-w-2xl">
          <p className="mb-3 text-xs font-semibold uppercase tracking-widest text-primary">Jalur belajar</p>
          <h2 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl" style={{ lineHeight: "1.15" }}>
            Kurikulum terstruktur dari kelas 7 sampai 9
          </h2>
          <p className="mt-4 text-muted-foreground">
            Setiap jalur disusun bertahap: materi, latihan, asesmen, lalu refleksi. Progres siswa tercatat otomatis di
            setiap modul.
          </p>
        </div>

        <div className="grid gap-5 md:grid-cols-3">
          {paths.map((p) => {
            const list = materials.filter((m) => m.grade === p.grade);
            const modules = list.reduce((s, m) => s + m.modules, 0);
            return (
              <div
                key={p.grade}
                className="group flex flex-col rounded-2xl border border-border/60 bg-card p-6 transition-all duration-300 hover:border-primary/40 hover:shadow-lg"
              >
                <div className="mb-4 flex items-center gap-2">
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
                    <GraduationCap className="h-3.5 w-3.5" />
                    Kelas {p.grade}
                  </span>
                </div>
                <h3 className="text-lg font-semibold text-foreground">{p.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{p.desc}</p>

                <ul className="mt-5 space-y-2">
                  {list.map((m) => (
                    <li key={m.slug}>
                      <Link
                        to="/materi/$slug"
                        params={{ slug: m.slug }}
                        className="flex items-center gap-2 text-sm text-muted-foreground transition-colors hover:text-primary"
                      >
                        <CheckCircle2 className="h-4 w-4 flex-shrink-0 text-primary/70" />
                        <span className="truncate">{m.title}</span>
                      </Link>
                    </li>
                  ))}
                </ul>

                <div className="mt-6 flex items-center justify-between border-t border-border/50 pt-4 text-xs text-muted-foreground">
                  <span>{list.length} materi · {modules} modul</span>
                  <span className="inline-flex items-center gap-1 font-medium text-primary opacity-0 transition-opacity group-hover:opacity-100">
                    Lihat <ArrowRight className="h-3.5 w-3.5" />
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

/* ─── Platform capabilities ─── */
const capabilities = [
  { icon: Video, title: "Kelas & video materi", desc: "Modul video dan bacaan terurut, bisa dilanjutkan dari titik terakhir." },
  { icon: ClipboardCheck, title: "Kuis & asesmen", desc: "Penilaian harian, ulangan, dan proyek di akhir setiap materi." },
  { icon: LineChart, title: "Laporan progres", desc: "Grafik momentum, tingkat penyelesaian, dan riwayat aktivitas siswa." },
  { icon: MessagesSquare, title: "Pengumuman kelas", desc: "Guru menerbitkan informasi penting langsung ke dasbor siswa." },
  { icon: FileBadge, title: "Sertifikat & capaian", desc: "Lencana level Pemula hingga Teladan berdasarkan persentase capaian." },
  { icon: ShieldCheck, title: "Peran & keamanan", desc: "Akses terpisah untuk admin dan siswa dengan data terlindungi." },
];

export function PlatformCapabilities() {
  return (
    <section id="platform" className="border-y border-border/50 bg-card py-24">
      <div className="mx-auto max-w-6xl px-5">
        <div className="mb-12 text-center">
          <p className="mb-3 text-xs font-semibold uppercase tracking-widest text-primary">Platform</p>
          <h2 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl" style={{ lineHeight: "1.15" }}>
            Satu sistem untuk mengajar, belajar, dan menilai
          </h2>
        </div>

        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {capabilities.map((c) => (
            <div
              key={c.title}
              className="rounded-2xl border border-border/60 bg-background p-6 transition-all duration-300 hover:-translate-y-0.5 hover:shadow-md"
            >
              <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10">
                <c.icon className="h-5 w-5 text-primary" />
              </div>
              <h3 className="font-semibold text-foreground">{c.title}</h3>
              <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">{c.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ─── Role split: siswa vs guru/admin ─── */
const roleCards = [
  {
    icon: GraduationCap,
    tag: "Untuk siswa",
    title: "Dasbor belajar pribadi",
    points: [
      "Daftar kelas dan lanjutkan modul terakhir",
      "Centang modul selesai, progres tersimpan otomatis",
      "Rangkaian hari belajar dan level capaian",
      "Pengumuman kelas dan pengingat harian",
    ],
    to: "/dashboard",
    cta: "Buka dasbor siswa",
  },
  {
    icon: ShieldCheck,
    tag: "Untuk guru & admin",
    title: "Panel pengelolaan kelas",
    points: [
      "CRUD data siswa lengkap dengan kredensial",
      "Atur kelas yang diikuti tiap siswa",
      "Visualisasi metrik dan distribusi kelas",
      "Terbitkan dan ubah pengumuman",
    ],
    to: "/admin",
    cta: "Buka panel admin",
  },
];

export function RoleShowcase() {
  return (
    <section id="roles" className="py-24">
      <div className="mx-auto max-w-6xl px-5">
        <div className="grid gap-5 md:grid-cols-2">
          {roleCards.map((r) => (
            <div key={r.tag} className="flex flex-col rounded-2xl border border-border/60 bg-card p-8">
              <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10">
                <r.icon className="h-6 w-6 text-primary" />
              </div>
              <p className="text-xs font-semibold uppercase tracking-widest text-primary">{r.tag}</p>
              <h3 className="mt-2 text-2xl font-bold tracking-tight text-foreground">{r.title}</h3>
              <ul className="mt-5 flex-1 space-y-3">
                {r.points.map((p) => (
                  <li key={p} className="flex items-start gap-2.5 text-sm text-muted-foreground">
                    <CheckCircle2 className="mt-0.5 h-4 w-4 flex-shrink-0 text-primary" />
                    <span>{p}</span>
                  </li>
                ))}
              </ul>
              <Link
                to={r.to}
                className="mt-7 inline-flex items-center gap-1.5 self-start rounded-xl bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground transition-opacity hover:opacity-90 active:scale-[0.97]"
              >
                {r.cta}
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ─── FAQ ─── */
const faqs = [
  {
    q: "Apakah Continuum LMS gratis untuk siswa?",
    a: "Ya. Siswa dapat mendaftar, mengikuti kelas, dan memantau progres tanpa biaya. Sekolah dapat meminta fitur pengelolaan tambahan.",
  },
  {
    q: "Bagaimana progres belajar dihitung?",
    a: "Setiap modul yang ditandai selesai menambah persentase capaian materi. Persentase gabungan menentukan level Anda, mulai Pemula hingga Teladan.",
  },
  {
    q: "Apakah guru bisa menambahkan siswa secara manual?",
    a: "Bisa. Admin dapat membuat akun siswa lengkap dengan email, kata sandi, kelas, dan daftar materi yang diikuti dari panel admin.",
  },
  {
    q: "Apakah bisa dipakai di ponsel?",
    a: "Bisa. Tampilan menyesuaikan layar ponsel, tablet, dan desktop, serta progres tersinkron di semua perangkat setelah masuk.",
  },
  {
    q: "Bagaimana dengan keamanan data siswa?",
    a: "Data disimpan dengan aturan akses per peran, sehingga siswa hanya dapat melihat datanya sendiri dan admin memiliki akses pengelolaan.",
  },
];

export function FaqSection() {
  const { settings } = useSiteSettings();

  return (
    <section id="faq" className="border-t border-border/50 py-24">
      <div className="mx-auto max-w-3xl px-5">
        <div className="mb-10 text-center">
          <p className="mb-3 text-xs font-semibold uppercase tracking-widest text-primary">Pertanyaan umum</p>
          <h2 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl" style={{ lineHeight: "1.15" }}>
            Hal yang sering ditanyakan
          </h2>
        </div>

        <Accordion type="single" collapsible className="w-full">
          {settings.faqs.map((f, i) => (
            <AccordionItem key={f.q} value={`item-${i}`}>
              <AccordionTrigger className="text-left text-base font-medium">{f.q}</AccordionTrigger>
              <AccordionContent className="text-sm leading-relaxed text-muted-foreground">{f.a}</AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>

        <div className="mt-10 flex items-center justify-center gap-2 text-xs text-muted-foreground">
          <Clock className="h-3.5 w-3.5" />
          Dukungan pengajar aktif setiap hari kerja, 08.00–17.00 WITA
        </div>
      </div>
    </section>
  );
}
