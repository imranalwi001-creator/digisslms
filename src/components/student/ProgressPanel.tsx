import { useMemo } from "react";
import { Award, BookOpenCheck, CheckCircle2, Lock, Target, TrendingUp } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { findMaterial, materialProgress, type Enrollment, type ModuleProgress } from "@/lib/lms";

const LEVELS = [
  { min: 0, label: "Pemula", desc: "Baru memulai perjalanan belajar" },
  { min: 25, label: "Berkembang", desc: "Ritme belajar mulai terbentuk" },
  { min: 50, label: "Mahir", desc: "Setengah jalan menuju konsistensi penuh" },
  { min: 75, label: "Ahli", desc: "Penyelesaian materi sangat konsisten" },
  { min: 95, label: "Teladan", desc: "Hampir sempurna — luar biasa" },
];

const ACHIEVEMENTS = [
  { threshold: 25, label: "Seperempat jalan", detail: "25% modul kelasmu selesai" },
  { threshold: 50, label: "Separuh perjalanan", detail: "50% modul kelasmu selesai" },
  { threshold: 75, label: "Tiga perempat", detail: "75% modul kelasmu selesai" },
  { threshold: 90, label: "Nyaris sempurna", detail: "90% modul kelasmu selesai" },
];

function dayKey(d: Date) {
  return d.toISOString().split("T")[0];
}

