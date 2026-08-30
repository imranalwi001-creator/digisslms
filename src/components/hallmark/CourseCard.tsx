import React from "react";
import { Link } from "@tanstack/react-router";
import { BookOpen, CheckCircle2, Clock, Sparkles, ArrowRight, Layers, Play } from "lucide-react";
import { cn } from "@/lib/utils";
import type { CatalogMaterial } from "@/lib/materials-db";

export interface CourseCardProps {
  material: Partial<CatalogMaterial> & { slug: string; title: string };
  isEnrolled?: boolean;
  progressPercent?: number;
  completedCount?: number;
  totalModules?: number;
  onEnroll?: (slug: string) => void;
  isLoading?: boolean;
  className?: string;
}

export function CourseCard({
  material,
  isEnrolled = false,
  progressPercent = 0,
  completedCount = 0,
  totalModules = typeof material.modules === "number" ? material.modules : (material.moduleList?.length ?? 0),
  onEnroll,
  isLoading = false,
  className,
}: CourseCardProps) {
  const isComplete = progressPercent === 100 && totalModules > 0;
  const imageSrc = material.image || "https://images.unsplash.com/photo-1517694712202-14dd9538aa97?w=800&auto=format&fit=crop&q=60";

  return (
    <article
      className={cn(
        "group relative flex flex-col aspect-[4/3] rounded-3xl overflow-hidden border border-border/80 bg-slate-950 shadow-md hover:shadow-2xl hover:shadow-primary/20 hover:border-primary/50 hover:-translate-y-1.5 transition-all duration-500",
        className,
      )}
    >
      {/* Full Background Image */}
      <img
        src={imageSrc}
        alt={material.title}
        width={768}
        height={576}
        loading="lazy"
        className="absolute inset-0 w-full h-full object-cover transform scale-100 group-hover:scale-108 transition-transform duration-700 ease-out"
      />

      {/* Multi-layered Cinematic Gradient Overlay */}
      <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/65 to-slate-950/20 opacity-95 group-hover:opacity-90 transition-opacity duration-300" />
      <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-transparent to-transparent opacity-80" />

      {/* Card Inner Container */}
      <div className="relative z-10 p-5 sm:p-6 flex flex-col justify-between h-full">
        {/* Top Header Capsule Badges */}
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-1.5">
            <span className="font-mono text-[11px] font-bold uppercase tracking-wider px-3 py-1 rounded-full bg-black/45 backdrop-blur-md text-white border border-white/20 shadow-xs flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
              Kelas {material.grade ?? "Umum"} {material.semester ? `· Sem ${material.semester}` : ""}
            </span>
          </div>

          {isComplete ? (
            <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-300 bg-emerald-950/70 border border-emerald-500/40 backdrop-blur-md px-2.5 py-1 rounded-full shadow-xs">
              <CheckCircle2 className="w-3.5 h-3.5" />
              Selesai
            </span>
          ) : isEnrolled ? (
            <span className="inline-flex items-center gap-1 text-[11px] font-bold text-amber-300 bg-amber-950/70 border border-amber-500/40 backdrop-blur-md px-2.5 py-1 rounded-full shadow-xs">
              <Sparkles className="w-3.5 h-3.5" />
              {progressPercent}%
            </span>
          ) : (
            <span className="font-mono text-[11px] font-medium text-white/90 px-2.5 py-1 rounded-full bg-white/10 backdrop-blur-md border border-white/15 shadow-xs flex items-center gap-1">
              <Clock className="w-3 h-3 text-amber-300" />
              {material.duration || "4 jam"}
            </span>
          )}
        </div>

        {/* Bottom Dynamic Title Overlay */}
        <div className="transform translate-y-1 group-hover:translate-y-0 transition-transform duration-300">
          {/* Element / Subject Tag */}
          <span className="inline-block font-mono text-[10px] font-extrabold uppercase tracking-widest text-amber-300 bg-amber-400/15 border border-amber-400/30 px-2.5 py-0.5 rounded-md mb-2 drop-shadow-xs">
            {material.element || material.subject || "Informatika"}
          </span>

          {/* Dynamic Title */}
          <h3 className="font-extrabold text-white text-lg sm:text-xl leading-snug tracking-tight group-hover:text-amber-200 transition-colors drop-shadow-md line-clamp-2">
            {material.title}
          </h3>

          {/* Enrolled Progress Bar */}
          {isEnrolled && (
            <div className="mt-3 mb-1">
              <div className="flex justify-between text-[10px] font-mono text-white/70 mb-1">
                <span>{completedCount}/{totalModules} Modul Tuntas</span>
                <span>{progressPercent}%</span>
              </div>
              <div className="h-1.5 w-full rounded-full bg-white/20 overflow-hidden backdrop-blur-xs">
                <div
                  className="h-full rounded-full bg-amber-400 transition-all duration-500 shadow-sm"
                  style={{ width: `${progressPercent}%` }}
                />
              </div>
            </div>
          )}

          {/* Card Action Footer */}
          <div className="mt-4 pt-3 border-t border-white/15 flex items-center justify-between">
            <div className="flex items-center gap-2 text-xs font-mono text-white/80">
              <Layers className="w-3.5 h-3.5 text-amber-300" />
              <span>{totalModules} Modul</span>
            </div>

            <Link
              to="/materi/$slug"
              params={{ slug: material.slug }}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-primary/90 text-primary-foreground font-bold text-xs backdrop-blur-md group-hover:bg-primary group-hover:scale-105 shadow-md shadow-primary/20 transition-all duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
            >
              <span>{isEnrolled ? "Lanjutkan" : "Buka Kelas"}</span>
              <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
            </Link>
          </div>
        </div>
      </div>
    </article>
  );
}
