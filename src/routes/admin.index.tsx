import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { Users, BookOpen, CheckCircle2, TrendingUp, Loader2, ArrowRight } from "lucide-react";
import { toast } from "sonner";
import { DashboardShell, StatCard } from "@/components/DashboardShell";
import { RequireRole } from "@/components/RequireRole";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { useCatalog } from "@/lib/materials-db";
import { fetchAdminData, buildStudentRows, formatDate, findMaterial, type StudentRow } from "@/lib/lms";
import {
  ActivityAreaChart,
  ChartCard,
  GradeDonutChart,
  MaterialBarChart,
  ProgressRadial,
} from "@/components/admin/AdminCharts";

export const Route = createFileRoute("/admin/")({
  head: () => ({
    meta: [
      { title: "Dashboard Admin — Digisschool LMS" },
      {
        name: "description",
        content: "Ringkasan kelas digital, santri aktif, progres belajar, dan aktivitas terbaru di Digisschool LMS.",
      },
      { property: "og:title", content: "Dashboard Admin — Digisschool LMS" },
      { property: "og:description", content: "Ringkasan operasional LMS untuk administrator." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: () => <RequireRole role="staff">{({ role }) => <AdminOverview viewerRole={role} />}</RequireRole>,
});

function AdminOverview({ viewerRole }: { viewerRole: "admin" | "guru" | "student" }) {
  const isGuru = viewerRole === "guru";
  const { list: materials } = useCatalog(true);
  const [rows, setRows] = useState<StudentRow[]>([]);
  const [enrollCount, setEnrollCount] = useState(0);
  const [completed, setCompleted] = useState(0);
  const [popular, setPopular] = useState<Array<{ slug: string; count: number; done: number }>>([]);
  const [raw, setRaw] = useState<Awaited<ReturnType<typeof fetchAdminData>> | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const data = await fetchAdminData();
        setRaw(data);
        setRows(buildStudentRows(data));
        setEnrollCount(data.enrollments.length);
        setCompleted(data.progress.length);
        const map = new Map<string, { slug: string; count: number; done: number }>();
        for (const e of data.enrollments) {
          if (!map.has(e.materialSlug)) map.set(e.materialSlug, { slug: e.materialSlug, count: 0, done: 0 });
          map.get(e.materialSlug)!.count += 1;
        }
        for (const p of data.progress) {
          const item = map.get(p.materialSlug);
          if (item) item.done += 1;
        }
        setPopular([...map.values()].sort((a, b) => b.count - a.count));
      } catch (err: any) {
        toast.error(err.message || "Gagal memuat data admin");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const avgProgress = useMemo(
    () => (rows.length ? Math.round(rows.reduce((s, r) => s + r.progress, 0) / rows.length) : 0),
    [rows],
  );
  const activeStudents = rows.filter((r) => r.enrollments > 0).length;

  // 30 hari aktivitas modul selesai
  const activitySeries = useMemo(() => {
    const days: Array<{ label: string; value: number }> = [];
    const counts = new Map<string, number>();
    for (const p of raw?.progress ?? []) {
      const key = p.completedAt.slice(0, 10);
      counts.set(key, (counts.get(key) ?? 0) + 1);
    }
    const today = new Date();
    for (let i = 29; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(today.getDate() - i);
      const key = d.toISOString().slice(0, 10);
      days.push({
        label: d.toLocaleDateString("id-ID", { day: "numeric", month: "short" }),
        value: counts.get(key) ?? 0,
      });
    }
    return days;
  }, [raw]);

  // distribusi pendaftaran per tingkat kelas
  const gradeSeries = useMemo(() => {
    const buckets = new Map<number, number>([[7, 0], [8, 0], [9, 0]]);
    for (const e of raw?.enrollments ?? []) {
      const m = findMaterial(e.materialSlug);
      if (m) buckets.set(m.grade, (buckets.get(m.grade) ?? 0) + 1);
    }
    return [...buckets.entries()].map(([grade, value]) => ({ label: `Kelas ${grade}`, value }));
  }, [raw]);

  const materialSeries = useMemo(
    () =>
      popular.slice(0, 6).map((p) => ({
        label: findMaterial(p.slug)?.title.slice(0, 22) ?? p.slug,
        value: p.count,
        done: p.done,
      })),
    [popular],
  );

  const completionRate = useMemo(() => {
    const totalModules = (raw?.enrollments ?? []).reduce(
      (sum, e) => sum + (findMaterial(e.materialSlug)?.modules ?? 0),
      0,
    );
    return totalModules ? Math.round(((raw?.progress.length ?? 0) / totalModules) * 100) : 0;
  }, [raw]);
  const recent = [...rows].sort((a, b) => (b.lastActivity ?? "").localeCompare(a.lastActivity ?? "")).slice(0, 6);

  return (
    <DashboardShell
      role="staff"
      title={isGuru ? "Ringkasan kelas" : "Ringkasan admin"}
      subtitle={
        isGuru
          ? "Pantau perkembangan siswa, kuis, dan tugas kelas Anda"
          : "Kesehatan platform belajar secara keseluruhan"
      }
    >
      {loading ? (
        <div className="flex h-64 items-center justify-center">
          <Loader2 className="h-6 w-6 animate-spin text-primary" />
        </div>
      ) : (
        <div className="space-y-8">
          <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <StatCard label="Total pengguna" value={rows.length} hint={`${activeStudents} aktif belajar`} icon={Users} />
            <StatCard label="Pendaftaran kelas" value={enrollCount} hint={`${materials.length} materi tersedia`} icon={BookOpen} />
            <StatCard label="Modul diselesaikan" value={completed} hint="akumulasi semua siswa" icon={CheckCircle2} />
            <StatCard label="Rata-rata progres" value={`${avgProgress}%`} hint="dari kelas yang diikuti" icon={TrendingUp} />
          </section>

          <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {[
              { to: "/admin/materi", label: "Susun materi", desc: "Tambah & publikasikan modul" },
              { to: "/admin/kuis", label: "Buat kuis", desc: "Bank soal & nilai lulus" },
              { to: "/admin/tugas", label: "Beri tugas", desc: "Kumpulkan & nilai pekerjaan" },
              { to: "/admin/pengumuman", label: "Kirim pengumuman", desc: "Info cepat ke semua siswa" },
            ].map((a) => (
              <Link
                key={a.to}
                to={a.to}
                className="group rounded-2xl border border-border/60 bg-background p-4 transition-colors hover:border-primary/50 hover:bg-primary/5"
              >
                <p className="flex items-center justify-between text-sm font-medium">
                  {a.label}
                  <ArrowRight className="h-4 w-4 text-muted-foreground transition-transform group-hover:translate-x-0.5 group-hover:text-primary" />
                </p>
                <p className="mt-1 text-xs text-muted-foreground">{a.desc}</p>
              </Link>
            ))}
          </section>

          <ChartCard
            title="Momentum belajar 30 hari"
            subtitle="Jumlah modul yang diselesaikan seluruh siswa per hari"
          >
            <ActivityAreaChart data={activitySeries} />
          </ChartCard>

          <div className="grid gap-4 lg:grid-cols-3">
            <ChartCard title="Distribusi tingkat" subtitle="Pendaftaran per kelas 7–9">
              <GradeDonutChart data={gradeSeries} />
            </ChartCard>
            <ChartCard title="Tingkat penyelesaian" subtitle="Modul selesai dibanding total modul terdaftar">
              <ProgressRadial value={completionRate} caption="rata-rata seluruh platform" />
            </ChartCard>
            <ChartCard title="Keterlibatan" subtitle="Ringkasan singkat">
              <ul className="space-y-3 text-sm">
                <li className="flex items-center justify-between">
                  <span className="text-muted-foreground">Siswa aktif</span>
                  <span className="font-medium">{activeStudents} / {rows.length}</span>
                </li>
                <li className="flex items-center justify-between">
                  <span className="text-muted-foreground">Kelas per siswa</span>
                  <span className="font-medium">{rows.length ? (enrollCount / rows.length).toFixed(1) : "0.0"}</span>
                </li>
                <li className="flex items-center justify-between">
                  <span className="text-muted-foreground">Modul per siswa</span>
                  <span className="font-medium">{rows.length ? (completed / rows.length).toFixed(1) : "0.0"}</span>
                </li>
                <li className="flex items-center justify-between">
                  <span className="text-muted-foreground">Materi tanpa peserta</span>
                  <span className="font-medium">{popular.filter((p) => p.count === 0).length}</span>
                </li>
                <li className="flex items-center justify-between">
                  <span className="text-muted-foreground">Rata-rata progres</span>
                  <span className="font-medium">{avgProgress}%</span>
                </li>
              </ul>
            </ChartCard>
          </div>

          <ChartCard title="Peserta & penyelesaian per materi" subtitle="Enam materi teratas">
            <MaterialBarChart data={materialSeries} />
          </ChartCard>

          <section className="rounded-2xl border border-border/60 bg-background p-5">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-semibold tracking-tight">Materi terpopuler</h2>
              <Button asChild size="sm" variant="ghost">
                <Link to="/admin/materi">
                  Semua materi <ArrowRight className="ml-1 h-4 w-4" />
                </Link>
              </Button>
            </div>
            <div className="mt-4 space-y-4">
              {popular.slice(0, 5).map((p) => {
                const m = findMaterial(p.slug);
                if (!m) return null;
                const max = popular[0]?.count || 1;
                return (
                  <div key={p.slug} className="flex items-center gap-3">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-2">
                        <p className="truncate text-sm font-medium">{m.title}</p>
                        <span className="text-xs text-muted-foreground">{p.count} siswa</span>
                      </div>
                      <Progress value={(p.count / max) * 100} className="mt-1.5 h-1.5" />
                    </div>
                    <Badge variant="outline">Kelas {m.grade}</Badge>
                  </div>
                );
              })}
            </div>
          </section>

          <section className="rounded-2xl border border-border/60 bg-background p-5">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-semibold tracking-tight">Aktivitas siswa terbaru</h2>
              <Button asChild size="sm" variant="ghost">
                <Link to="/admin/siswa">
                  Kelola siswa <ArrowRight className="ml-1 h-4 w-4" />
                </Link>
              </Button>
            </div>
            <div className="mt-4 divide-y divide-border/60">
              {recent.map((r) => (
                <div key={r.id} className="flex items-center justify-between gap-3 py-3">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium">{r.displayName || "Siswa tanpa nama"}</p>
                    <p className="text-xs text-muted-foreground">
                      {r.enrollments} kelas · {r.completedModules} modul selesai
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-xs text-muted-foreground">{formatDate(r.lastActivity)}</span>
                    <Badge variant={r.role === "student" ? "secondary" : "default"}>
                      {r.role === "admin" ? "Admin" : r.role === "guru" ? "Guru" : "Siswa"}
                    </Badge>
                  </div>
                </div>
              ))}
              {recent.length === 0 && <p className="py-3 text-sm text-muted-foreground">Belum ada aktivitas.</p>}
            </div>
          </section>

          <section className="rounded-2xl border border-border/60 bg-background p-5">
            <h2 className="text-base font-semibold tracking-tight">Perlu pendampingan</h2>
            <p className="text-sm text-muted-foreground">Siswa dengan progres di bawah 25%.</p>
            <div className="mt-4 divide-y divide-border/60">
              {rows
                .filter((r) => r.role === "student" && r.progress < 25)
                .slice(0, 6)
                .map((r) => (
                  <div key={r.id} className="flex items-center justify-between gap-3 py-3">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium">{r.displayName || "Siswa tanpa nama"}</p>
                      <p className="text-xs text-muted-foreground">
                        {r.grade ? `Kelas ${r.grade}` : "Kelas —"} · {r.enrollments} materi diikuti
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Progress value={r.progress} className="h-1.5 w-20" />
                      <span className="text-xs text-muted-foreground">{r.progress}%</span>
                    </div>
                  </div>
                ))}
              {rows.filter((r) => r.role === "student" && r.progress < 25).length === 0 && (
                <p className="py-3 text-sm text-muted-foreground">Semua siswa berjalan baik.</p>
              )}
            </div>
          </section>
        </div>
      )}
    </DashboardShell>
  );
}