/** Progres belajar berbasis data LMS (modul, kuis, sertifikat) — tab di dashboard siswa. */
export function ProgressPanel({
  enrollments,
  progress,
  quizAttempts,
  certificates,
}: {
  enrollments: Enrollment[];
  progress: ModuleProgress[];
  quizAttempts: any[];
  certificates: any[];
}) {
  const totalModules = enrollments.reduce((s, e) => s + (findMaterial(e.materialSlug)?.modules ?? 0), 0);
  const done = progress.length;
  const percent = totalModules ? Math.round((done / totalModules) * 100) : 0;
  const level = [...LEVELS].reverse().find((l) => percent >= l.min) ?? LEVELS[0];
  const nextLevel = LEVELS.find((l) => l.min > percent);

  const days = useMemo(() => {
    const out: { key: string; label: string; count: number }[] = [];
    for (let i = 13; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const key = dayKey(d);
      out.push({
        key,
        label: d.toLocaleDateString("id-ID", { weekday: "narrow" }),
        count: progress.filter((p) => (p.completedAt || "").slice(0, 10) === key).length,
      });
    }
    return out;
  }, [progress]);

  const max = Math.max(1, ...days.map((d) => d.count));
  const last7 = days.slice(7).reduce((s, d) => s + d.count, 0);
  const prev7 = days.slice(0, 7).reduce((s, d) => s + d.count, 0);
  const delta = last7 - prev7;

  const avgQuiz = quizAttempts.length
    ? Math.round(quizAttempts.reduce((s, a) => s + (a.score ?? 0), 0) / quizAttempts.length)
    : 0;

  if (enrollments.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-border bg-background p-10 text-center">
        <BookOpenCheck className="mx-auto mb-3 h-8 w-8 text-primary" />
        <p className="font-medium">Belum ada data progres</p>
        <p className="mt-1 text-sm text-muted-foreground">
          Ikuti kelas dari tab <strong>Belajar</strong>, lalu progresmu akan muncul otomatis di sini.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <section className="rounded-2xl border border-border/60 bg-background p-5">
        <div className="mb-4 flex items-center gap-2">
          <BookOpenCheck className="h-4 w-4 text-primary" />
          <h2 className="text-base font-semibold tracking-tight">Ringkasan materi</h2>
        </div>
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          <div>
            <p className="text-2xl font-semibold tabular-nums">
              {done}/{totalModules}
            </p>
            <p className="text-xs text-muted-foreground">Modul selesai</p>
          </div>
          <div>
            <p className="text-2xl font-semibold tabular-nums text-primary">
              {enrollments.filter((e) => materialProgress(e.materialSlug, progress).percent === 100).length}
            </p>
            <p className="text-xs text-muted-foreground">Materi tuntas</p>
          </div>
          <div>
            <p className="text-2xl font-semibold tabular-nums">{avgQuiz}</p>
            <p className="text-xs text-muted-foreground">Rata-rata kuis</p>
          </div>
          <div>
            <p className="text-2xl font-semibold tabular-nums">{certificates.length}</p>
            <p className="text-xs text-muted-foreground">Sertifikat</p>
          </div>
        </div>
        <div className="mt-5">
          <div className="mb-2 flex items-center justify-between text-xs text-muted-foreground">
            <span className="uppercase tracking-wider">Penyelesaian keseluruhan</span>
            <span className="font-semibold tabular-nums text-foreground">{percent}%</span>
          </div>
          <Progress value={percent} className="h-2" />
        </div>
      </section>

      <section className="rounded-2xl border border-border/60 bg-background p-5">
        <div className="mb-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <TrendingUp className="h-4 w-4 text-primary" />
            <h2 className="text-base font-semibold tracking-tight">Momentum belajar</h2>
          </div>
          <span
            className={`rounded-full px-2 py-1 text-[11px] font-medium tabular-nums ${
              delta >= 0 ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground"
            }`}
          >
            {delta >= 0 ? "+" : ""}
            {delta} vs minggu lalu
          </span>
        </div>
        <div className="flex items-end justify-between gap-1">
          {days.map((d) => (
            <div key={d.key} className="flex flex-1 flex-col items-center gap-1.5">
              <div
                className="w-full max-w-[14px] rounded-t-md bg-primary transition-all duration-700"
                style={{ height: d.count === 0 ? 4 : 12 + (d.count / max) * 68, opacity: d.count === 0 ? 0.2 : 0.85 }}
                title={`${d.key}: ${d.count} modul`}
              />
              <span className="text-[9px] text-muted-foreground">{d.label}</span>
            </div>
          ))}
        </div>
        <p className="mt-3 text-xs text-muted-foreground">{last7} modul diselesaikan dalam 7 hari terakhir</p>
      </section>

      <section className="rounded-2xl border border-border/60 bg-background p-5">
        <div className="mb-4 flex items-center gap-2">
          <Award className="h-4 w-4 text-primary" />
          <h2 className="text-base font-semibold tracking-tight">Capaian</h2>
        </div>
        <div className="rounded-xl bg-muted/60 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-semibold">Level {level.label}</p>
              <p className="mt-0.5 text-xs text-muted-foreground">{level.desc}</p>
            </div>
            <Target className="h-4 w-4 text-primary" />
          </div>
          {nextLevel && (
            <p className="mt-3 text-xs text-muted-foreground">
              {nextLevel.min - percent}% lagi menuju level {nextLevel.label}
            </p>
          )}
        </div>
        <div className="mt-4 grid gap-2 sm:grid-cols-2">
          {ACHIEVEMENTS.map((a) => {
            const unlocked = percent >= a.threshold;
            return (
              <div
                key={a.threshold}
                className={`flex items-center gap-3 rounded-xl p-3 ${unlocked ? "bg-primary/10" : "bg-muted/50"}`}
              >
                {unlocked ? (
                  <CheckCircle2 className="h-4 w-4 shrink-0 text-primary" />
                ) : (
                  <Lock className="h-4 w-4 shrink-0 text-muted-foreground" />
                )}
                <div className="min-w-0">
                  <p className={`text-[13px] font-medium ${unlocked ? "" : "text-muted-foreground"}`}>{a.label}</p>
                  <p className="text-[11px] text-muted-foreground">{a.detail}</p>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      <section className="space-y-3">
        <h2 className="text-base font-semibold tracking-tight">Rincian per materi</h2>
        {enrollments.map((e) => {
          const material = findMaterial(e.materialSlug);
          if (!material) return null;
          const mp = materialProgress(e.materialSlug, progress);
          return (
            <div key={e.id} className="rounded-2xl border border-border/60 bg-background p-4">
              <div className="flex items-center justify-between gap-3">
                <p className="truncate font-medium">{material.title}</p>
                <span className="text-sm font-semibold tabular-nums">{mp.percent}%</span>
              </div>
              <Progress value={mp.percent} className="mt-3 h-2" />
              <p className="mt-2 text-xs text-muted-foreground">
                {mp.done} dari {mp.total} modul selesai
              </p>
            </div>
          );
        })}
      </section>
    </div>
  );
}
