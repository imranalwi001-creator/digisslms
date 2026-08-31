import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { CheckCircle2, ClipboardCheck, Download, FileText, Loader2, Plus, Trash2, Upload, Users, AlertTriangle } from "lucide-react";
import { toast } from "sonner";
import { DashboardShell, StatCard } from "@/components/DashboardShell";
import { RequireRole } from "@/components/RequireRole";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useAdminAction } from "@/lib/admin-action";
import { downloadCsv, printTablePdf } from "@/lib/export-utils";
import { csvTemplate, statusHint, validateImport, type ImportResult } from "@/lib/attendance-import";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  attendanceRate,
  attendanceStatuses,
  createSession,
  deleteSession,
  fetchRecords,
  fetchSessions,
  fetchStudentsByGrade,
  formatDay,
  saveRecordsBulk,
  statusLabel,
  type AttendanceRecord,
  type AttendanceSession,
  type AttendanceStatus,
  type StudentLite,
} from "@/lib/teaching";

export const Route = createFileRoute("/admin/absensi")({
  head: () => ({
    meta: [
      { title: "Absensi kelas — Digisschool LMS" },
      { name: "description", content: "Rekap kehadiran siswa per pertemuan secara real-time untuk kelas 7, 8, dan 9." },
      { property: "og:title", content: "Absensi kelas — Digisschool LMS" },
      { property: "og:description", content: "Catat dan rekap kehadiran siswa tiap pertemuan." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: () => <RequireRole role="staff">{({ userId }) => <AttendancePage userId={userId} />}</RequireRole>,
});

const today = () => new Date().toISOString().slice(0, 10);

function AttendancePage({ userId }: { userId: string }) {
  const [grade, setGrade] = useState("7");
  const [sessions, setSessions] = useState<AttendanceSession[]>([]);
  const [records, setRecords] = useState<AttendanceRecord[]>([]);
  const [students, setStudents] = useState<StudentLite[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [topic, setTopic] = useState("");
  const [importOpen, setImportOpen] = useState(false);
  const [importText, setImportText] = useState("");
  const [date, setDate] = useState(today());
  const [draft, setDraft] = useState<Record<string, AttendanceStatus>>({});
  const { run, isPending, busy } = useAdminAction();

  const load = async (g: string) => {
    setLoading(true);
    try {
      const [s, r] = await Promise.all([fetchSessions(Number(g)), fetchStudentsByGrade(Number(g))]);
      setSessions(s);
      setStudents(r);
      const recs = await fetchRecords(s.map((x) => x.id));
      setRecords(recs);
      setActiveId((prev) => (prev && s.some((x) => x.id === prev) ? prev : (s[0]?.id ?? null)));
    } catch (err: any) {
      toast.error(err.message || "Gagal memuat absensi");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load(grade);
  }, [grade]);

  const active = sessions.find((s) => s.id === activeId) ?? null;

  useEffect(() => {
    if (!active) {
      setDraft({});
      return;
    }
    const map: Record<string, AttendanceStatus> = {};
    for (const st of students) {
      const rec = records.find((r) => r.sessionId === active.id && r.studentId === st.id);
      map[st.id] = rec?.status ?? "hadir";
    }
    setDraft(map);
  }, [activeId, students, records, active]);

  const gradeRecords = useMemo(
    () => records.filter((r) => sessions.some((s) => s.id === r.sessionId)),
    [records, sessions],
  );

  const perStudent = useMemo(
    () =>
      students.map((st) => {
        const mine = gradeRecords.filter((r) => r.studentId === st.id);
        return {
          ...st,
          total: mine.length,
          hadir: mine.filter((r) => r.status === "hadir").length,
          alpa: mine.filter((r) => r.status === "alpa").length,
          rate: attendanceRate(mine),
        };
      }),
    [students, gradeRecords],
  );

  const addSession = async () => {
    const created = await run(
      "new-session",
      { loading: "Membuat pertemuan...", success: "Pertemuan dibuat", error: "Gagal membuat pertemuan" },
      () =>
        createSession({
          grade: Number(grade),
          sessionDate: date,
          meetingNumber: sessions.length + 1,
          topic: topic.trim() || "Pertemuan Digital Class",
          materialSlug: null,
          userId,
        }),
    );
    if (!created) return;
    setTopic("");
    await load(grade);
    setActiveId(created.id);
  };

  const removeSession = async (id: string) => {
    const ok = await run(
      `del-${id}`,
      { loading: "Menghapus pertemuan...", success: "Pertemuan dihapus", error: "Gagal menghapus pertemuan" },
      async () => {
        await deleteSession(id);
        return true;
      },
    );
    if (ok) await load(grade);
  };

  const saveAll = async () => {
    if (!active) return;
    const ok = await run(
      "save-records",
      { loading: "Menyimpan kehadiran...", success: "Kehadiran tersimpan", error: "Gagal menyimpan kehadiran" },
      async () => {
        await saveRecordsBulk(
          active.id,
          students.map((st) => ({ studentId: st.id, status: draft[st.id] ?? "hadir" })),
        );
        return true;
      },
    );
    if (ok) await load(grade);
  };

  const markAll = (status: AttendanceStatus) =>
    setDraft(Object.fromEntries(students.map((s) => [s.id, status])));

  const presentNow = students.filter((s) => draft[s.id] === "hadir").length;

  /** Matrix: one row per student, one column per meeting, plus a recap. */
  const buildExport = () => {
    const ordered = [...sessions].sort((a, b) => a.sessionDate.localeCompare(b.sessionDate));
    const head = ["Siswa", ...ordered.map((s) => `${s.sessionDate} · ${s.topic}`), "Hadir", "Alpa", "Persentase"];
    const rows = perStudent.map((st) => [
      st.name,
      ...ordered.map((s) => {
        const rec = records.find((r) => r.sessionId === s.id && r.studentId === st.id);
        return rec ? statusLabel[rec.status] : "-";
      }),
      `${st.hadir}/${st.total}`,
      st.alpa,
      `${st.rate}%`,
    ]);
    return { head, rows, ordered };
  };

  const exportCsv = () => {
    const { head, rows } = buildExport();
    downloadCsv(`rekap-absensi-kelas-${grade}-${today()}`, [head, ...rows]);
    toast.success("Rekap CSV diunduh");
  };

  const preview: ImportResult | null = useMemo(
    () => (importText.trim() ? validateImport(importText, students) : null),
    [importText, students],
  );

  const downloadTemplate = () => {
    downloadCsv(`template-absensi-kelas-${grade}`, csvTemplate(students));
    toast.success("Template CSV diunduh");
  };

  /** Applies only valid rows onto the active meeting. */
  const applyImport = async () => {
    if (!active || !preview) return;
    const ok = await run(
      "import-csv",
      { loading: "Mengimpor absensi...", success: "Absensi terimpor", error: "Gagal mengimpor absensi" },
      async () => {
        await saveRecordsBulk(
          active.id,
          preview.valid.map((r) => ({ studentId: r.studentId!, status: r.status!, note: r.note })),
        );
        return true;
      },
    );
    if (ok) {
      setImportOpen(false);
      setImportText("");
      await load(grade);
    }
  };

  const exportPdf = () => {
    try {
      const { head, rows } = buildExport();
      printTablePdf({
        title: `Rekap absensi Kelas ${grade}`,
        subtitle: `Digital Class · ${sessions.length} pertemuan · rata-rata kehadiran ${attendanceRate(gradeRecords)}%`,
        head,
        rows,
        footer: `Dicetak ${formatDay(today())} — Digisschool LMS`,
      });
    } catch (err: any) {
      toast.error(err.message || "Gagal menyiapkan PDF");
    }
  };

  return (
    <DashboardShell
      role="staff"
      title="Absensi kelas"
      subtitle="Rekap kehadiran per pertemuan, langsung tersimpan"
      actions={
        <Select value={grade} onValueChange={setGrade}>
          <SelectTrigger className="w-32"><SelectValue /></SelectTrigger>
          <SelectContent>
            {[7, 8, 9].map((g) => (
              <SelectItem key={g} value={String(g)}>Kelas {g}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      }
    >
      {loading ? (
        <div className="flex h-40 items-center justify-center">
          <Loader2 className="h-6 w-6 animate-spin text-primary" />
        </div>
      ) : (
        <div className="space-y-6">
          <div className="grid gap-4 sm:grid-cols-3">
            <StatCard label="Siswa di kelas" value={students.length} icon={Users} />
            <StatCard label="Total pertemuan" value={sessions.length} icon={ClipboardCheck} />
            <StatCard
              label="Rata-rata kehadiran"
              value={`${attendanceRate(gradeRecords)}%`}
              hint={`${gradeRecords.length} catatan`}
              icon={CheckCircle2}
            />
          </div>

          <div className="grid gap-6 lg:grid-cols-[320px_1fr]">
            <div className="space-y-4">
              <div className="space-y-3 rounded-2xl border border-border/60 bg-background p-5">
                <h2 className="text-base font-semibold tracking-tight">Pertemuan baru</h2>
                <div className="space-y-2">
                  <Label htmlFor="date">Tanggal</Label>
                  <Input id="date" type="date" value={date} onChange={(e) => setDate(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="topic">Topik</Label>
                  <Input id="topic" value={topic} onChange={(e) => setTopic(e.target.value)} placeholder="Misal: Praktik Excel dasar" />
                </div>
                <Button className="w-full" onClick={addSession} disabled={busy}>
                  {isPending("new-session") ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Plus className="mr-2 h-4 w-4" />}
                  Buat pertemuan
                </Button>
              </div>

              <div className="rounded-2xl border border-border/60 bg-background p-4">
                <p className="text-sm font-semibold tracking-tight">Riwayat pertemuan</p>
                <ul className="mt-3 space-y-2">
                  {sessions.length === 0 && <li className="text-xs text-muted-foreground">Belum ada pertemuan.</li>}
                  {sessions.map((s) => (
                    <li key={s.id}>
                      <div
                        className={[
                          "flex items-center justify-between gap-2 rounded-xl border px-3 py-2 text-left",
                          s.id === activeId ? "border-primary bg-primary/5" : "border-border/50",
                        ].join(" ")}
                      >
                        <button className="min-w-0 flex-1 text-left" onClick={() => setActiveId(s.id)}>
                          <p className="truncate text-sm font-medium">{s.topic}</p>
                          <p className="text-xs text-muted-foreground">{formatDay(s.sessionDate)}</p>
                        </button>
                        <Button size="icon" variant="ghost" aria-label="Hapus pertemuan" disabled={busy} onClick={() => removeSession(s.id)}>
                          {isPending(`del-${s.id}`) ? (
                            <Loader2 className="h-3.5 w-3.5 animate-spin" />
                          ) : (
                            <Trash2 className="h-3.5 w-3.5 text-destructive" />
                          )}
                        </Button>
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            <div className="space-y-4">
              <div className="rounded-2xl border border-border/60 bg-background p-5">
                {!active ? (
                  <p className="text-sm text-muted-foreground">Pilih atau buat pertemuan untuk mulai mengabsen.</p>
                ) : students.length === 0 ? (
                  <p className="text-sm text-muted-foreground">Belum ada siswa terdaftar di kelas {grade}.</p>
                ) : (
                  <>
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <div>
                        <h2 className="text-base font-semibold tracking-tight">{active.topic}</h2>
                        <p className="text-xs text-muted-foreground">
                          {formatDay(active.sessionDate)} · hadir {presentNow}/{students.length}
                        </p>
                      </div>
                      <div className="flex gap-2">
                        <Button size="sm" variant="outline" onClick={() => markAll("hadir")} disabled={busy}>
                          Tandai semua hadir
                        </Button>
                        <Button size="sm" onClick={saveAll} disabled={busy}>
                          {isPending("save-records") && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                          Simpan
                        </Button>
                      </div>
                    </div>

                    <ul className="mt-4 space-y-2">
                      {students.map((st) => (
                        <li
                          key={st.id}
                          className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-border/50 bg-muted/20 px-3 py-2"
                        >
                          <span className="truncate text-sm font-medium">{st.name}</span>
                          <div className="flex flex-wrap gap-1">
                            {attendanceStatuses.map((s) => (
                              <button
                                key={s}
                                onClick={() => setDraft((prev) => ({ ...prev, [st.id]: s }))}
                                className={[
                                  "rounded-lg px-2.5 py-1 text-xs font-medium transition-colors",
                                  draft[st.id] === s
                                    ? "bg-primary text-primary-foreground"
                                    : "bg-background text-muted-foreground hover:bg-muted",
                                ].join(" ")}
                              >
                                {statusLabel[s]}
                              </button>
                            ))}
                          </div>
                        </li>
                      ))}
                    </ul>
                  </>
                )}
              </div>

              <div className="rounded-2xl border border-border/60 bg-background p-5">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <h2 className="text-base font-semibold tracking-tight">Rekap kehadiran siswa</h2>
                  <div className="flex flex-wrap gap-2">
                    <Button size="sm" variant="outline" onClick={() => setImportOpen(true)} disabled={!active}>
                      <Upload className="mr-2 h-4 w-4" /> Impor CSV
                    </Button>
                    <Button size="sm" variant="outline" onClick={exportCsv} disabled={perStudent.length === 0}>
                      <Download className="mr-2 h-4 w-4" /> CSV
                    </Button>
                    <Button size="sm" variant="outline" onClick={exportPdf} disabled={perStudent.length === 0}>
                      <FileText className="mr-2 h-4 w-4" /> PDF
                    </Button>
                  </div>

                </div>
                <div className="mt-3 overflow-x-auto">
                  <table className="w-full min-w-[440px] text-sm">
                    <thead>
                      <tr className="text-left text-xs uppercase tracking-wider text-muted-foreground">
                        <th className="py-2">Siswa</th>
                        <th className="py-2">Hadir</th>
                        <th className="py-2">Alpa</th>
                        <th className="py-2">Persentase</th>
                      </tr>
                    </thead>
                    <tbody>
                      {perStudent.map((s) => (
                        <tr key={s.id} className="border-t border-border/50">
                          <td className="py-2 pr-3">{s.name}</td>
                          <td className="py-2">{s.hadir}/{s.total}</td>
                          <td className="py-2">{s.alpa}</td>
                          <td className="py-2">
                            <Badge variant={s.rate >= 80 ? "default" : s.rate >= 60 ? "secondary" : "destructive"}>
                              {s.rate}%
                            </Badge>
                          </td>
                        </tr>
                      ))}
                      {perStudent.length === 0 && (
                        <tr>
                          <td colSpan={4} className="py-3 text-sm text-muted-foreground">
                            Belum ada data.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      <Dialog open={importOpen} onOpenChange={setImportOpen}>
        <DialogContent className="max-h-[88vh] max-w-2xl overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Impor absensi dari CSV</DialogTitle>
            <DialogDescription>
              Format kolom: <strong>Nama siswa, Status, Catatan</strong>. Status bisa {statusHint} (atau H/I/S/A).
              Data akan diterapkan ke pertemuan {active ? `${active.sessionDate} · ${active.topic}` : "aktif"}.
            </DialogDescription>
          </DialogHeader>

          <div className="flex flex-wrap gap-2">
            <Button size="sm" variant="outline" onClick={downloadTemplate}>
              <Download className="mr-2 h-4 w-4" /> Unduh template
            </Button>
            <label className="inline-flex">
              <input
                type="file"
                accept=".csv,text/csv"
                className="hidden"
                onChange={async (e) => {
                  const file = e.target.files?.[0];
                  if (file) setImportText(await file.text());
                  e.target.value = "";
                }}
              />
              <span className="inline-flex h-8 cursor-pointer items-center rounded-md border border-border px-3 text-sm">
                <Upload className="mr-2 h-4 w-4" /> Pilih berkas CSV
              </span>
            </label>
          </div>

          <textarea
            value={importText}
            onChange={(e) => setImportText(e.target.value)}
            rows={7}
            placeholder={"Nama siswa,Status,Catatan\nBudi Santoso,hadir,\nSiti Aminah,izin,Acara keluarga"}
            className="w-full rounded-xl border border-border bg-background p-3 font-mono text-xs"
          />

          {preview && (
            <div className="space-y-3">
              <div className="flex flex-wrap gap-2 text-xs">
                <Badge variant="default">{preview.valid.length} baris valid</Badge>
                <Badge variant={preview.errors.length ? "destructive" : "secondary"}>
                  {preview.errors.length} bermasalah
                </Badge>
                {preview.missing.length > 0 && (
                  <Badge variant="secondary">{preview.missing.length} siswa belum tercantum</Badge>
                )}
              </div>

              {preview.errors.length > 0 && (
                <ul className="space-y-1 rounded-xl border border-destructive/40 bg-destructive/5 p-3 text-xs">
                  {preview.errors.slice(0, 8).map((r) => (
                    <li key={r.line} className="flex gap-2">
                      <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0 text-destructive" />
                      <span>
                        Baris {r.line}: {r.error} — <span className="text-muted-foreground">{r.raw}</span>
                      </span>
                    </li>
                  ))}
                  {preview.errors.length > 8 && (
                    <li className="text-muted-foreground">…dan {preview.errors.length - 8} baris lain.</li>
                  )}
                </ul>
              )}

              {preview.missing.length > 0 && (
                <p className="text-xs text-muted-foreground">
                  Tidak ada di CSV: {preview.missing.map((s) => s.name).join(", ")} — status mereka tidak diubah.
                </p>
              )}
            </div>
          )}

          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setImportOpen(false)}>
              Batal
            </Button>
            <Button onClick={applyImport} disabled={busy || !preview || preview.valid.length === 0}>
              {isPending("import-csv") ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              Terapkan {preview?.valid.length ?? 0} baris
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </DashboardShell>
  );
}

