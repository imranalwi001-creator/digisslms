import { Link } from "@tanstack/react-router";
import { useState } from "react";
import { BookOpen, Clock, Layers, Sparkles, ArrowRight, PlayCircle } from "lucide-react";
import { useCatalog } from "@/lib/materials-db";

const grades = [7, 8, 9] as const;

export function MaterialsGrid() {
  const [active, setActive] = useState<7 | 8 | 9 | "all">("all");
  const [semester, setSemester] = useState<1 | 2 | "all">("all");
  const { list: catalog } = useCatalog();
  const list = catalog.filter(
    (m) => (active === "all" || m.grade === active) && (semester === "all" || m.semester === semester),
  );

  return (
    <section id="materials" className="py-28 bg-background relative overflow-hidden">
      {/* Subtle Background Glow */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-primary/5 rounded-full blur-3xl pointer-events-none" />

      <div className="max-w-6xl mx-auto px-5 relative z-10">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-6 mb-12">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary border border-primary/20 mb-3">
              <Sparkles className="w-3.5 h-3.5" />
              <span className="font-mono text-xs font-bold uppercase tracking-widest">Katalog Kurikulum</span>
            </div>
            <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-foreground" style={{ lineHeight: "1.15" }}>
              Materi Informatika Kelas 7, 8 & 9
            </h2>
            <p className="mt-2 text-sm text-muted-foreground max-w-xl">
              Eksplorasi 8 elemen Kurikulum Merdeka Informatika dengan video interaktif, kuis, dan simulasi lab coding.
            </p>
          </div>

          {/* Filter Pills */}
          <div className="flex flex-wrap items-center gap-2">
            {(["all", ...grades] as const).map((g) => (
              <button
                key={g}
                onClick={() => setActive(g)}
                className={`rounded-full px-4 py-2 text-xs sm:text-sm font-semibold border transition-all duration-200 active:scale-95 shadow-2xs ${
                  active === g
                    ? "bg-primary text-primary-foreground border-primary shadow-md shadow-primary/20 font-bold"
                    : "bg-card text-muted-foreground border-border hover:bg-accent/40 hover:text-foreground"
                }`}
              >
                {g === "all" ? "Semua Kelas" : `Kelas ${g}`}
              </button>
            ))}
            <span className="mx-1 hidden h-5 w-px bg-border sm:block" />
            {(["all", 1, 2] as const).map((s) => (
              <button
                key={`sem-${s}`}
                onClick={() => setSemester(s)}
                className={`rounded-full px-4 py-2 text-xs sm:text-sm font-semibold border transition-all duration-200 active:scale-95 ${
                  semester === s
                    ? "bg-secondary text-secondary-foreground border-secondary font-bold"
                    : "bg-card text-muted-foreground border-border hover:bg-accent/40 hover:text-foreground"
                }`}
              >
                {s === "all" ? "Semua Semester" : `Semester ${s}`}
              </button>
            ))}
          </div>
        </div>

        {/* Minimalist Full-Bleed Thumbnail Grid */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-7">
          {list.map((m) => (
            <Link
              key={m.slug}
              to="/materi/$slug"
              params={{ slug: m.slug }}
              className="group relative flex flex-col aspect-[4/3] rounded-3xl overflow-hidden border border-border/80 bg-slate-950 shadow-md hover:shadow-2xl hover:shadow-primary/20 hover:border-primary/50 hover:-translate-y-1.5 transition-all duration-500 cursor-pointer"
            >
              {/* Full Background Image with Zoom on Hover */}
              <img
                src={m.image}
                alt={`Thumbnail materi ${m.subject} kelas ${m.grade}: ${m.title}`}
                width={768}
                height={576}
                loading="lazy"
                className="absolute inset-0 w-full h-full object-cover transform scale-100 group-hover:scale-108 transition-transform duration-700 ease-out"
              />

              {/* Multi-layered Cinematic Gradient Overlay */}
              <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/65 to-slate-950/20 opacity-95 group-hover:opacity-90 transition-opacity duration-300" />
              <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-transparent to-transparent opacity-80" />

              {/* Card Container Inner Layout */}
              <div className="relative z-10 p-5 sm:p-6 flex flex-col justify-between h-full">
                {/* Top Floating Glassmorphism Bar */}
                <div className="flex items-center justify-between gap-2">
                  <span className="font-mono text-[11px] font-bold uppercase tracking-wider px-3 py-1 rounded-full bg-black/45 backdrop-blur-md text-white border border-white/20 shadow-xs flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
                    Kelas {m.grade} {m.semester ? `· Sem ${m.semester}` : ""}
                  </span>

                  <span className="font-mono text-[11px] font-medium text-white/90 px-2.5 py-1 rounded-full bg-white/10 backdrop-blur-md border border-white/15 shadow-xs flex items-center gap-1">
                    <Clock className="w-3 h-3 text-amber-300" />
                    {m.duration}
                  </span>
                </div>

                {/* Bottom Dynamic Title Overlay */}
                <div className="transform translate-y-1 group-hover:translate-y-0 transition-transform duration-300">
                  {/* Category / 8 Elemen Informatika Kicker */}
                  <span className="inline-block font-mono text-[10px] font-extrabold uppercase tracking-widest text-amber-300 bg-amber-400/15 border border-amber-400/30 px-2.5 py-0.5 rounded-md mb-2 drop-shadow-xs">
                    {m.element || m.subject}
                  </span>

                  {/* Main Title Inside Thumbnail */}
                  <h3 className="font-extrabold text-white text-lg sm:text-xl leading-snug tracking-tight group-hover:text-amber-200 transition-colors drop-shadow-md line-clamp-2">
                    {m.title}
                  </h3>

                  {/* Metadata & Quick Action */}
                  <div className="mt-4 pt-3 border-t border-white/15 flex items-center justify-between">
                    <div className="flex items-center gap-2 text-xs font-mono text-white/80">
                      <Layers className="w-3.5 h-3.5 text-amber-300" />
                      <span>{m.modules} Modul Pelajaran</span>
                    </div>

                    <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-primary/90 text-primary-foreground font-bold text-xs backdrop-blur-md group-hover:bg-primary group-hover:scale-105 shadow-md shadow-primary/20 transition-all duration-300">
                      <span>Mulai</span>
                      <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
                    </div>
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
