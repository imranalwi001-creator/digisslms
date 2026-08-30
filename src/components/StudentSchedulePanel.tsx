import { useEffect, useState } from "react";
import { CalendarDays, CheckCircle2, Clock, Loader2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { ClassReminderCard } from "@/components/ClassReminderCard";
import {
  attendanceRate,
  dayNames,
  fetchMyAttendance,
  fetchSchedules,
  formatDay,
  statusLabel,
  type AttendanceRecord,
  type AttendanceSession,
  type Schedule,
} from "@/lib/teaching";

type Attendance = AttendanceRecord & { session: AttendanceSession | null };

/** Read-only weekly schedule + personal attendance recap for a student. */
export function StudentSchedulePanel({ userId, grade }: { userId: string; grade: number | null }) {
  const [schedules, setSchedules] = useState<Schedule[]>([]);
  const [attendance, setAttendance] = useState<Attendance[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const [s, a] = await Promise.all([
          fetchSchedules(grade ?? undefined),
          fetchMyAttendance(userId),
        ]);
        if (!active) return;
        setSchedules(s);
        setAttendance(a);
      } catch {
        /* ignore */
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => {
      active = false;
    };
  }, [userId, grade]);

  if (loading) {
    return (
      <div className="flex h-28 items-center justify-center rounded-2xl border border-border/60 bg-background">
        <Loader2 className="h-5 w-5 animate-spin text-primary" />
      </div>
    );
  }

  if (!schedules.length && !attendance.length) return null;

  const rate = attendanceRate(attendance);
  const recent = [...attendance]
    .sort((a, b) => (b.session?.sessionDate ?? "").localeCompare(a.session?.sessionDate ?? ""))
    .slice(0, 5);

  return (
    <section className="grid gap-4 lg:grid-cols-2">
      <div className="lg:col-span-2">
        <ClassReminderCard schedules={schedules} audience="student" />
      </div>
      <div className="rounded-2xl border border-border/60 bg-background p-5">
        <h2 className="flex items-center gap-2 text-base font-semibold tracking-tight">
          <CalendarDays className="h-4 w-4 text-primary" /> Jadwal mingguan
        </h2>
        {schedules.length === 0 ? (
          <p className="mt-2 text-sm text-muted-foreground">Guru belum menyusun jadwal untuk kelasmu.</p>
        ) : (
          <ul className="mt-3 space-y-2">
            {schedules.map((s) => (
              <li key={s.id} className="flex items-center justify-between gap-3 rounded-xl border border-border/50 bg-muted/20 px-3 py-2">
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium">{s.title}</p>
                  <p className="text-xs text-muted-foreground">
                    {dayNames[s.dayOfWeek]} · {s.startTime}–{s.endTime}
                    {s.room ? ` · ${s.room}` : ""}
                  </p>
                </div>
                <Clock className="h-4 w-4 shrink-0 text-muted-foreground" />
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="rounded-2xl border border-border/60 bg-background p-5">
        <div className="flex items-center justify-between">
          <h2 className="flex items-center gap-2 text-base font-semibold tracking-tight">
            <CheckCircle2 className="h-4 w-4 text-primary" /> Kehadiranku
          </h2>
          <Badge variant={rate >= 80 ? "default" : rate >= 60 ? "secondary" : "destructive"}>{rate}%</Badge>
        </div>
        {recent.length === 0 ? (
          <p className="mt-2 text-sm text-muted-foreground">Belum ada catatan kehadiran.</p>
        ) : (
          <ul className="mt-3 space-y-2">
            {recent.map((r) => (
              <li key={r.id} className="flex items-center justify-between gap-3 rounded-xl border border-border/50 bg-muted/20 px-3 py-2">
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium">{r.session?.topic ?? "Pertemuan"}</p>
                  <p className="text-xs text-muted-foreground">
                    {r.session ? formatDay(r.session.sessionDate) : "—"}
                  </p>
                </div>
                <Badge variant={r.status === "hadir" ? "default" : r.status === "alpa" ? "destructive" : "secondary"}>
                  {statusLabel[r.status]}
                </Badge>
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  );
}
