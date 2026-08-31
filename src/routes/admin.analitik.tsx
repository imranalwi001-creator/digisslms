import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { BarChart3, BookMarked, CheckCircle2, Loader2, TrendingDown, TrendingUp, Users } from "lucide-react";
import { toast } from "sonner";
import { DashboardShell, StatCard } from "@/components/DashboardShell";
import { RequireRole } from "@/components/RequireRole";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { filterByPeriod, periodOptions, periodLabel, type PeriodId } from "@/lib/period";
import {
  attendanceRate,
  fetchJournals,
  fetchRecords,
  fetchSessions,
  fetchStudentsByGrade,
  formatDay,
  statusLabel,
  type AttendanceRecord,
  type AttendanceSession,
  type AttendanceStatus,
  type Journal,
  type StudentLite,
} from "@/lib/teaching";

export const Route = createFileRoute("/admin/analitik")({
  head: () => ({
    meta: [
      { title: "Analitik kelas — Digisschool LMS" },
      {
        name: "description",
        content: "Metrik keterlibatan, retensi mingguan, dan evaluasi hasil belajar siswa per mata pelajaran.",
      },
      { property: "og:title", content: "Analitik kelas — Digisschool LMS" },
      { property: "og:description", content: "Pantau perkembangan kelas dan siswa dari waktu ke waktu." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: () => <RequireRole role="staff">{() => <AnalyticsPage />}</RequireRole>,
});

const statusColors: Record<AttendanceStatus, string> = {
  hadir: "hsl(var(--primary))",
  izin: "hsl(var(--muted-foreground))",
  sakit: "hsl(var(--chart-3, 38 92% 50%))",
  alpa: "hsl(var(--destructive))",
};

function AnalyticsPage() {
  const [grade, setGrade] = useState("7");
  const [period, setPeriod] = useState<PeriodId>("30d");
  const [loading, setLoading] = useState(true);
  const [allSessions, setSessions] = useState<AttendanceSession[]>([]);
  const [allRecords, setRecords] = useState<AttendanceRecord[]>([]);
  const [students, setStudents] = useState<StudentLite[]>([]);
  const [allJournals, setJournals] = useState<Journal[]>([]);

  useEffect(() => {
    let active = true;
    (async () => {
      setLoading(true);
      try {
        const g = Number(grade);
        const [s, st, j] = await Promise.all([fetchSessions(g), fetchStudentsByGrade(g), fetchJournals(g)]);
        const r = await fetchRecords(s.map((x) => x.id));
        if (!active) return;
        setSessions(s);
        setStudents(st);
        setJournals(j);
        setRecords(r);
      } catch (err: any) {
        if (active) toast.error(err.message || "Gagal memuat analitik");
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => {
      active = false;
    };
  }, [grade]);

  /** Everything below respects the selected period window. */
  const sessionsInPeriod = useMemo(
    () => filterByPeriod(allSessions, period, (s) => s.sessionDate),
    [allSessions, period],
  );
  const sessions = sessionsInPeriod;
  const journals = useMemo(
    () => filterByPeriod(allJournals, period, (j) => j.journalDate),
    [allJournals, period],
  );
  const records = useMemo(() => {
    const ids = new Set(sessionsInPeriod.map((s) => s.id));
    return allRecords.filter((r) => ids.has(r.sessionId));
  }, [allRecords, sessionsInPeriod]);

  const chronological = useMemo(
    () => [...sessions].sort((a, b) => a.sessionDate.localeCompare(b.sessionDate)),
    [sessions],
  );

  const trend = useMemo(
    () =>
      chronological.map((s, i) => {
        const mine = records.filter((r) => r.sessionId === s.id);
        return {
          name: `P${i + 1}`,
          label: `${s.topic} · ${formatDay(s.sessionDate)}`,
          rate: attendanceRate(mine),
          hadir: mine.filter((r) => r.status === "hadir").length,
          absen: mine.filter((r) => r.status !== "hadir").length,
        };
      }),
    [chronological, records],
  );

  const composition = useMemo(() => {
    const counts: Record<string, number> = { hadir: 0, izin: 0, sakit: 0, alpa: 0 };
    for (const r of records) counts[r.status] = (counts[r.status] ?? 0) + 1;
    return (Object.keys(counts) as AttendanceStatus[])
      .map((s) => ({ name: statusLabel[s], value: counts[s], status: s }))
      .filter((d) => d.value > 0);
  }, [records]);

  const perStudent = useMemo(() => {
    const half = Math.ceil(chronological.length / 2);
    const firstIds = new Set(chronological.slice(0, half).map((s) => s.id));
    const lastIds = new Set(chronological.slice(half).map((s) => s.id));
    return students
      .map((st) => {
        const mine = records.filter((r) => r.studentId === st.id);
        const early = attendanceRate(mine.filter((r) => firstIds.has(r.sessionId)));
        const late = attendanceRate(mine.filter((r) => lastIds.has(r.sessionId)));
        return {
          ...st,
          total: mine.length,
          rate: attendanceRate(mine),
          alpa: mine.filter((r) => r.status === "alpa").length,
          delta: mine.length ? late - early : 0,
        };
      })
      .sort((a, b) => b.rate - a.rate);
  }, [students, records, chronological]);

  const journalByMonth = useMemo(() => {
    const map = new Map<string, number>();
    for (const j of journals) {
      const key = j.journalDate.slice(0, 7);
      map.set(key, (map.get(key) ?? 0) + 1);
    }
    return [...map.entries()]
      .sort((a, b) => a[0].localeCompare(b[0]))
      .slice(-12)
      .map(([month, count]) => ({
        name: new Date(`${month}-01`).toLocaleDateString("id-ID", { month: "short", year: "2-digit" }),
        jurnal: count,
      }));
  }, [journals]);

  const withObstacles = journals.filter((j) => j.obstacles.trim().length > 0).length;
  const overall = attendanceRate(records);

  return (
    <DashboardShell
      role="staff"
      title="Analitik kelas"
      subtitle={`Tren kehadiran, perkembangan siswa, dan ringkasan jurnal · ${periodLabel(period)}`}
      actions={
        <div className="flex flex-wrap items-center gap-2">
        <Select value={period} onValueChange={(v) => setPeriod(v as PeriodId)}>
          <SelectTrigger className="w-52">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {periodOptions.map((p) => (
              <SelectItem key={p.id} value={p.id}>
                {p.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={grade} onValueChange={setGrade}>
          <SelectTrigger className="w-32">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {[7, 8, 9].map((g) => (
              <SelectItem key={g} value={String(g)}>
                Kelas {g}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        </div>
      }
    >
      {loading ? (
        <div className="flex h-40 items-center justify-center">
          <Loader2 className="h-6 w-6 animate-spin text-primary" />
        </div>
      ) : (
        <div className="space-y-6">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <StatCard label="Rata-rata kehadiran" value={`${overall}%`} hint={`${records.length} catatan`} icon={CheckCircle2} />
            <StatCard label="Pertemuan" value={sessions.length} hint={periodLabel(period)} icon={BarChart3} />
            <StatCard label="Siswa" value={students.length} hint={`${perStudent.filter((s) => s.rate < 75).length} perlu perhatian`} icon={Users} />
            <StatCard label="Jurnal tercatat" value={journals.length} hint={`${withObstacles} mencatat hambatan`} icon={BookMarked} />
          </div>

          <div className="rounded-2xl border border-border/60 bg-background p-5">
            <h2 className="text-base font-semibold tracking-tight">Tren kehadiran per pertemuan</h2>
            {trend.length === 0 ? (
              <p className="mt-2 text-sm text-muted-foreground">Belum ada pertemuan pada rentang waktu ini.</p>
            ) : (
              <div className="mt-4 h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={trend} margin={{ top: 5, right: 8, left: -18, bottom: 0 }}>
                    <defs>
                      <linearGradient id="rateFill" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity={0.35} />
                        <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                    <XAxis dataKey="name" fontSize={11} tickLine={false} axisLine={false} />
                    <YAxis domain={[0, 100]} fontSize={11} tickLine={false} axisLine={false} />
                    <Tooltip
                      contentStyle={{ borderRadius: 12, border: "1px solid hsl(var(--border))", fontSize: 12 }}
                      formatter={(value: number) => [`${value}%`, "Kehadiran"]}
                      labelFormatter={(_, payload) => payload?.[0]?.payload?.label ?? ""}
                    />
                    <Area type="monotone" dataKey="rate" stroke="hsl(var(--primary))" strokeWidth={2} fill="url(#rateFill)" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            )}
          </div>

          <div className="grid gap-4 lg:grid-cols-2">
            <div className="rounded-2xl border border-border/60 bg-background p-5">
              <h2 className="text-base font-semibold tracking-tight">Komposisi status kehadiran</h2>
              {composition.length === 0 ? (
                <p className="mt-2 text-sm text-muted-foreground">Belum ada catatan kehadiran.</p>
              ) : (
                <div className="mt-2 h-56 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie data={composition} dataKey="value" nameKey="name" innerRadius={45} outerRadius={75} paddingAngle={3}>
                        {composition.map((d) => (
                          <Cell key={d.status} fill={statusColors[d.status]} />
                        ))}
                      </Pie>
                      <Legend iconSize={8} wrapperStyle={{ fontSize: 12 }} />
                      <Tooltip contentStyle={{ borderRadius: 12, border: "1px solid hsl(var(--border))", fontSize: 12 }} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              )}
            </div>

            <div className="rounded-2xl border border-border/60 bg-background p-5">
              <h2 className="text-base font-semibold tracking-tight">Konsistensi jurnal per bulan</h2>
              {journalByMonth.length === 0 ? (
                <p className="mt-2 text-sm text-muted-foreground">Belum ada jurnal untuk kelas ini.</p>
              ) : (
                <div className="mt-2 h-56 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={journalByMonth} margin={{ top: 10, right: 8, left: -22, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                      <XAxis dataKey="name" fontSize={11} tickLine={false} axisLine={false} />
                      <YAxis allowDecimals={false} fontSize={11} tickLine={false} axisLine={false} />
                      <Tooltip contentStyle={{ borderRadius: 12, border: "1px solid hsl(var(--border))", fontSize: 12 }} />
                      <Bar dataKey="jurnal" fill="hsl(var(--primary))" radius={[6, 6, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              )}
            </div>
          </div>

          <div className="rounded-2xl border border-border/60 bg-background p-5">
            <h2 className="text-base font-semibold tracking-tight">Perkembangan tiap siswa</h2>
            <p className="mt-1 text-xs text-muted-foreground">
              Perubahan dibandingkan paruh pertemuan pertama vs paruh terakhir.
            </p>
            <div className="mt-3 overflow-x-auto">
              <table className="w-full min-w-[520px] text-sm">
                <thead>
                  <tr className="text-left text-xs uppercase tracking-wider text-muted-foreground">
                    <th className="py-2">Siswa</th>
                    <th className="py-2">Catatan</th>
                    <th className="py-2">Alpa</th>
                    <th className="py-2">Kehadiran</th>
                    <th className="py-2">Tren</th>
                  </tr>
                </thead>
                <tbody>
                  {perStudent.map((s) => (
                    <tr key={s.id} className="border-t border-border/50">
                      <td className="py-2 pr-3">{s.name}</td>
                      <td className="py-2">{s.total}</td>
                      <td className="py-2">{s.alpa}</td>
                      <td className="py-2">
                        <Badge variant={s.rate >= 80 ? "default" : s.rate >= 60 ? "secondary" : "destructive"}>
                          {s.rate}%
                        </Badge>
                      </td>
                      <td className="py-2">
                        <span
                          className={[
                            "inline-flex items-center gap-1 text-xs font-medium",
                            s.delta > 0 ? "text-primary" : s.delta < 0 ? "text-destructive" : "text-muted-foreground",
                          ].join(" ")}
                        >
                          {s.delta > 0 ? (
                            <TrendingUp className="h-3.5 w-3.5" />
                          ) : s.delta < 0 ? (
                            <TrendingDown className="h-3.5 w-3.5" />
                          ) : null}
                          {s.delta > 0 ? `+${s.delta}` : s.delta}%
                        </span>
                      </td>
                    </tr>
                  ))}
                  {perStudent.length === 0 && (
                    <tr>
                      <td colSpan={5} className="py-3 text-sm text-muted-foreground">
                        Belum ada siswa di kelas ini.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          <div className="rounded-2xl border border-border/60 bg-background p-5">
            <h2 className="text-base font-semibold tracking-tight">Ringkasan jurnal terbaru</h2>
            {journals.length === 0 ? (
              <p className="mt-2 text-sm text-muted-foreground">Belum ada jurnal.</p>
            ) : (
              <ul className="mt-3 space-y-2">
                {journals.slice(0, 6).map((j) => (
                  <li key={j.id} className="rounded-xl border border-border/50 bg-muted/20 p-3">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="text-sm font-medium">{j.topic}</p>
                      <span className="text-xs text-muted-foreground">{formatDay(j.journalDate)}</span>
                    </div>
                    {j.obstacles && (
                      <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">Hambatan: {j.obstacles}</p>
                    )}
                    {j.reflection && (
                      <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">Refleksi: {j.reflection}</p>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      )}
    </DashboardShell>
  );
}
