import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { ClipboardList, Loader2, Pencil, Plus, Sparkles, Trash2, UserCheck } from "lucide-react";
import { toast } from "sonner";
import { DashboardShell, StatCard } from "@/components/DashboardShell";
import { RequireRole } from "@/components/RequireRole";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useAdminAction } from "@/lib/admin-action";
import { useCatalog } from "@/lib/materials-db";
import {
  computeTotal,
  deleteRubric,
  fetchAssessments,
  fetchRubrics,
  rubricPresets,
  saveAssessment,
  saveRubric,
  scoreBand,
  type Assessment,
  type CriterionInput,
  type Rubric,
} from "@/lib/rubrics";
import { fetchStudentsByGrade, type StudentLite } from "@/lib/teaching";
import { useTerms, termLabel } from "@/lib/terms";

export const Route = createFileRoute("/admin/rubrik")({
  head: () => ({
    meta: [
      { title: "Rubrik penilaian — Continuum LMS" },
      {
        name: "description",
        content: "Buat rubrik penilaian per materi ajar dengan kriteria berbobot, lalu nilai setiap siswa secara terstruktur.",
      },
      { property: "og:title", content: "Rubrik penilaian — Continuum LMS" },
      { property: "og:description", content: "Rubrik berbobot per materi ajar untuk penilaian siswa yang konsisten." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: () => <RequireRole role="staff">{({ userId }) => <RubricsPage userId={userId} />}</RequireRole>,
});

const blankCriterion = (): CriterionInput => ({ name: "", description: "", weight: 1, maxScore: 4 });

type Form = {
  materialSlug: string;
  grade: string;
  title: string;
  description: string;
  isPublished: boolean;
  criteria: CriterionInput[];
};

const emptyForm: Form = {
  materialSlug: "",
  grade: "7",
  title: "",
  description: "",
  isPublished: true,
  criteria: [blankCriterion()],
};

function RubricsPage({ userId }: { userId: string }) {
  const { list: materials } = useCatalog(true);
  const { active } = useTerms();
  const { run, isPending, busy } = useAdminAction();

  const [rubrics, setRubrics] = useState<Rubric[]>([]);
  const [assessments, setAssessments] = useState<Assessment[]>([]);
  const [loading, setLoading] = useState(true);

  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Rubric | null>(null);
  const [form, setForm] = useState<Form>(emptyForm);

  const [scoringRubric, setScoringRubric] = useState<Rubric | null>(null);
  const [roster, setRoster] = useState<StudentLite[]>([]);
  const [studentId, setStudentId] = useState("");
  const [scores, setScores] = useState<Record<string, number>>({});
  const [note, setNote] = useState("");

  const reload = async () => {
    const [r, a] = await Promise.all([fetchRubrics(), fetchAssessments()]);
    setRubrics(r);
    setAssessments(a);
    setLoading(false);
  };

  useEffect(() => {
    reload().catch(() => {
      toast.error("Gagal memuat rubrik");
      setLoading(false);
    });
  }, []);

  useEffect(() => {
    if (!scoringRubric) return;
    fetchStudentsByGrade(scoringRubric.grade ?? 7)
      .then(setRoster)
      .catch(() => toast.error("Gagal memuat daftar siswa"));
  }, [scoringRubric]);

  const openNew = () => {
    setEditing(null);
    setForm(emptyForm);
    setOpen(true);
  };

  const openEdit = (r: Rubric) => {
    setEditing(r);
    setForm({
      materialSlug: r.materialSlug,
      grade: String(r.grade ?? 7),
      title: r.title,
      description: r.description,
      isPublished: r.isPublished,
      criteria: r.criteria.map((c) => ({
        id: c.id,
        name: c.name,
        description: c.description,
        weight: c.weight,
        maxScore: c.maxScore,
      })),
    });
    setOpen(true);
  };

  const applyPreset = (name: string) => {
    const preset = rubricPresets.find((p) => p.name === name);
    if (preset) setForm((f) => ({ ...f, criteria: preset.criteria.map((c) => ({ ...c })) }));
  };

  const save = () =>
    run(
      "save",
      { loading: "Menyimpan rubrik…", success: editing ? "Rubrik diperbarui" : "Rubrik dibuat", error: "Gagal menyimpan rubrik" },
      async () => {
        if (!form.title.trim()) throw new Error("Judul rubrik wajib diisi");
        if (!form.materialSlug) throw new Error("Pilih materi ajar");
        const criteria = form.criteria.filter((c) => c.name.trim());
        if (!criteria.length) throw new Error("Tambahkan minimal satu kriteria");
        await saveRubric(
          {
            materialSlug: form.materialSlug,
            grade: Number(form.grade),
            title: form.title,
            description: form.description,
            isPublished: form.isPublished,
            criteria,
          },
          userId,
          editing?.id,
        );
        await reload();
        setOpen(false);
      },
    );

  const remove = (r: Rubric) =>
    run(`del-${r.id}`, { loading: "Menghapus rubrik…", success: "Rubrik dihapus", error: "Gagal menghapus rubrik" }, async () => {
      await deleteRubric(r.id);
      await reload();
    });

  const openScoring = (r: Rubric) => {
    setScoringRubric(r);
    setStudentId("");
    setScores({});
    setNote("");
  };

  const pickStudent = (id: string) => {
    setStudentId(id);
    const existing = assessments.find(
      (a) => a.rubricId === scoringRubric?.id && a.studentId === id && a.termId === (active?.id ?? null),
    );
    setScores(existing?.scores ?? {});
    setNote(existing?.note ?? "");
  };

  const liveTotal = scoringRubric ? computeTotal(scoringRubric, scores) : 0;

  const submitScore = () =>
    run(
      "score",
      { loading: "Menyimpan penilaian…", success: "Penilaian tersimpan", error: "Gagal menyimpan penilaian" },
      async () => {
        if (!scoringRubric) return;
        if (!studentId) throw new Error("Pilih siswa terlebih dahulu");
        await saveAssessment({
          rubric: scoringRubric,
          studentId,
          scores,
          note,
          userId,
          termId: active?.id ?? null,
        });
        await reload();
        setScoringRubric(null);
      },
    );

  const stats = useMemo(() => {
    const scored = assessments.length;
    const avg = scored ? Math.round(assessments.reduce((s, a) => s + a.totalScore, 0) / scored) : 0;
    return { total: rubrics.length, scored, avg };
  }, [rubrics, assessments]);

  const materialTitle = (slug: string) => materials.find((m) => m.slug === slug)?.title ?? slug;

  return (
    <DashboardShell
      role="staff"
      title="Rubrik penilaian"
      subtitle={`Periode: ${termLabel(active)}`}
      actions={
        <Button size="sm" onClick={openNew}>
          <Plus className="mr-2 h-4 w-4" />
          Rubrik baru
        </Button>
      }
    >
      {loading ? (
        <div className="flex h-64 items-center justify-center">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      ) : (
        <div className="space-y-6">
          <div className="grid gap-4 sm:grid-cols-3">
            <StatCard label="Rubrik" value={stats.total} hint="Per materi ajar" icon={ClipboardList} />
            <StatCard label="Penilaian tersimpan" value={stats.scored} hint="Seluruh periode" icon={UserCheck} />
            <StatCard label="Rata-rata nilai" value={`${stats.avg}%`} hint={scoreBand(stats.avg)} icon={Sparkles} />
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            {rubrics.map((r) => {
              const scored = assessments.filter((a) => a.rubricId === r.id);
              const avg = scored.length ? Math.round(scored.reduce((s, a) => s + a.totalScore, 0) / scored.length) : 0;
              return (
                <div key={r.id} className="rounded-2xl border border-border/60 bg-background p-5">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="font-semibold">{r.title}</p>
                      <p className="mt-0.5 truncate text-xs text-muted-foreground">{materialTitle(r.materialSlug)}</p>
                    </div>
                    <div className="flex gap-1">
                      <Button size="icon" variant="ghost" onClick={() => openEdit(r)} aria-label="Ubah">
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button size="icon" variant="ghost" disabled={busy} onClick={() => remove(r)} aria-label="Hapus">
                        {isPending(`del-${r.id}`) ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <Trash2 className="h-4 w-4 text-destructive" />
                        )}
                      </Button>
                    </div>
                  </div>

                  <div className="mt-3 flex flex-wrap gap-2">
                    <Badge variant="secondary">Kelas {r.grade ?? "—"}</Badge>
                    <Badge variant="outline">{r.criteria.length} kriteria</Badge>
                    <Badge variant="outline">{scored.length} siswa dinilai</Badge>
                    {r.isPublished ? <Badge variant="outline">Terbit</Badge> : <Badge variant="outline">Draf</Badge>}
                  </div>

                  {r.description ? <p className="mt-3 text-sm text-muted-foreground">{r.description}</p> : null}

                  <div className="mt-4 space-y-1.5">
                    {r.criteria.map((c) => (
                      <div key={c.id} className="flex items-center justify-between text-xs">
                        <span className="truncate text-muted-foreground">{c.name}</span>
                        <span className="ml-3 flex-shrink-0 text-muted-foreground">
                          bobot {c.weight} · maks {c.maxScore}
                        </span>
                      </div>
                    ))}
                  </div>

                  <div className="mt-4 flex items-center justify-between gap-3 border-t border-border/60 pt-4">
                    <p className="text-xs text-muted-foreground">
                      Rata-rata kelas: <span className="font-medium text-foreground">{avg}%</span>
                    </p>
                    <Button size="sm" variant="outline" onClick={() => openScoring(r)}>
                      <UserCheck className="mr-2 h-4 w-4" />
                      Nilai siswa
                    </Button>
                  </div>
                </div>
              );
            })}
            {!rubrics.length && (
              <div className="rounded-2xl border border-dashed border-border py-14 text-center text-sm text-muted-foreground md:col-span-2">
                Belum ada rubrik. Mulai dari template praktik digital atau proyek kelompok.
              </div>
            )}
          </div>
        </div>
      )}

      {/* rubric editor */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-h-[88vh] max-w-2xl overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editing ? "Ubah rubrik" : "Rubrik baru"}</DialogTitle>
            <DialogDescription>
              Nilai akhir dihitung otomatis sebagai persentase berbobot dari seluruh kriteria.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label>Materi ajar</Label>
                <Select value={form.materialSlug} onValueChange={(v) => setForm({ ...form, materialSlug: v })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Pilih materi" />
                  </SelectTrigger>
                  <SelectContent>
                    {materials.map((m) => (
                      <SelectItem key={m.slug} value={m.slug}>
                        {m.title}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Kelas</Label>
                <Select value={form.grade} onValueChange={(v) => setForm({ ...form, grade: v })}>
                  <SelectTrigger>
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
            </div>

            <div className="space-y-2">
              <Label>Judul rubrik</Label>
              <Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label>Deskripsi</Label>
              <Textarea rows={2} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
            </div>

            <div className="flex items-center justify-between rounded-xl border border-border/60 px-4 py-3">
              <div>
                <p className="text-sm font-medium">Tampilkan ke siswa</p>
                <p className="text-xs text-muted-foreground">Siswa bisa melihat kriteria penilaian materi ini.</p>
              </div>
              <Switch checked={form.isPublished} onCheckedChange={(v) => setForm({ ...form, isPublished: v })} />
            </div>

            <div className="space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <Label>Kriteria penilaian</Label>
                <Select onValueChange={applyPreset}>
                  <SelectTrigger className="h-8 w-56">
                    <SelectValue placeholder="Gunakan template" />
                  </SelectTrigger>
                  <SelectContent>
                    {rubricPresets.map((p) => (
                      <SelectItem key={p.name} value={p.name}>
                        {p.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {form.criteria.map((c, i) => (
                <div key={i} className="rounded-xl border border-border/60 p-4">
                  <div className="mb-3 flex items-center justify-between">
                    <p className="text-xs font-medium text-muted-foreground">Kriteria {i + 1}</p>
                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={() => setForm({ ...form, criteria: form.criteria.filter((_, j) => j !== i) })}
                      aria-label="Hapus kriteria"
                    >
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                  <div className="space-y-3">
                    <Input
                      placeholder="Nama kriteria"
                      value={c.name}
                      onChange={(e) =>
                        setForm({ ...form, criteria: form.criteria.map((x, j) => (j === i ? { ...x, name: e.target.value } : x)) })
                      }
                    />
                    <Input
                      placeholder="Deskripsi singkat"
                      value={c.description}
                      onChange={(e) =>
                        setForm({
                          ...form,
                          criteria: form.criteria.map((x, j) => (j === i ? { ...x, description: e.target.value } : x)),
                        })
                      }
                    />
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1.5">
                        <Label className="text-xs">Bobot</Label>
                        <Input
                          type="number"
                          min={1}
                          value={c.weight}
                          onChange={(e) =>
                            setForm({
                              ...form,
                              criteria: form.criteria.map((x, j) =>
                                j === i ? { ...x, weight: Math.max(1, Number(e.target.value) || 1) } : x,
                              ),
                            })
                          }
                        />
                      </div>
                      <div className="space-y-1.5">
                        <Label className="text-xs">Skor maksimum</Label>
                        <Input
                          type="number"
                          min={1}
                          value={c.maxScore}
                          onChange={(e) =>
                            setForm({
                              ...form,
                              criteria: form.criteria.map((x, j) =>
                                j === i ? { ...x, maxScore: Math.max(1, Number(e.target.value) || 1) } : x,
                              ),
                            })
                          }
                        />
                      </div>
                    </div>
                  </div>
                </div>
              ))}

              <Button variant="outline" onClick={() => setForm({ ...form, criteria: [...form.criteria, blankCriterion()] })}>
                <Plus className="mr-2 h-4 w-4" />
                Tambah kriteria
              </Button>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>
              Batal
            </Button>
            <Button onClick={save} disabled={busy}>
              {isPending("save") ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              Simpan rubrik
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* scoring */}
      <Dialog open={!!scoringRubric} onOpenChange={(v) => !v && setScoringRubric(null)}>
        <DialogContent className="max-h-[88vh] max-w-xl overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Nilai siswa — {scoringRubric?.title}</DialogTitle>
            <DialogDescription>Periode {termLabel(active)}. Nilai lama akan diperbarui bila siswa dipilih ulang.</DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Siswa (kelas {scoringRubric?.grade ?? "—"})</Label>
              <Select value={studentId} onValueChange={pickStudent}>
                <SelectTrigger>
                  <SelectValue placeholder="Pilih siswa" />
                </SelectTrigger>
                <SelectContent>
                  {roster.map((s) => (
                    <SelectItem key={s.id} value={s.id}>
                      {s.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {scoringRubric?.criteria.map((c) => (
              <div key={c.id} className="rounded-xl border border-border/60 p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-sm font-medium">{c.name}</p>
                    {c.description ? <p className="text-xs text-muted-foreground">{c.description}</p> : null}
                  </div>
                  <Badge variant="outline" className="flex-shrink-0">
                    bobot {c.weight}
                  </Badge>
                </div>
                <div className="mt-3 flex flex-wrap gap-2">
                  {Array.from({ length: c.maxScore + 1 }, (_, n) => n).map((n) => (
                    <button
                      key={n}
                      onClick={() => setScores({ ...scores, [c.id]: n })}
                      className={[
                        "h-9 w-9 rounded-lg border text-sm font-medium transition-colors",
                        (scores[c.id] ?? -1) === n
                          ? "border-primary bg-primary/10 text-primary"
                          : "border-border text-muted-foreground hover:bg-muted",
                      ].join(" ")}
                    >
                      {n}
                    </button>
                  ))}
                </div>
              </div>
            ))}

            <div className="space-y-2">
              <Label>Catatan untuk siswa</Label>
              <Textarea rows={2} value={note} onChange={(e) => setNote(e.target.value)} />
            </div>

            <div className="flex items-center justify-between rounded-xl bg-muted/50 px-4 py-3">
              <p className="text-sm text-muted-foreground">Nilai akhir</p>
              <p className="text-lg font-semibold">
                {liveTotal}% <span className="text-xs font-normal text-muted-foreground">· {scoreBand(liveTotal)}</span>
              </p>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setScoringRubric(null)}>
              Tutup
            </Button>
            <Button onClick={submitScore} disabled={busy}>
              {isPending("score") ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              Simpan penilaian
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </DashboardShell>
  );
}
