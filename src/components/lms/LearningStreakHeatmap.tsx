import React from "react";
import { Flame, Trophy, Calendar, CheckCircle2 } from "lucide-react";

interface LearningStreakHeatmapProps {
  streakDays?: number;
  totalHours?: number;
  completedQuizzes?: number;
}

export function LearningStreakHeatmap({
  streakDays = 12,
  totalHours = 24,
  completedQuizzes = 8,
}: LearningStreakHeatmapProps) {
  // Generate dummy 28-day grid with recent activity
  const days = Array.from({ length: 28 }, (_, i) => {
    const isCompleted = i % 2 === 0 || i > 20;
    return {
      day: i + 1,
      completed: isCompleted,
      level: isCompleted ? (i % 3 === 0 ? 3 : 2) : 0,
    };
  });

  return (
    <div className="rounded-2xl border border-border/80 bg-card p-6 shadow-xs mb-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border/60 pb-4 mb-5">
        <div>
          <div className="flex items-center gap-2">
            <Flame className="w-5 h-5 text-primary" />
            <h3 className="font-bold text-foreground text-base">Konsistensi Belajar & Momentum</h3>
          </div>
          <p className="text-xs text-muted-foreground mt-0.5">
            Pertahankan rantai belajar aktif setiap hari untuk mempertajam retensi memori.
          </p>
        </div>

        <div className="flex items-center gap-4">
          <div className="text-right">
            <span className="font-mono text-[11px] uppercase text-muted-foreground">Streak Aktif</span>
            <p className="font-mono text-xl font-bold text-primary">{streakDays} Hari 🔥</p>
          </div>
        </div>
      </div>

      {/* Heatmap Grid */}
      <div>
        <div className="flex items-center justify-between text-xs font-mono text-muted-foreground mb-2">
          <span>Aktivitas 4 Minggu Terakhir</span>
          <div className="flex items-center gap-1.5 text-[11px]">
            <span>Kurang</span>
            <div className="w-2.5 h-2.5 rounded-xs bg-secondary" />
            <div className="w-2.5 h-2.5 rounded-xs bg-primary/40" />
            <div className="w-2.5 h-2.5 rounded-xs bg-primary/80" />
            <div className="w-2.5 h-2.5 rounded-xs bg-primary" />
            <span>Aktif</span>
          </div>
        </div>

        <div className="grid grid-cols-7 sm:grid-cols-14 gap-2">
          {days.map((d, i) => (
            <div
              key={i}
              title={`Hari ke-${d.day}: ${d.completed ? "Menyelesaikan materi" : "Tidak ada aktivitas"}`}
              className={`h-8 rounded-lg border flex items-center justify-center text-[10px] font-mono transition-all duration-200 hover:scale-110 cursor-pointer ${
                d.level === 3
                  ? "bg-primary text-primary-foreground border-primary font-bold shadow-xs"
                  : d.level === 2
                  ? "bg-primary/50 text-foreground border-primary/40 font-semibold"
                  : "bg-secondary/40 text-muted-foreground border-border/60"
              }`}
            >
              {d.day}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
