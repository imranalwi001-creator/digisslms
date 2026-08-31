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
  Code2,
  Database,
  Terminal,
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

/* ─── Real Academic Metric Strip (No Invented Stats) ─── */
const authenticStats = [
  { icon: BookOpen, value: "24 Modul", label: "Informatika Fase D Kemendikbud" },
  { icon: Terminal, value: "8 Elemen", label: "BK, SK, JKI, AD, AP, DSI, PLB, AI" },
  { icon: Code2, value: "4 Studio", label: "Lab Coding (SQL, JS, Py, Web)" },
  { icon: GraduationCap, value: "3 Tingkat", label: "Kelas 7, 8, dan 9 SMP" },
];

export function StatsStrip() {
  return (
    <section className="border-y border-border/60 bg-surface-alt py-6">
      <div className="mx-auto grid max-w-6xl grid-cols-2 gap-4 px-5 md:grid-cols-4">
        {authenticStats.map((s) => (
          <div key={s.label} className="flex items-center gap-3.5 border-l-2 border-primary/40 pl-4 py-1">
            <div className="min-w-0">
              <p className="font-mono text-xl sm:text-2xl font-bold tracking-tight text-foreground">{s.value}</p>
              <p className="truncate text-xs text-muted-foreground font-medium">{s.label}</p>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

/* ─── Learning paths per grade (Curriculum Hierarchy) ─── */
const paths = [
  {
    grade: 7 as const,
    title: "Kelas 7 · Fondasi Komputasi & Pemrograman Visual",
    desc: "Membangun pola berpikir komputasional, perangkat keras & OS, internet sehat, dan coding visual Scratch.",
  },
  {
    grade: 8 as const,
    title: "Kelas 8 · Logika Algoritma, Spreadsheet & Python",
    desc: "Pengolahan formula spreadsheet, arsitektur jaringan & enkripsi, serta dasar teks pemrograman Python.",
  },
  {
    grade: 9 as const,
    title: "Kelas 9 · Rekayasa Web, Database SQL & AI Terapan",
    desc: "Pemrograman web interaktif (HTML/CSS/JS), basis data SQL, literasi kecerdasan buatan, dan Praktik Lintas Bidang.",
  },
];

export function LearningPaths() {
  return (
    <section id="paths" className="py-20 bg-background">
      <div className="mx-auto max-w-6xl px-5">
        <div className="mb-12 max-w-2xl">
          <p className="font-mono text-xs font-semibold uppercase tracking-widest text-primary mb-2">Jalur Kurikulum</p>
          <h2 className="font-display text-3xl sm:text-4xl font-normal tracking-tight text-foreground leading-tight">
            Kurikulum Terstruktur Semester 1 & 2
          </h2>
          <p className="mt-3 text-sm text-muted-foreground leading-relaxed">
            Setiap modul dirancang sistematis mencakup materi konsep, video tutorial mandiri, latihan lab coding, evaluasi kuis, hingga penerbitan sertifikat digital.
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-3">
          {paths.map((p) => {
            const list = materials.filter((m) => m.grade === p.grade);
            const totalModules = list.reduce((s, m) => s + m.modules, 0);
            return (
              <div
                key={p.grade}
                className="flex flex-col justify-between rounded-xl border border-border/80 bg-card p-6 shadow-xs hover:border-primary/50 transition-colors"
              >
                <div>
                  <div className="mb-4 inline-flex items-center gap-2 rounded-md bg-secondary px-3 py-1 font-mono text-xs font-semibold text-secondary-foreground">
                    <GraduationCap className="h-3.5 w-3.5 text-primary" />
                    Kelas {p.grade} SMP
                  </div>
                  <h3 className="font-semibold text-foreground text-base leading-snug">{p.title}</h3>
                  <p className="mt-2 text-xs leading-relaxed text-muted-foreground">{p.desc}</p>

                  <div className="mt-5 space-y-1.5 border-t border-border/50 pt-4">
                    <p className="font-mono text-[11px] uppercase tracking-wider text-muted-foreground mb-2">Daftar Materi:</p>
                    {list.slice(0, 4).map((m) => (
                      <Link
                        key={m.slug}
                        to="/materi/$slug"
                        params={{ slug: m.slug }}
                        className="flex items-center gap-2 text-xs text-foreground/80 hover:text-primary transition-colors py-0.5 truncate"
                      >
                        <CheckCircle2 className="h-3.5 w-3.5 flex-shrink-0 text-primary" />
                        <span className="truncate">{m.title}</span>
                      </Link>
                    ))}
                  </div>
                </div>

                <div className="mt-6 flex items-center justify-between border-t border-border/60 pt-4 font-mono text-xs text-muted-foreground">
                  <span>{list.length} materi · {totalModules} topik</span>
                  <Link
                    to="/dashboard"
                    className="inline-flex items-center gap-1 font-sans font-semibold text-primary hover:underline"
                  >
                    Buka Kelas <ArrowRight className="h-3.5 w-3.5" />
                  </Link>
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
  {
    icon: Terminal,
    title: "Lab Coding In-Browser",
    desc: "Eksekusi kode langsung di peramban santri tanpa perlu konfigurasi lokal: Python 3 WASM, SQLite Relasional, JS, dan Web Studio.",
  },
  {
    icon: Video,
    title: "Pemutar Video Zero-Distraction",
    desc: "Player video LMS khusus tanpa iklan atau tautan keluar yang mendistraksi, dengan fitur resume otomatis & speed control.",
  },
  {
    icon: ClipboardCheck,
    title: "Kuis Interaktif & Tugas Portofolio",
    desc: "Sistem penilaian terintegrasi dengan rubrik capaian pembelajaran dan pencatatan riwayat pengerjaan santri.",
  },
  {
    icon: GraduationCap,
    title: "E-Rapor Kurikulum Merdeka",
    desc: "Rekap capaian akademik otomatis per elemen Informatika, format siap cetak PDF dengan predikat dan deskripsi kompetensi.",
  },
  {
    icon: FileBadge,
    title: "Sertifikat Digital Terverifikasi",
    desc: "Penerbitan sertifikat kelulusan modul resmi dengan nomor seri unik dan QR-code verifikasi instan.",
  },
  {
    icon: ShieldCheck,
    title: "Portal Pengajar & Multi-Role",
    desc: "Akses tersinkronisasi untuk Santri, Guru Pengampu, dan Admin Sekolah dengan kontrol presensi dan jurnal mengajar.",
  },
];

export function PlatformCapabilities() {
  return (
    <section id="platform" className="border-t border-border/60 bg-card py-20">
      <div className="mx-auto max-w-6xl px-5">
        <div className="mb-12 max-w-2xl">
          <p className="font-mono text-xs font-semibold uppercase tracking-widest text-primary mb-2">Kapabilitas Sistem</p>
          <h2 className="font-display text-3xl sm:text-4xl font-normal tracking-tight text-foreground leading-tight">
            Arsitektur Belajar Berstandar Industri
          </h2>
          <p className="mt-3 text-sm text-muted-foreground leading-relaxed">
            Dirancang secara khusus untuk santri pesantren digital dengan integrasi kurikulum terpadu dan laboratorium pemrograman langsung.
          </p>
        </div>

        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {capabilities.map((c) => (
            <div
              key={c.title}
              className="rounded-xl border border-border/80 bg-background p-6 transition-colors hover:border-primary/40"
            >
              <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <c.icon className="h-5 w-5" />
              </div>
              <h3 className="font-semibold text-foreground text-base mb-1.5">{c.title}</h3>
              <p className="text-xs leading-relaxed text-muted-foreground">{c.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ─── Role Split Showcase ─── */
export function RoleShowcase() {
  return (
    <section id="roles" className="py-20 bg-surface-alt border-t border-border/60">
      <div className="mx-auto max-w-6xl px-5">
        <div className="grid gap-6 md:grid-cols-2">
          {/* Santri Card */}
          <div className="flex flex-col justify-between rounded-xl border border-border/80 bg-card p-8 shadow-xs">
            <div>
              <div className="mb-4 inline-flex items-center gap-2 rounded-md bg-secondary px-3 py-1 font-mono text-xs font-semibold text-foreground">
                <GraduationCap className="h-4 w-4 text-primary" />
                Portal Santri
              </div>
              <h3 className="font-display text-2xl font-normal tracking-tight text-foreground mb-4">
                Dasbor Belajar & Laboratorium Mandiri
              </h3>
              <ul className="space-y-2.5 text-sm text-muted-foreground">
                <li className="flex items-start gap-2.5">
                  <CheckCircle2 className="h-4 w-4 text-primary mt-0.5 shrink-0" />
                  <span>Akses modul Informatika Kelas 7, 8, dan 9 secara berurutan.</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <CheckCircle2 className="h-4 w-4 text-primary mt-0.5 shrink-0" />
                  <span>Jalankan kode latihan langsung di browser tanpa instalasi software.</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <CheckCircle2 className="h-4 w-4 text-primary mt-0.5 shrink-0" />
                  <span>Kerjakan kuis dan unduh sertifikat kelulusan digital resmi.</span>
                </li>
              </ul>
            </div>
            <Link
              to="/dashboard"
              className="mt-8 inline-flex items-center gap-2 font-semibold text-sm text-primary hover:underline"
            >
              Masuk Dasbor Santri <ArrowRight className="h-4 w-4" />
            </Link>
          </div>

          {/* Guru Card */}
          <div className="flex flex-col justify-between rounded-xl border border-border/80 bg-card p-8 shadow-xs">
            <div>
              <div className="mb-4 inline-flex items-center gap-2 rounded-md bg-secondary px-3 py-1 font-mono text-xs font-semibold text-foreground">
                <ShieldCheck className="h-4 w-4 text-primary" />
                Portal Pengajar & Administrator
              </div>
              <h3 className="font-display text-2xl font-normal tracking-tight text-foreground mb-4">
                Manajemen Kurikulum, Presensi & Rapor
              </h3>
              <ul className="space-y-2.5 text-sm text-muted-foreground">
                <li className="flex items-start gap-2.5">
                  <CheckCircle2 className="h-4 w-4 text-primary mt-0.5 shrink-0" />
                  <span>Kelola jadwal tatap muka, input absensi, dan jurnal harian guru.</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <CheckCircle2 className="h-4 w-4 text-primary mt-0.5 shrink-0" />
                  <span>Pantau analitik ketuntasan santri per modul dan per kelas.</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <CheckCircle2 className="h-4 w-4 text-primary mt-0.5 shrink-0" />
                  <span>Generate E-Rapor Kurikulum Merdeka otomatis siap cetak.</span>
                </li>
              </ul>
            </div>
            <Link
              to="/admin"
              className="mt-8 inline-flex items-center gap-2 font-semibold text-sm text-primary hover:underline"
            >
              Masuk Panel Pengajar <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ─── FAQ Section ─── */
const faqs = [
  {
    q: "Apakah santri perlu menginstal editor kode seperti VS Code di komputer?",
    a: "Tidak perlu. Digisschool LMS telah dilengkapi dengan Laboratorium Coding In-Browser yang mendukung Python 3 WASM, SQL SQLite, HTML/CSS/JS, dan Scratch secara langsung di peramban.",
  },
  {
    q: "Bagaimana cara mendapatkan sertifikat digital setelah menyelesaikan modul?",
    a: "Sertifikat diterbitkan secara otomatis setelah santri menuntaskan seluruh video pembelajaran (>90%), membaca rangkuman, dan lulus kuis evaluasi dengan nilai di atas KKM.",
  },
  {
    q: "Apakah data progres santri tersinkronisasi saat belajar di HP dan Laptop?",
    a: "Ya. Seluruh progres materi, catatan refleksi, dan submission tugas tersimpan aman di cloud database Turso/LibSQL dan Supabase secara real-time.",
  },
];

export function FaqSection() {
  return (
    <section id="faq" className="py-20 bg-background border-t border-border/60">
      <div className="max-w-4xl mx-auto px-5">
        <div className="mb-10 text-center">
          <p className="font-mono text-xs font-semibold uppercase tracking-widest text-primary mb-2">Tanya Jawab</p>
          <h2 className="font-display text-3xl sm:text-4xl font-normal tracking-tight text-foreground">
            Pertanyaan yang Sering Diajukan
          </h2>
        </div>

        <Accordion type="single" collapsible className="w-full space-y-3">
          {faqs.map((f, i) => (
            <AccordionItem key={i} value={`item-${i}`} className="rounded-xl border border-border/80 bg-card px-5">
              <AccordionTrigger className="text-left font-semibold text-sm text-foreground hover:no-underline">
                {f.q}
              </AccordionTrigger>
              <AccordionContent className="text-xs text-muted-foreground leading-relaxed pt-1 pb-4">
                {f.a}
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </div>
    </section>
  );
}
