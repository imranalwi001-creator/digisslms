import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  PolarAngleAxis,
  PolarGrid,
  Radar,
  RadarChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Activity, Award, Loader2, TrendingUp, Users } from "lucide-react";
import { toast } from "sonner";
import { DashboardShell, StatCard } from "@/components/DashboardShell";
import { RequireRole } from "@/components/RequireRole";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { fetchAssessments, scoreBand, type Assessment } from "@/lib/rubrics";
import {
  attendanceRate,
  fetchRecords,
  fetchSessions,
  fetchStudentsByGrade,
  type AttendanceRecord,
  type AttendanceSession,
  type StudentLite,
} from "@/lib/teaching";
import { semesterLabel, useTerms } from "@/lib/terms";

export const Route = createFileRoute("/admin/progres")({
  head: () => ({
    meta: [
      { title: "Progres siswa — Continuum LMS" },
      {
        name: "description",
        content: "Visualisasi perkembangan siswa: kehadiran, nilai kuis, tugas, dan penilaian rubrik per periode.",
      },
      { property: "og:title", content: "Progres siswa — Continuum LMS" },
      { property: "og:description", content: "Pantau kehadiran dan capaian nilai setiap siswa dalam satu dasbor." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: () => <RequireRole role="staff">{() => <ProgressPage />}</RequireRole>,
});

type Row = {
  id: string;
  name: string;
  attendance: number;
  quiz: number;
  assignment: number;
  rubric: number;
  overall: number;
  sessions: number;
};

const avg = (nums: number[]) => (nums.length ? Math.round(nums.reduce((a, b) => a + b, 0) / nums.length) : 0);

function ProgressPage() {
  const { terms, active } = useTerms();
  const [grade, setGrade] = useState("7");
  const [termId, setTermId] = useState<string>("all");
  const [loading, setLoading] = useState(true);

  const [students, setStudents] = useState<StudentLite[]>([]);
  const [sessions, setSessions] = useState<AttendanceSession[]>([]);
  const [records, setRecords] = useState<AttendanceRecord[]>([]);
  const [assessments, setAssessments] = useState<Assessment[]>([]);
  const [quiz, setQuiz] = useState<Array<{ userId: string; percent: number }>>([]);
  const [tasks, setTasks] = useState<Array<{ userId: string; percent: number }>>([]);
  const [selected, setSelected] = useState<string>("");

  useEffect(() => {
    if (active && termId === "all") setTermId(active.id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [active?.id]);

  useEffect(() => {
    let alive = true;
    setLoading(true);
    (async () => {
      const g = Number(grade);
      const filterTerm = termId === "all" ? null : termId;
      const { supabase } = await import("@/integrations/supabase/client");
      const [roster, sess, assess, attempts, subs] = await Promise.all([
        fetchStudentsByGrade(g),
        fetchSessions(g, filterTerm),
        fetchAssessments(),
        (supabase as any).from("quiz_attempts").select("user_id, score, max_score, completed_at"),
        (supabase as any).from("assignment_submissions").select("user_id, score, assignment_id, status"),
      ]);
      const recs = sess.length ? await fetchRecords(sess.map((s) => s.id)) : [];
      const assignments = await (supabase as any).from("assignments").select("id, max_score");
      if (!alive) return;

      setStudents(roster);
      setSessions(sess);
      setRecords(recs);
      setAssessments(filterTerm ? assess.filter((a) => a.termId === filterTerm) : assess);
      setQuiz(
        ((attempts.data || []) as any[])
          .filter((a) => a.completed_at)
          .map((a) => ({ userId: a.user_id, percent: a.max_score ? Math.round((a.score / a.max_score) * 100) : 0 })),
      );
      const maxById = new Map<string, number>(((assignments.data || []) as any[]).map((a) => [a.id, a.max_score || 100]));
      setTasks(
        ((subs.data || []) as any[])
          .filter((s) => typeof s.score === "number")
          .map((s) => ({
            userId: s.user_id,
            percent: Math.round((s.score / (maxById.get(s.assignment_id) || 100)) * 100),
          })),
      );
      setLoading(false);
    })().catch(() => {
      if (!alive) return;
      toast.error("Gagal memuat data progres");
      setLoading(false);
    });
    return () => {
      alive = false;
    };
  }, [grade, termId]);

  const rows: Row[] = useMemo(() => {
    return students
      .map((s) => {
        const myRecords = records.filter((r) => r.studentId === s.id);
        const attendance = myRecords.length ? attendanceRate(myRecords) : 0;
        const quizAvg = avg(quiz.filter((q) => q.userId === s.id).map((q) => q.percent));
        const taskAvg = avg(tasks.filter((t) => t.userId === s.id).map((t) => t.percent));
        const rubricAvg = avg(assessments.filter((a) => a.studentId === s.id).map((a) => a.totalScore));
        const parts = [attendance, quizAvg, taskAvg, rubricAvg].filter((v) => v > 0);
        return {
          id: s.id,
          name: s.name,
          attendance,
          quiz: quizAvg,
          assignment: taskAvg,
          rubric: rubricAvg,
          overall: avg(parts),
          sessions: myRecords.length,
        };
      })
      .sort((a, b) => b.overall - a.overall);
  }, [students, records, quiz, tasks, assessments]);

  const summary = useMemo(
    () => ({
      students: rows.length,
      attendance: avg(rows.map((r) => r.attendance)),
      score: avg(rows.map((r) => Math.round((r.quiz + r.assignment + r.rubric) / 3))),
      needAttention: rows.filter((r) => r.overall > 0 && r.overall < 70).length,
    }),
    [rows],
  );

  const focus = rows.find((r) => r.id === selected) ?? rows[0];

  const radarData = focus
    ? [
        { metric: "Kehadiran", value: focus.attendance },
        { metric: "Kuis", value: focus.quiz },
        { metric: "Tugas", value: focus.assignment },
        { metric: "Rubrik", value: focus.rubric },
      ]
    : [];

  const barColor = (v: number) =>
    v >= 85 ? "hsl(var(--primary))" : v >= 70 ? "hsl(var(--chart-2, var(--primary)))" : "hsl(var(--destructive))";

  return (
    <DashboardShell
      role="staff"
      title="Progres perkembangan siswa"
      subtitle="Gabungan kehadiran, kuis, tugas, dan rubrik dalam satu tampilan."
      actions={
        <div className="flex gap-2">
          <Select value={grade} onValueChange={setGrade}>
            <SelectTrigger className="h-9 w-32">
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
          <Select value={termId} onValueChange={setTermId}>
            <SelectTrigger className="h-9 w-52">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Semua periode</SelectItem>
              {terms.map((t) => (
                <SelectItem key={t.id} value={t.id}>
                  {t.yearLabel} · {semesterLabel(t.semester)}
                  {t.isActive ? " (aktif)" : ""}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      }
    >
      {loading ? (
        <div className="flex h-64 items-center justify-center">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      ) : (
        <div className="space-y-6">
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <StatCard label="Siswa" value={summary.students} hint={`Kelas ${grade}`} icon={Users} />
            <StatCard label="Rata-rata kehadiran" value={`${summary.attendance}%`} hint={`${sessions.length} pertemuan`} icon={Activity} />
            <StatCard label="Rata-rata nilai" value={`${summary.score}%`} hint={scoreBand(summary.score)} icon={Award} />
            <StatCard label="Perlu perhatian" value={summary.needAttention} hint="Capaian di bawah 70%" icon={TrendingUp} />
          </div>

          <div className="grid gap-5 lg:grid-cols-3">
            <div className="rounded-2xl border border-border/60 bg-background p-5 lg:col-span-2">
              <h2 className="text-sm font-semibold">Capaian per siswa</h2>
              <p className="mb-4 text-xs text-muted-foreground">Klik batang untuk melihat rincian siswa.</p>
              <div className="h-80 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={rows} margin={{ top: 8, right: 8, left: -20, bottom: 40 }}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-border" vertical={false} />
                    <XAxis dataKey="name" tick={{ fontSize: 11 }} interval={0} angle={-35} textAnchor="end" height={60} />
                    <YAxis domain={[0, 100]} tick={{ fontSize: 11 }} />
                    <Tooltip
                      contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 12 }}
                      formatter={(v: number) => [`${v}%`, "Capaian"]}
                    />
                    <Bar dataKey="overall" radius={[6, 6, 0, 0]} onClick={(d: any) => setSelected(d?.id)}>
                      {rows.map((r) => (
                        <Cell key={r.id} fill={barColor(r.overall)} cursor="pointer" />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="rounded-2xl border border-border/60 bg-background p-5">
              <h2 className="text-sm font-semibold">{focus ? focus.name : "Rincian siswa"}</h2>
              <p className="mb-2 text-xs text-muted-foreground">
                {focus ? `Capaian ${focus.overall}% · ${scoreBand(focus.overall)}` : "Belum ada data"}
              </p>
              <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <RadarChart data={radarData} outerRadius="72%">
                    <PolarGrid className="stroke-border" />
                    <PolarAngleAxis dataKey="metric" tick={{ fontSize: 11 }} />
                    <Radar dataKey="value" stroke="hsl(var(--primary))" fill="hsl(var(--primary))" fillOpacity={0.25} />
                    <Tooltip
                      contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 12 }}
                      formatter={(v: number) => [`${v}%`, "Nilai"]}
                    />
                  </RadarChart>
                </ResponsiveContainer>
              </div>
              {focus ? (
                <p className="text-xs text-muted-foreground">
                  Tercatat pada {focus.sessions} pertemuan absensi di periode terpilih.
                </p>
              ) : null}
            </div>
          </div>

          <div className="rounded-2xl border border-border/60 bg-background p-5">
            <h2 className="text-sm font-semibold">Perbandingan komponen nilai</h2>
            <p className="mb-4 text-xs text-muted-foreground">Kehadiran, kuis, tugas, dan rubrik berdampingan.</p>
            <div className="h-80 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={rows} margin={{ top: 8, right: 8, left: -20, bottom: 40 }}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-border" vertical={false} />
                  <XAxis dataKey="name" tick={{ fontSize: 11 }} interval={0} angle={-35} textAnchor="end" height={60} />
                  <YAxis domain={[0, 100]} tick={{ fontSize: 11 }} />
                  <Tooltip
                    contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 12 }}
                  />
                  <Legend wrapperStyle={{ fontSize: 12 }} />
                  <Bar dataKey="attendance" name="Kehadiran" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="quiz" name="Kuis" fill="hsl(var(--primary) / 0.6)" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="assignment" name="Tugas" fill="hsl(var(--primary) / 0.4)" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="rubric" name="Rubrik" fill="hsl(var(--muted-foreground) / 0.5)" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="overflow-hidden rounded-2xl border border-border/60 bg-background">
            <div className="border-b border-border/60 px-5 py-4">
              <h2 className="text-sm font-semibold">Rekap siswa</h2>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[640px] text-sm">
                <thead className="bg-muted/40 text-xs text-muted-foreground">
                  <tr>
                    <th className="px-5 py-3 text-left font-medium">Siswa</th>
                    <th className="px-3 py-3 text-right font-medium">Kehadiran</th>
                    <th className="px-3 py-3 text-right font-medium">Kuis</th>
                    <th className="px-3 py-3 text-right font-medium">Tugas</th>
                    <th className="px-3 py-3 text-right font-medium">Rubrik</th>
                    <th className="px-5 py-3 text-right font-medium">Capaian</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/60">
                  {rows.map((r) => (
                    <tr
                      key={r.id}
                      className="cursor-pointer hover:bg-muted/30"
                      onClick={() => setSelected(r.id)}
                    >
                      <td className="px-5 py-3">{r.name}</td>
                      <td className="px-3 py-3 text-right">{r.attendance}%</td>
                      <td className="px-3 py-3 text-right">{r.quiz}%</td>
                      <td className="px-3 py-3 text-right">{r.assignment}%</td>
                      <td className="px-3 py-3 text-right">{r.rubric}%</td>
                      <td className="px-5 py-3 text-right">
                        <Badge variant={r.overall >= 70 ? "secondary" : "outline"}>{r.overall}%</Badge>
                      </td>
                    </tr>
                  ))}
                  {!rows.length && (
                    <tr>
                      <td colSpan={6} className="px-5 py-10 text-center text-sm text-muted-foreground">
                        Belum ada siswa pada kelas ini.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </DashboardShell>
  );
}
