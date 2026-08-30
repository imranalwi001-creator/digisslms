import { Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { Loader2, Trophy, Medal, Flame, ArrowRight } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { listLeaderboard } from "@/lib/social.functions";
import type { PublicStudent } from "@/lib/achievements";

/** Papan peringkat siswa — dipakai langsung di dalam dashboard siswa. */
export function LeaderboardPanel({ userId, grade }: { userId: string; grade: number | null }) {
  const fetchBoard = useServerFn(listLeaderboard);
  const [students, setStudents] = useState<PublicStudent[]>([]);
  const [loading, setLoading] = useState(true);
  const [range, setRange] = useState<"all" | "week">("all");
  const [filterGrade, setFilterGrade] = useState<number | null>(grade ?? null);

  useEffect(() => {
    let active = true;
    setLoading(true);
    fetchBoard({ data: { grade: filterGrade, range } })
      .then((res) => {
        if (active) setStudents((res?.students as PublicStudent[]) || []);
      })
      .catch((err: any) => {
        console.warn("Gagal memuat peringkat:", err);
      })
      .finally(() => active && setLoading(false));
    return () => {
      active = false;
    };
  }, [filterGrade, range, fetchBoard]);

  const myIndex = students.findIndex((s) => s.id === userId);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center gap-2">
        {[7, 8, 9].map((g) => (
          <Button key={g} size="sm" variant={filterGrade === g ? "default" : "outline"} onClick={() => setFilterGrade(g)}>
            Kelas {g}
          </Button>
        ))}
        <Button size="sm" variant={filterGrade === null ? "default" : "outline"} onClick={() => setFilterGrade(null)}>
          Semua
        </Button>
        <div className="ml-auto flex gap-2">
          <Button size="sm" variant={range === "all" ? "secondary" : "ghost"} onClick={() => setRange("all")}>
            <Trophy className="mr-1.5 h-4 w-4" /> Total
          </Button>
          <Button size="sm" variant={range === "week" ? "secondary" : "ghost"} onClick={() => setRange("week")}>
            <Flame className="mr-1.5 h-4 w-4" /> Minggu ini
          </Button>
        </div>
      </div>

      {loading ? (
        <div className="flex h-64 items-center justify-center">
          <Loader2 className="h-6 w-6 animate-spin text-primary" />
        </div>
      ) : students.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border bg-background p-10 text-center text-sm text-muted-foreground">
          Belum ada data prestasi untuk filter ini.
        </div>
      ) : (
        <>
          <div className="grid gap-4 sm:grid-cols-3">
            {students.slice(0, 3).map((s, i) => (
              <Link
                key={s.id}
                to="/siswa/$id"
                params={{ id: s.id }}
                className="rounded-2xl border border-border/60 bg-background p-5 transition-all hover:border-primary/40 hover:shadow-sm"
              >
                <div className="flex items-center gap-3">
                  <div
                    className={`flex h-11 w-11 items-center justify-center rounded-full text-sm font-bold ${
                      i === 0
                        ? "bg-amber-100 text-amber-700"
                        : i === 1
                          ? "bg-slate-100 text-slate-600"
                          : "bg-orange-100 text-orange-700"
                    }`}
                  >
                    #{i + 1}
                  </div>
                  <div className="min-w-0">
                    <p className="truncate font-semibold">{s.display_name || "Siswa"}</p>
                    <p className="text-xs text-muted-foreground">Kelas {s.grade ?? "-"}</p>
                  </div>
                </div>
                <p className="mt-4 text-2xl font-bold tracking-tight">{s.score}</p>
                <p className="text-xs text-muted-foreground">
                  {s.completed_modules} modul · {s.certificates} sertifikat
                </p>
              </Link>
            ))}
          </div>

          <div className="overflow-hidden rounded-2xl border border-border/60 bg-background">
            <table className="w-full text-sm">
              <thead className="bg-muted/40 text-xs uppercase tracking-wide text-muted-foreground">
                <tr>
                  <th className="px-4 py-3 text-left">#</th>
                  <th className="px-4 py-3 text-left">Siswa</th>
                  <th className="px-4 py-3 text-left">Kelas</th>
                  <th className="hidden px-4 py-3 text-left sm:table-cell">Modul</th>
                  <th className="hidden px-4 py-3 text-left md:table-cell">Rata kuis</th>
                  <th className="hidden px-4 py-3 text-left md:table-cell">Sertifikat</th>
                  <th className="px-4 py-3 text-right">Skor</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/60">
                {students.slice(0, 20).map((s, i) => (
                  <tr key={s.id} className={s.id === userId ? "bg-primary/5" : undefined}>
                    <td className="px-4 py-3 font-medium text-muted-foreground">{i + 1}</td>
                    <td className="px-4 py-3">
                      <Link to="/siswa/$id" params={{ id: s.id }} className="font-medium hover:text-primary hover:underline">
                        {s.display_name || "Siswa"}
                      </Link>
                      {s.id === userId && (
                        <Badge variant="secondary" className="ml-2">
                          Kamu
                        </Badge>
                      )}
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">{s.grade ?? "-"}</td>
                    <td className="hidden px-4 py-3 sm:table-cell">{s.completed_modules}</td>
                    <td className="hidden px-4 py-3 md:table-cell">{s.avg_quiz_score}</td>
                    <td className="hidden px-4 py-3 md:table-cell">{s.certificates}</td>
                    <td className="px-4 py-3 text-right font-semibold">{s.score}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {myIndex >= 20 && (
            <div className="flex items-center justify-between rounded-2xl border border-primary/30 bg-primary/5 px-4 py-3 text-sm">
              <span>
                <Medal className="mr-1.5 inline h-4 w-4 text-primary" />
                Posisimu saat ini: <strong>#{myIndex + 1}</strong> dari {students.length} siswa
              </span>
              <Button size="sm" variant="ghost" asChild>
                <Link to="/siswa/$id" params={{ id: userId }}>
                  Profil saya <ArrowRight className="ml-1 h-4 w-4" />
                </Link>
              </Button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
