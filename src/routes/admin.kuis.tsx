import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { Loader2, Plus, Trash2, Pencil, HelpCircle, Eye, EyeOff } from "lucide-react";
import { toast } from "sonner";
import { useAdminAction } from "@/lib/admin-action";
import { DashboardShell } from "@/components/DashboardShell";
import { RequireRole } from "@/components/RequireRole";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { useCatalog } from "@/lib/materials-db";
import {
  listQuizzesForAdmin,
  createQuiz,
  updateQuiz,
  deleteQuiz,
} from "@/lib/lms.functions";
import { useServerFn } from "@tanstack/react-start";

type QuestionInput = {
  id?: string;
  question: string;
  options: { label: string }[];
  correctOptionIndex: number;
  explanation: string;
  points: number;
};

const emptyQuestion = (): QuestionInput => ({
  question: "",
  options: [{ label: "" }, { label: "" }],
  correctOptionIndex: 0,
  explanation: "",
  points: 10,
});

export const Route = createFileRoute("/admin/kuis")({
  head: () => ({
    meta: [
      { title: "Kelola Kuis — Admin Digisschool LMS" },
      { name: "description", content: "Buat, ubah, dan publikasikan kuis untuk materi pembelajaran." },
      { property: "og:title", content: "Kelola Kuis — Admin Digisschool LMS" },
      { property: "og:description", content: "Manajemen kuis untuk materi pembelajaran." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: () => <RequireRole role="staff">{() => <AdminQuizzes />}</RequireRole>,
});

function AdminQuizzes() {
  const { list: materials } = useCatalog(true);
  const [quizzes, setQuizzes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<any | null>(null);
  const [materialSlug, setMaterialSlug] = useState(materials[0]?.slug || "");
  const [title, setTitle] = useState("");
  const [passingScore, setPassingScore] = useState(70);
  const [timeLimit, setTimeLimit] = useState<string>("");
  const [shuffle, setShuffle] = useState(false);
  const [isPublished, setIsPublished] = useState(false);
  const [questions, setQuestions] = useState<QuestionInput[]>([emptyQuestion()]);
  const { run, isPending, busy } = useAdminAction();
  const saving = isPending("save");

  const fetchQuizzes = useServerFn(listQuizzesForAdmin);
  const createQuizFn = useServerFn(createQuiz);
  const updateQuizFn = useServerFn(updateQuiz);
  const deleteQuizFn = useServerFn(deleteQuiz);

  const load = async () => {
    setLoading(true);
    try {
      const { quizzes: data } = await fetchQuizzes();
      setQuizzes(data);
    } catch (err: any) {
      toast.error(err.message || "Gagal memuat kuis");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const resetForm = () => {
    setEditing(null);
    setMaterialSlug(materials[0]?.slug || "");
    setTitle("");
    setPassingScore(70);
    setTimeLimit("");
    setShuffle(false);
    setIsPublished(false);
    setQuestions([emptyQuestion()]);
  };

  const openCreate = () => {
    resetForm();
    setDialogOpen(true);
  };

  const openEdit = (quiz: any) => {
    setEditing(quiz);
    setMaterialSlug(quiz.material_slug);
    setTitle(quiz.title);
    setPassingScore(quiz.passing_score);
    setTimeLimit(quiz.time_limit_minutes ? String(quiz.time_limit_minutes) : "");
    setShuffle(quiz.shuffle_questions);
    setIsPublished(quiz.is_published);
    setQuestions(
      quiz.questions.length > 0
        ? quiz.questions.map((q: any) => ({
            id: q.id,
            question: q.question,
            options: q.options as { label: string }[],
            correctOptionIndex: q.correct_option_index,
            explanation: q.explanation || "",
            points: q.points,
          }))
        : [emptyQuestion()],
    );
    setDialogOpen(true);
  };

  const handleSave = async () => {
    if (!title.trim() || !materialSlug) {
      toast.error("Judul dan materi wajib diisi");
      return;
    }
    for (const q of questions) {
      if (!q.question.trim() || q.options.some((o) => !o.label.trim())) {
        toast.error("Semua soal dan pilihan jawaban wajib diisi");
        return;
      }
    }
    const editMode = Boolean(editing);
    const ok = await run(
      "save",
      {
        loading: editMode ? "Menyimpan perubahan kuis..." : "Membuat kuis baru...",
        success: editMode ? "Kuis diperbarui" : "Kuis dibuat",
        error: editMode ? "Gagal menyimpan kuis" : "Gagal membuat kuis",
      },
      async () => {
        if (editing) {
          await updateQuizFn({
            data: {
              id: editing.id,
              title,
              passingScore,
              timeLimitMinutes: timeLimit ? Number(timeLimit) : null,
              shuffleQuestions: shuffle,
              isPublished,
              questions: questions.map((q) => ({
                id: q.id,
                question: q.question,
                options: q.options,
                correctOptionIndex: q.correctOptionIndex,
                explanation: q.explanation,
                points: q.points,
              })),
            },
          });
        } else {
          await createQuizFn({
            data: {
              materialSlug,
              title,
              passingScore,
              timeLimitMinutes: timeLimit ? Number(timeLimit) : null,
              shuffleQuestions: shuffle,
              questions: questions.map((q) => ({
                question: q.question,
                options: q.options,
                correctOptionIndex: q.correctOptionIndex,
                explanation: q.explanation,
                points: q.points,
              })),
            },
          });
        }
        return true;
      },
    );
    if (!ok) return;
    setDialogOpen(false);
    resetForm();
    await load();
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Hapus kuis ini?")) return;
    const ok = await run(
      `delete-${id}`,
      { loading: "Menghapus kuis...", success: "Kuis dihapus", error: "Gagal menghapus kuis" },
      async () => {
        await deleteQuizFn({ data: { id } });
        return true;
      },
    );
    if (ok) await load();
  };

  const addQuestion = () => setQuestions([...questions, emptyQuestion()]);
  const removeQuestion = (idx: number) => {
    if (questions.length <= 1) return;
    const next = [...questions];
    next.splice(idx, 1);
    setQuestions(next);
  };
  const updateQuestion = (idx: number, patch: Partial<QuestionInput>) => {
    const next = [...questions];
    next[idx] = { ...next[idx], ...patch };
    setQuestions(next);
  };
  const updateOption = (qIdx: number, oIdx: number, value: string) => {
    const next = [...questions];
    next[qIdx].options[oIdx] = { label: value };
    setQuestions(next);
  };
  const addOption = (qIdx: number) => {
    if (questions[qIdx].options.length >= 6) return;
    const next = [...questions];
    next[qIdx].options.push({ label: "" });
    setQuestions(next);
  };
  const removeOption = (qIdx: number, oIdx: number) => {
    if (questions[qIdx].options.length <= 2) return;
    const next = [...questions];
    next[qIdx].options.splice(oIdx, 1);
    if (next[qIdx].correctOptionIndex >= next[qIdx].options.length) {
      next[qIdx].correctOptionIndex = next[qIdx].options.length - 1;
    }
    setQuestions(next);
  };

  const byMaterial = useMemo(() => {
    const map = new Map<string, any[]>();
    for (const q of quizzes) {
      const list = map.get(q.material_slug) || [];
      list.push(q);
      map.set(q.material_slug, list);
    }
    return map;
  }, [quizzes]);

  return (
    <DashboardShell role="staff" title="Kelola kuis" subtitle={`${quizzes.length} kuis tersedia`}>
      <div className="space-y-5">
        <div className="flex items-center justify-between">
          <div />
          <Button onClick={openCreate}>
            <Plus className="mr-1.5 h-4 w-4" /> Buat kuis
          </Button>
        </div>

        {loading ? (
          <div className="flex h-64 items-center justify-center">
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
          </div>
        ) : (
          <div className="space-y-8">
            {materials.map((m) => {
              const list = byMaterial.get(m.slug) || [];
              return (
                <section key={m.slug} className="rounded-2xl border border-border/60 bg-background p-5">
                  <div className="flex items-center gap-3">
                    <img src={m.image} alt={m.title} className="h-14 w-20 rounded-lg object-cover" loading="lazy" />
                    <div>
                      <h3 className="font-semibold">{m.title}</h3>
                      <p className="text-sm text-muted-foreground">
                        {m.subject} · Kelas {m.grade}
                      </p>
                    </div>
                  </div>
                  {list.length === 0 ? (
                    <p className="mt-4 text-sm text-muted-foreground">Belum ada kuis untuk materi ini.</p>
                  ) : (
                    <div className="mt-4 divide-y divide-border/60">
                      {list.map((q) => (
                        <div key={q.id} className="flex items-center justify-between gap-3 py-3">
                          <div className="min-w-0">
                            <p className="truncate font-medium">{q.title}</p>
                            <p className="text-xs text-muted-foreground">
                              {q.questions.length} soal · Nilai lulus {q.passing_score}%
                              {q.time_limit_minutes ? ` · ${q.time_limit_minutes} menit` : ""}
                            </p>
                          </div>
                          <div className="flex items-center gap-2">
                            <Badge variant={q.is_published ? "default" : "secondary"}>
                              {q.is_published ? (
                                <Eye className="mr-1 h-3 w-3" />
                              ) : (
                                <EyeOff className="mr-1 h-3 w-3" />
                              )}
                              {q.is_published ? "Publik" : "Draft"}
                            </Badge>
                            <Button size="sm" variant="ghost" onClick={() => openEdit(q)} disabled={busy}>
                              <Pencil className="h-4 w-4" />
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              className="text-destructive"
                              onClick={() => handleDelete(q.id)}
                              disabled={busy}
                            >
                              {isPending(`delete-${q.id}`) && <Loader2 className="mr-1 h-3 w-3 animate-spin" />}
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </section>
              );
            })}
          </div>
        )}
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editing ? "Ubah kuis" : "Buat kuis baru"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            {!editing && (
              <div className="space-y-1.5">
                <Label>Materi</Label>
                <Select value={materialSlug} onValueChange={setMaterialSlug}>
                  <SelectTrigger>
                    <SelectValue placeholder="Pilih materi" />
                  </SelectTrigger>
                  <SelectContent>
                    {materials.map((m) => (
                      <SelectItem key={m.slug} value={m.slug}>
                        {m.title} (Kelas {m.grade})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
            <div className="space-y-1.5">
              <Label>Judul kuis</Label>
              <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Contoh: Kuis Pengenalan Komputer" />
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div className="space-y-1.5">
                <Label>Nilai lulus (%)</Label>
                <Input type="number" min={0} max={100} value={passingScore} onChange={(e) => setPassingScore(Number(e.target.value))} />
              </div>
              <div className="space-y-1.5">
                <Label>Batas waktu (menit)</Label>
                <Input type="number" min={1} value={timeLimit} onChange={(e) => setTimeLimit(e.target.value)} placeholder="Opsional" />
              </div>
              <div className="space-y-1.5">
                <Label>Acak soal</Label>
                <div className="pt-2">
                  <Switch checked={shuffle} onCheckedChange={setShuffle} />
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Switch checked={isPublished} onCheckedChange={setIsPublished} />
              <Label className="cursor-pointer">Publikasikan kuis</Label>
            </div>

            <div className="border-t border-border pt-4">
              <div className="mb-3 flex items-center justify-between">
                <Label>Daftar soal</Label>
                <Button type="button" size="sm" variant="outline" onClick={addQuestion}>
                  <Plus className="mr-1 h-4 w-4" /> Tambah soal
                </Button>
              </div>
              <div className="space-y-5">
                {questions.map((q, qIdx) => (
                  <div key={qIdx} className="rounded-xl border border-border/60 p-4">
                    <div className="mb-3 flex items-center justify-between">
                      <span className="text-sm font-medium">Soal {qIdx + 1}</span>
                      <Button type="button" size="sm" variant="ghost" className="text-destructive" onClick={() => removeQuestion(qIdx)}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                    <div className="space-y-3">
                      <Textarea
                        value={q.question}
                        onChange={(e) => updateQuestion(qIdx, { question: e.target.value })}
                        placeholder="Tulis pertanyaan"
                      />
                      <div className="space-y-2">
                        {q.options.map((o, oIdx) => (
                          <div key={oIdx} className="flex items-center gap-2">
                            <input
                              type="radio"
                              name={`correct-${qIdx}`}
                              checked={q.correctOptionIndex === oIdx}
                              onChange={() => updateQuestion(qIdx, { correctOptionIndex: oIdx })}
                              className="h-4 w-4 accent-primary"
                            />
                            <Input
                              value={o.label}
                              onChange={(e) => updateOption(qIdx, oIdx, e.target.value)}
                              placeholder={`Pilihan ${oIdx + 1}`}
                              className="flex-1"
                            />
                            {q.options.length > 2 && (
                              <Button type="button" size="sm" variant="ghost" onClick={() => removeOption(qIdx, oIdx)}>
                                <Trash2 className="h-3 w-3" />
                              </Button>
                            )}
                          </div>
                        ))}
                        {q.options.length < 6 && (
                          <Button type="button" size="sm" variant="ghost" onClick={() => addOption(qIdx)}>
                            <Plus className="mr-1 h-3 w-3" /> Tambah pilihan
                          </Button>
                        )}
                      </div>
                      <Textarea
                        value={q.explanation}
                        onChange={(e) => updateQuestion(qIdx, { explanation: e.target.value })}
                        placeholder="Pembahasan jawaban benar (opsional)"
                        className="text-sm"
                      />
                      <div className="w-24">
                        <Label className="text-xs">Poin</Label>
                        <Input type="number" min={1} value={q.points} onChange={(e) => updateQuestion(qIdx, { points: Number(e.target.value) })} />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)} disabled={saving}>
              Batal
            </Button>
            <Button onClick={handleSave} disabled={saving}>
              {saving ? <Loader2 className="mr-1 h-4 w-4 animate-spin" /> : <HelpCircle className="mr-1 h-4 w-4" />}
              {saving ? "Menyimpan..." : "Simpan kuis"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </DashboardShell>
  );
}
