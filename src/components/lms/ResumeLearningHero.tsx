import React from "react";
import { Link } from "@tanstack/react-router";
import { PlayCircle, ArrowRight, BookOpen } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { Enrollment } from "@/lib/lms";
import type { CatalogMaterial } from "@/lib/materials-db";

interface ResumeLearningHeroProps {
  enrollments: Enrollment[];
  materials: CatalogMaterial[];
  materialProgressMap: Record<string, { done: number; total: number; percent: number }>;
}

export function ResumeLearningHero({
  enrollments,
  materials,
  materialProgressMap,
}: ResumeLearningHeroProps) {
  // Find the most recently active or in-progress course
  const inProgressEnrollment =
    enrollments.find((e) => {
      const slug = (e as any).material_slug || e.materialSlug;
      const p = materialProgressMap[slug];
      return p && p.percent < 100;
    }) || enrollments[0];

  if (!inProgressEnrollment) return null;

  const currentSlug = (inProgressEnrollment as any).material_slug || inProgressEnrollment.materialSlug;
  const currentMaterial = materials.find((m) => m.slug === currentSlug);
  if (!currentMaterial) return null;

  const progress = materialProgressMap[currentMaterial.slug] || {
    done: 0,
    total: currentMaterial.moduleList?.length || 1,
    percent: 0,
  };

  const nextModuleIndex = Math.min(progress.done, (currentMaterial.moduleList?.length || 1) - 1);
  const nextModuleName = currentMaterial.moduleList?.[nextModuleIndex] || "Modul Pembelajaran";

  return (
    <div className="relative mb-8 overflow-hidden rounded-xl border border-border/80 bg-card p-6 sm:p-7 shadow-xs">
      <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6 relative z-10">
        <div className="max-w-2xl">
          <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-md bg-secondary text-secondary-foreground border border-border/60 mb-3">
            <BookOpen className="w-3.5 h-3.5 text-primary" />
            <span className="font-mono text-xs font-semibold uppercase tracking-wider">
              Lanjutkan Belajar Terakhir
            </span>
          </div>

          <h2 className="font-display text-2xl sm:text-3xl font-normal tracking-tight text-foreground leading-snug">
            {currentMaterial.title}
          </h2>

          <div className="mt-2 flex flex-wrap items-center gap-2.5 text-xs text-muted-foreground font-mono">
            <span className="px-2 py-0.5 rounded bg-surface-alt text-foreground font-semibold">
              Kelas {currentMaterial.grade}
            </span>
            <span>·</span>
            <span>{currentMaterial.subject}</span>
            <span>·</span>
            <span className="text-foreground font-medium">Langkah: {nextModuleName}</span>
          </div>

          {/* Progress bar */}
          <div className="mt-4 max-w-md">
            <div className="flex justify-between text-xs font-mono text-muted-foreground mb-1.5">
              <span>{progress.done} dari {progress.total} modul selesai</span>
              <span className="font-bold text-primary tabular-nums">{progress.percent}%</span>
            </div>
            <div className="h-2 w-full rounded-full bg-secondary overflow-hidden">
              <div
                className="h-full rounded-full bg-primary transition-all duration-500"
                style={{ width: `${progress.percent}%` }}
              />
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          <Link to="/materi/$slug" params={{ slug: currentMaterial.slug }}>
            <Button size="lg" className="h-11 px-5 rounded-lg font-semibold gap-2">
              <PlayCircle className="w-4 h-4" />
              Lanjutkan Modul {nextModuleIndex + 1}
              <ArrowRight className="w-4 h-4 ml-1" />
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
