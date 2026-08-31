import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import {
  Flame,
  CalendarDays,
  Moon,
  Bell,
  BarChart3,
  CloudUpload,
  CheckCircle2,
  TrendingUp,
  ArrowRight,
  Star,
  Code2,
  BookOpen,
} from "lucide-react";
import { HeroBanner } from "@/components/HeroBanner";
import { CourseCarousel } from "@/components/CourseCarousel";
import { MaterialsGrid } from "@/components/MaterialsGrid";
import { SiteFooter } from "@/components/SiteFooter";
import { SiteHeader } from "@/components/SiteHeader";
import {
  StatsStrip,
  LearningPaths,
  PlatformCapabilities,
  RoleShowcase,
  FaqSection,
} from "@/components/LmsSections";
import { useSiteSettings } from "@/lib/site-settings";
import { InteractiveCodingSandbox } from "@/components/lms/InteractiveCodingSandbox";

export const Route = createFileRoute("/")({
  component: LandingPage,
  head: () => ({
    meta: [
      { title: "Digisschool LMS — Platform Pembelajaran Digital Terpadu" },
      {
        name: "description",
        content:
          "Platform belajar online santri Digital Islamic Boarding School. Ikuti kelas kurikulum merdeka, lab coding in-browser, dan pantau progres belajar.",
      },
    ],
  }),
});

function LandingPage() {
  const navigate = useNavigate();
  const [checked, setChecked] = useState(false);

  useEffect(() => {
    import("@/integrations/supabase/client")
      .then(({ supabase }) => {
        supabase.auth.getSession().then(({ data: { session } }) => {
          if (session?.user) {
            navigate({ to: "/dashboard" });
          } else {
            setChecked(true);
          }
        });
      })
      .catch(() => setChecked(true));
  }, [navigate]);

  return (
    <div className="min-h-screen bg-background text-foreground">
      <SiteHeader />
      <HeroBanner />
      <StatsStrip />
      <CourseCarousel />
      <LiveSandboxShowcase />
      <MaterialsGrid />
      <LearningPaths />
      <PlatformCapabilities />
      <Features />
      <RoleShowcase />
      <HowItWorks />
      <Reviews />
      <FaqSection />
      <FinalCTA />
      <SiteFooter />
    </div>
  );
}

/* ─── Live Sandbox Showcase ─── */
function LiveSandboxShowcase() {
  return (
    <section className="py-20 bg-surface-alt border-y border-border/60 relative overflow-hidden">
      <div className="max-w-6xl mx-auto px-5">
        <div className="text-center mb-10 max-w-2xl mx-auto">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-md bg-secondary text-secondary-foreground border border-border/80 mb-3 font-mono text-xs font-semibold uppercase tracking-wider">
            <Code2 className="w-3.5 h-3.5 text-primary" />
            <span>Laboratorium Mandiri</span>
          </div>
          <h2 className="font-display text-3xl sm:text-4xl font-normal tracking-tight text-foreground">
            Coba Langsung Coding di Browser
          </h2>
          <p className="mt-3 text-sm text-muted-foreground leading-relaxed">
            Tanpa perlu instalasi software rumit. Tulis, modifikasi, dan jalankan kode SQL, Python 3 WASM, JavaScript, atau HTML/CSS langsung di peramban Anda.
          </p>
        </div>

        <InteractiveCodingSandbox />
      </div>
    </section>
  );
}

/* ─── Features ─── */
const features = [
  { icon: Flame, title: "Rangkaian hari belajar", desc: "Lihat momentum belajar santri tumbuh setiap hari dengan streak tercatat rapi." },
  { icon: CalendarDays, title: "Kalender belajar", desc: "Tampilan riwayat konsistensi belajar dalam rentang 30 hari kalender." },
  { icon: BarChart3, title: "Analitik belajar", desc: "Pantau rekor terpanjang dan persentase ketuntasan kurikulum per semester." },
  { icon: Bell, title: "Pengingat jadwal", desc: "Notifikasi kelas tatap muka dan batas waktu pengumpulan tugas portofolio." },
  { icon: Moon, title: "Mode kontras santri", desc: "Nyaman di mata saat belajar siang maupun malam dengan tema Clean Paper & Charcoal." },
  { icon: CloudUpload, title: "Sinkronisasi awan", desc: "Akses materi dan lab coding dari Laptop maupun HP santri secara mulus." },
];

