import { useCallback, useEffect, useRef, useState } from "react";
import { ChevronLeft, ChevronRight, Clock, PlayCircle, Sparkles } from "lucide-react";
import course1 from "@/assets/course-1.jpg";
import course2 from "@/assets/course-2.jpg";
import course3 from "@/assets/course-3.jpg";
import course4 from "@/assets/course-4.jpg";

const AUTOPLAY_MS = 4500;

const courses = [
  { image: course1, title: "Berpikir Komputasional & Logika", level: "Kelas 7 SMP", modules: 6, duration: "4,5 jam", tag: "Fase D Dasar" },
  { image: course2, title: "Dasar Pemrograman Visual (Scratch)", level: "Kelas 7 SMP", modules: 6, duration: "6 jam", tag: "Game & Animasi" },
  { image: course3, title: "Analisis Data & Spreadsheet", level: "Kelas 8 SMP", modules: 6, duration: "6 jam", tag: "Formula & Chart" },
  { image: course4, title: "Pemrograman Web (HTML, CSS & JS)", level: "Kelas 9 SMP", modules: 6, duration: "7 jam", tag: "Web Interaktif" },
];

export function CourseCarousel() {
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const [step, setStep] = useState(250);
  const dragX = useRef<number | null>(null);

  useEffect(() => {
    const update = () => setStep(window.innerWidth < 640 ? 160 : window.innerWidth < 1024 ? 220 : 260);
    update();
    window.addEventListener("resize", update);
    return () => window.removeEventListener("resize", update);
  }, []);

  const go = useCallback((next: number) => {
    setIndex((next + courses.length) % courses.length);
  }, []);

  useEffect(() => {
    if (paused) return;
    const t = setTimeout(() => go(index + 1), AUTOPLAY_MS);
    return () => clearTimeout(t);
  }, [index, paused, go]);

  return (
    <section id="courses" className="py-24 bg-surface-alt border-y border-border/60 overflow-hidden relative">
      {/* Background radial glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[300px] bg-primary/5 blur-3xl rounded-full pointer-events-none" />

      {/* Centered Header */}
      <div className="max-w-4xl mx-auto px-5 text-center mb-12">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary/10 text-primary border border-primary/20 text-xs font-mono font-semibold uppercase tracking-widest mb-3">
          <Sparkles className="w-3.5 h-3.5" />
          Kurikulum Pilihan
        </div>
        <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-foreground leading-tight">
          Jelajahi Kelas Unggulan Informatika SMP
        </h2>
        <p className="mt-3 text-sm text-muted-foreground max-w-xl mx-auto leading-relaxed">
          Pilihan modul unggulan berbasis proyek nyata untuk mengasah kompetensi digital, logika komputasi, dan rekayasa perangkat lunak.
        </p>
      </div>

      {/* Perfectly Centered 3D Coverflow Track */}
      <div
        className="relative h-[430px] sm:h-[480px] w-full max-w-6xl mx-auto overflow-hidden flex items-center justify-center"
        style={{ perspective: "1200px" }}
        onMouseEnter={() => setPaused(true)}
        onMouseLeave={() => setPaused(false)}
        onTouchStart={(e) => { dragX.current = e.touches[0].clientX; }}
        onTouchEnd={(e) => {
          if (dragX.current === null) return;
          const dx = e.changedTouches[0].clientX - dragX.current;
          if (Math.abs(dx) > 50) go(index + (dx < 0 ? 1 : -1));
          dragX.current = null;
        }}
        aria-roledescription="carousel"
      >
        {courses.map((c, i) => {
          let offset = i - index;
          const half = Math.floor(courses.length / 2);
          if (offset > half) offset -= courses.length;
          if (offset < -half) offset += courses.length;
          const abs = Math.abs(offset);
          const isActive = offset === 0;

          return (
            <button
              key={c.title}
              onClick={() => (isActive ? undefined : go(i))}
              aria-hidden={abs > 2}
              className="absolute left-1/2 top-1/2 w-[270px] sm:w-[310px] rounded-3xl overflow-hidden text-left transition-all duration-[600ms] ease-[cubic-bezier(0.16,1,0.3,1)] focus-visible:ring-2 focus-visible:ring-primary focus:outline-none"
              style={{
                transform: `translate(-50%, -50%) translateX(${offset * step}px) scale(${isActive ? 1.05 : 0.85 - (abs - 1) * 0.08}) rotateY(${offset * -14}deg)`,
                opacity: abs > 2 ? 0 : isActive ? 1 : 0.45,
                zIndex: 20 - abs,
                filter: isActive ? "none" : "saturate(0.6) brightness(0.9)",
                boxShadow: isActive
                  ? "0 25px 60px -15px rgba(0,0,0,0.4)"
                  : "0 10px 25px -10px rgba(0,0,0,0.15)",
                pointerEvents: abs > 2 ? "none" : "auto",
              }}
            >
              <div className="relative h-[360px] sm:h-[420px] rounded-3xl overflow-hidden border border-white/10">
                <img
                  src={c.image}
                  alt={c.title}
                  width={1024}
                  height={1280}
                  loading="lazy"
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-zinc-950/95 via-zinc-950/40 to-transparent" />

                {isActive && (
                  <div className="absolute top-4 left-4 inline-flex items-center gap-1.5 rounded-full bg-primary text-primary-foreground px-3 py-1 text-[11px] font-mono font-bold shadow-md">
                    <PlayCircle className="w-3.5 h-3.5 fill-current" />
                    {c.tag}
                  </div>
                )}

                <div className="absolute bottom-0 left-0 right-0 p-6">
                  <span className="font-mono text-[11px] font-bold uppercase tracking-wider text-amber-400">
                    {c.level}
                  </span>
                  <h3 className="mt-1 text-lg sm:text-xl font-bold text-white leading-tight">
                    {c.title}
                  </h3>
                  <div className="mt-3 flex items-center gap-4 text-xs font-mono text-zinc-300">
                    <span className="bg-white/10 px-2 py-0.5 rounded-md">{c.modules} modul</span>
                    <span className="inline-flex items-center gap-1">
                      <Clock className="w-3 h-3 text-primary" />
                      {c.duration}
                    </span>
                  </div>

                  {/* Autoplay Progress Line */}
                  <div
                    className="mt-4 h-[3px] rounded-full bg-white/20 overflow-hidden"
                    style={{ opacity: isActive ? 1 : 0 }}
                  >
                    <div
                      className={`h-full bg-primary rounded-full ${isActive && !paused ? "animate-slider-progress" : ""}`}
                      style={{ ["--slider-duration" as string]: `${AUTOPLAY_MS}ms` }}
                    />
                  </div>
                </div>
              </div>
            </button>
          );
        })}
      </div>

      {/* Centered Controls & Indicator Dots */}
      <div className="flex items-center justify-center gap-4 mt-6">
        <button
          onClick={() => go(index - 1)}
          aria-label="Kelas sebelumnya"
          className="w-10 h-10 rounded-2xl border border-border/80 bg-card text-foreground flex items-center justify-center hover:bg-secondary transition-all active:scale-95 shadow-xs"
        >
          <ChevronLeft className="w-4 h-4" />
        </button>

        <div className="flex items-center gap-2">
          {courses.map((c, i) => (
            <button
              key={c.title}
              onClick={() => go(i)}
              aria-label={`Ke kelas ${i + 1}`}
              aria-current={i === index}
              className={`h-2.5 rounded-full transition-all duration-300 ${
                i === index ? "w-8 bg-primary" : "w-2.5 bg-border hover:bg-primary/50"
              }`}
            />
          ))}
        </div>

        <button
          onClick={() => go(index + 1)}
          aria-label="Kelas berikutnya"
          className="w-10 h-10 rounded-2xl border border-border/80 bg-card text-foreground flex items-center justify-center hover:bg-secondary transition-all active:scale-95 shadow-xs"
        >
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>
    </section>
  );
}
