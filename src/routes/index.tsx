import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import {
  Infinity as InfinityIcon, Flame, CalendarDays, Moon, Bell, BarChart3, CloudUpload,
  CheckCircle2, TrendingUp, Sparkles, ArrowRight, Star, Quote, Code2, Terminal,
} from "lucide-react";
import heroBg from "@/assets/hero-bg.jpg";
import shadowBg from "@/assets/shadow-bg.jpg";
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
      { title: "Continuum LMS — Belajar konsisten setiap hari" },
      { name: "description", content: "Platform belajar online yang tenang dan fokus. Ikuti kelas, pantau progres belajar, dan jaga rutinitas belajar harian Anda." },
    ],
  }),
});

function LandingPage() {
  const navigate = useNavigate();
  const [checked, setChecked] = useState(false);

  useEffect(() => {
    import("@/integrations/supabase/client").then(({ supabase }) => {
      supabase.auth.getSession().then(({ data: { session } }) => {
        if (session?.user) {
          navigate({ to: "/dashboard" });
        } else {
          setChecked(true);
        }
      });
    }).catch(() => setChecked(true));
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
    <section className="py-20 bg-muted/30 border-y border-border/60 relative overflow-hidden">
      <div className="max-w-6xl mx-auto px-5">
        <div className="text-center mb-10 max-w-2xl mx-auto">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary border border-primary/20 mb-3">
            <Code2 className="w-3.5 h-3.5" />
            <span className="font-mono text-xs font-semibold uppercase tracking-wider">Laboratorium Live</span>
          </div>
          <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-foreground">
            Coba Langsung Coding di Browser
          </h2>
          <p className="mt-3 text-sm text-muted-foreground leading-relaxed">
            Tanpa perlu instalasi software rumit. Tulis, modifikasi, dan jalankan kode HTML, CSS, JavaScript, atau Python langsung di peramban Anda.
          </p>
        </div>

        <InteractiveCodingSandbox />
      </div>
    </section>
  );
}



/* ─── Features ─── */
const features = [
  { icon: Flame, title: "Rangkaian hari belajar", desc: "Lihat momentum belajar Anda tumbuh setiap hari. Jangan putus rantainya." },
  { icon: CalendarDays, title: "Kalender belajar", desc: "Lihat konsistensi belajar Anda dalam tampilan 30 hari yang rapi." },
  { icon: BarChart3, title: "Analitik belajar", desc: "Rangkaian hari, rekor terpanjang, dan tingkat penyelesaian materi." },
  { icon: Bell, title: "Pengingat belajar", desc: "Atur jam pengingat agar tidak pernah melewatkan jadwal belajar." },
  { icon: Moon, title: "Mode gelap", desc: "Nyaman di mata, siang atau malam. Mengikuti sistem atau pilihan Anda." },
  { icon: CloudUpload, title: "Sinkron antar perangkat", desc: "Masuk untuk menyinkronkan kelas dan progres di semua perangkat." },
];

function Features() {
  const { settings } = useSiteSettings();
  const items = settings.features.map((f, i) => ({ ...f, icon: features[i % features.length].icon }));

  return (
    <section id="features" className="py-24 relative bg-background border-t border-border/50">
      <div className="max-w-6xl mx-auto px-5 relative">
        <div className="flex flex-col lg:flex-row items-start gap-12 lg:gap-16">
          {/* Left: Authentic App Preview Card (No fake browser chrome) */}
          <div className="w-full lg:w-[440px] shrink-0">
            <div className="rounded-2xl bg-card border border-border/80 p-6 shadow-sm">
              <div className="flex items-center justify-between border-b border-border/60 pb-4 mb-5">
                <div>
                  <span className="font-mono text-[11px] uppercase tracking-wider text-muted-foreground">Rutinitas Harian</span>
                  <h4 className="font-bold text-foreground text-base mt-0.5">Target Belajar Hari Ini</h4>
                </div>
                <span className="font-mono text-xs font-semibold px-2 py-1 rounded-md bg-primary/10 text-primary border border-primary/20">
                  2/4 Selesai
                </span>
              </div>

              {/* Progress Bar & Metric */}
              <div className="rounded-xl bg-secondary/50 p-4 mb-5 border border-border/40">
                <div className="flex justify-between items-center text-xs font-mono text-muted-foreground mb-2">
                  <span>Momentum Belajar</span>
                  <span className="font-bold text-foreground">50%</span>
                </div>
                <div className="h-2 w-full rounded-full bg-secondary overflow-hidden">
                  <div className="h-full rounded-full bg-primary transition-all duration-500" style={{ width: "50%" }} />
                </div>
              </div>

              {/* Habit / Module Items */}
              <div className="space-y-2.5">
                {[
                  { name: "Menonton video modul 1", done: true },
                  { name: "Membaca ringkasan bab 2", done: true },
                  { name: "Latihan kuis 15 soal", done: false },
                  { name: "Catatan refleksi belajar", done: false },
                ].map((h) => (
                  <div
                    key={h.name}
                    className="flex items-center justify-between gap-3 rounded-xl border border-border/60 bg-background/60 px-4 py-3 text-sm transition-colors hover:border-primary/30"
                  >
                    <span className={h.done ? "line-through text-muted-foreground" : "font-medium text-foreground"}>
                      {h.name}
                    </span>
                    <div className={`w-5 h-5 rounded-md border flex items-center justify-center ${h.done ? "bg-primary border-primary text-primary-foreground" : "border-border text-transparent"}`}>
                      <CheckCircle2 className="w-3.5 h-3.5" />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Right: Features content */}
          <div className="flex-1">
            <div className="mb-10">
              <span className="font-mono text-xs font-semibold uppercase tracking-widest text-primary mb-2 block">Fitur Utama</span>
              <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-foreground leading-[1.15]">
                Dirancang untuk Fokus,<br />Tanpa Distraksi yang Tidak Perlu
              </h2>
              <p className="mt-3 text-muted-foreground text-sm leading-relaxed max-w-xl">
                Setiap fitur dibangun untuk memelihara konsistensi belajar Anda setiap hari dengan visual yang tenang dan terarah.
              </p>
            </div>

            <div className="grid sm:grid-cols-2 gap-4">
              {items.map((f) => (
                <div
                  key={f.title}
                  className="group rounded-2xl border border-border/70 bg-card p-5 transition-all duration-200 hover:border-primary/40 hover:shadow-xs"
                >
                  <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center mb-3 group-hover:scale-105 transition-transform duration-200">
                    <f.icon className="w-5 h-5" />
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
  { num: "01", icon: CheckCircle2, title: "Pilih Materi & Kelas", desc: "Pilih kurikulum terstruktur sesuai tingkatan kelas atau topik yang ingin dipelajari." },
  { num: "02", icon: Sparkles, title: "Selesaikan Modul & Kuis", desc: "Ikuti langkah pembelajaran bertahap, uji pemahaman lewat kuis interaktif." },
  { num: "03", icon: TrendingUp, title: "Raih Capaian & Sertifikat", desc: "Pantau momentum hari belajar, kumpulkan sertifikat kompetensi resmi." },
];

function HowItWorks() {
  return (
    <section id="how-it-works" className="py-24 bg-surface-alt border-y border-border/60">
      <div className="max-w-5xl mx-auto px-5">
        <div className="text-center mb-16 max-w-2xl mx-auto">
          <span className="font-mono text-xs font-semibold uppercase tracking-widest text-primary mb-2 block">Alur Pembelajaran</span>
          <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-foreground leading-[1.15]">
            Tiga Langkah Membangun Keahlian
          </h2>
          <p className="mt-3 text-muted-foreground text-sm">
            Kurikulum yang dirancang sistematis dari fondasi konsep hingga evaluasi akhir.
          </p>
        </div>

        <div className="relative grid md:grid-cols-3 gap-6">
          {steps.map((s) => (
            <div key={s.num} className="relative rounded-2xl border border-border/70 bg-card p-6 shadow-xs flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-4">
                  <span className="font-mono text-2xl font-bold text-primary">{s.num}</span>
                  <div className="w-9 h-9 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
                    <s.icon className="w-4 h-4" />
                  </div>
                </div>
                <h3 className="font-semibold text-foreground text-base mb-2">{s.title}</h3>
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
    <section id="reviews" className="py-24 bg-background">
      <div className="max-w-5xl mx-auto px-5">
        <div className="text-center mb-16 max-w-2xl mx-auto">
          <span className="font-mono text-xs font-semibold uppercase tracking-widest text-primary mb-2 block">Ulasan</span>
          <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-foreground leading-[1.15]">
            Dipercaya Oleh Para Pembelajar
          </h2>
        </div>

        <div className="grid sm:grid-cols-2 gap-5">
          {settings.reviews.map((r) => (
            <div key={r.name} className="relative rounded-2xl border border-border/70 bg-card p-6 shadow-xs">
              <div className="flex gap-1 mb-4">
                {Array.from({ length: 5 }).map((_, j) => (
                  <Star key={j} className="w-4 h-4 fill-primary text-primary" />
                ))}
              </div>
              <p className="text-sm text-foreground leading-relaxed mb-6">"{r.quote}"</p>
              <div className="flex items-center gap-3 pt-4 border-t border-border/50">
                <img src={r.avatar} alt={r.name} className="w-10 h-10 rounded-full object-cover border border-border" loading="lazy" />
                <div>
                  <p className="text-sm font-semibold text-foreground">{r.name}</p>
                  <p className="text-xs text-muted-foreground font-mono">{r.role}</p>
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
    <section className="relative overflow-hidden py-24 bg-zinc-950 text-white border-t border-zinc-800">
      <div className="relative z-10 max-w-3xl mx-auto px-5 text-center">
        <span className="font-mono text-xs font-semibold uppercase tracking-widest text-primary mb-3 block">Mulai Sekarang</span>
        <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold tracking-tight text-white leading-[1.15]">
          {settings.cta.title}
        </h2>
        <p className="mt-4 text-zinc-300 max-w-lg mx-auto text-sm sm:text-base leading-relaxed">
          {settings.cta.desc}
        </p>
        <div className="mt-8 flex justify-center">
          <Link
            to="/login"
            className="inline-flex items-center gap-2 rounded-xl bg-primary text-primary-foreground font-semibold px-8 py-3.5 text-sm hover:brightness-105 transition-all duration-200 active:scale-[0.98] shadow-lg shadow-primary/25"
          >
            {settings.cta.button}
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>
    </section>
  );
}