function Features() {
  const { settings } = useSiteSettings();
  const items = settings.features.map((f, i) => ({ ...f, icon: features[i % features.length].icon }));

  return (
    <section id="features" className="py-20 relative bg-background border-t border-border/60">
      <div className="max-w-6xl mx-auto px-5 relative">
        <div className="flex flex-col lg:flex-row items-start gap-12 lg:gap-16">
          {/* Left: Authentic App Preview Card */}
          <div className="w-full lg:w-[440px] shrink-0">
            <div className="rounded-xl bg-card border border-border/80 p-6 shadow-xs">
              <div className="flex items-center justify-between border-b border-border/60 pb-4 mb-5">
                <div>
                  <span className="font-mono text-[11px] uppercase tracking-wider text-muted-foreground">Rutinitas Harian</span>
                  <h4 className="font-semibold text-foreground text-base mt-0.5">Target Belajar Hari Ini</h4>
                </div>
                <span className="font-mono text-xs font-semibold px-2.5 py-1 rounded-md bg-secondary text-foreground">
                  2/4 Selesai
                </span>
              </div>

              {/* Progress Bar & Metric */}
              <div className="rounded-lg bg-surface-alt p-4 mb-5 border border-border/60">
                <div className="flex justify-between items-center text-xs font-mono text-muted-foreground mb-2">
                  <span>Momentum Belajar</span>
                  <span className="font-bold text-foreground tabular-nums">50%</span>
                </div>
                <div className="h-2 w-full rounded-full bg-secondary overflow-hidden">
                  <div className="h-full rounded-full bg-primary transition-all duration-500" style={{ width: "50%" }} />
                </div>
              </div>

              {/* Habit / Module Items */}
              <div className="space-y-2">
                {[
                  { name: "Menonton video modul 1", done: true },
                  { name: "Membaca ringkasan bab 2", done: true },
                  { name: "Latihan lab coding 15 menit", done: false },
                  { name: "Catatan refleksi belajar", done: false },
                ].map((h) => (
                  <div
                    key={h.name}
                    className="flex items-center justify-between gap-3 rounded-lg border border-border/60 bg-background px-4 py-2.5 text-xs transition-colors hover:border-primary/40"
                  >
                    <span className={h.done ? "line-through text-muted-foreground" : "font-medium text-foreground"}>
                      {h.name}
                    </span>
                    <div className={`w-4 h-4 rounded-sm border flex items-center justify-center ${h.done ? "bg-primary border-primary text-primary-foreground" : "border-border text-transparent"}`}>
                      <CheckCircle2 className="w-3.5 h-3.5" />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Right: Features content */}
          <div className="flex-1">
            <div className="mb-8">
              <span className="font-mono text-xs font-semibold uppercase tracking-widest text-primary mb-2 block">Fitur Inti</span>
              <h2 className="font-display text-3xl sm:text-4xl font-normal tracking-tight text-foreground leading-tight">
                Dirancang untuk Fokus & Ketuntasan Belajar
              </h2>
              <p className="mt-3 text-muted-foreground text-sm leading-relaxed max-w-xl">
                Setiap komponen dibangun untuk memelihara konsistensi belajar santri setiap hari dengan visual yang tenang dan terarah.
              </p>
            </div>

            <div className="grid sm:grid-cols-2 gap-4">
              {items.map((f) => (
                <div
                  key={f.title}
                  className="rounded-xl border border-border/80 bg-card p-5 transition-colors hover:border-primary/40"
                >
                  <div className="w-9 h-9 rounded-lg bg-primary/10 text-primary flex items-center justify-center mb-3">
                    <f.icon className="w-4 h-4" />
                  </div>
                  <h3 className="font-semibold text-foreground text-sm mb-1">{f.title}</h3>
                  <p className="text-xs text-muted-foreground leading-relaxed">{f.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ─── How it works ─── */
const steps = [
  { num: "01", icon: BookOpen, title: "Pilih Modul & Kelas", desc: "Pilih kurikulum Informatika Kelas 7, 8, atau 9 sesuai tingkat dan semester berjalan." },
  { num: "02", icon: Code2, title: "Tonton & Praktik Coding", desc: "Pelajari materi video terarah dan langsung uji pemahaman di laboratorium coding in-browser." },
  { num: "03", icon: TrendingUp, title: "Evaluasi & E-Rapor", desc: "Selesaikan kuis uji kompetensi dan klaim sertifikat digital serta rekap capaian akademik." },
];

function HowItWorks() {
  return (
    <section id="how-it-works" className="py-20 bg-surface-alt border-y border-border/60">
      <div className="max-w-5xl mx-auto px-5">
        <div className="text-center mb-12 max-w-2xl mx-auto">
          <span className="font-mono text-xs font-semibold uppercase tracking-widest text-primary mb-2 block">Metodologi</span>
          <h2 className="font-display text-3xl sm:text-4xl font-normal tracking-tight text-foreground">
            Tiga Langkah Membangun Kompetensi
          </h2>
          <p className="mt-3 text-muted-foreground text-sm">
            Kurikulum yang dirancang bertahap dari fondasi konsep hingga evaluasi proyek nyata.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-5">
          {steps.map((s) => (
            <div key={s.num} className="rounded-xl border border-border/80 bg-card p-6 shadow-xs flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-4">
                  <span className="font-mono text-2xl font-bold text-primary">{s.num}</span>
                  <div className="w-8 h-8 rounded-md bg-secondary text-primary flex items-center justify-center">
                    <s.icon className="w-4 h-4" />
                  </div>
                </div>
                <h3 className="font-semibold text-foreground text-sm mb-1.5">{s.title}</h3>
                <p className="text-xs text-muted-foreground leading-relaxed">{s.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ─── Reviews ─── */
function Reviews() {
  const { settings } = useSiteSettings();

  return (
    <section id="reviews" className="py-20 bg-background">
      <div className="max-w-5xl mx-auto px-5">
        <div className="text-center mb-12 max-w-2xl mx-auto">
          <span className="font-mono text-xs font-semibold uppercase tracking-widest text-primary mb-2 block">Testimoni</span>
          <h2 className="font-display text-3xl sm:text-4xl font-normal tracking-tight text-foreground">
            Pengalaman Belajar Santri & Ustadz
          </h2>
        </div>

        <div className="grid sm:grid-cols-2 gap-5">
          {settings.reviews.map((r) => (
            <div key={r.name} className="rounded-xl border border-border/80 bg-card p-6 shadow-xs">
              <div className="flex gap-1 mb-3">
                {Array.from({ length: 5 }).map((_, j) => (
                  <Star key={j} className="w-3.5 h-3.5 fill-primary text-primary" />
                ))}
              </div>
              <p className="text-xs text-foreground leading-relaxed mb-5">"{r.quote}"</p>
              <div className="flex items-center gap-3 pt-3 border-t border-border/60">
                <img src={r.avatar} alt={r.name} className="w-9 h-9 rounded-full object-cover border border-border" loading="lazy" />
                <div>
                  <p className="text-xs font-semibold text-foreground">{r.name}</p>
                  <p className="text-[11px] text-muted-foreground font-mono">{r.role}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ─── Final CTA ─── */
function FinalCTA() {
  const { settings } = useSiteSettings();

  return (
    <section className="py-20 bg-zinc-950 text-white border-t border-zinc-800">
      <div className="max-w-3xl mx-auto px-5 text-center">
        <span className="font-mono text-xs font-semibold uppercase tracking-widest text-primary mb-2 block">Mulai Belajar</span>
        <h2 className="font-display text-3xl sm:text-4xl font-normal tracking-tight text-white leading-tight">
          {settings.cta.title}
        </h2>
        <p className="mt-3 text-zinc-400 max-w-lg mx-auto text-xs sm:text-sm leading-relaxed">
          {settings.cta.desc}
        </p>
        <div className="mt-7 flex justify-center">
          <Link
            to="/login"
            className="inline-flex items-center gap-2 rounded-lg bg-primary text-primary-foreground font-semibold px-6 py-3 text-sm hover:brightness-105 transition-all duration-200 active:scale-[0.98] shadow-xs"
          >
            {settings.cta.button}
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>
    </section>
  );
}
