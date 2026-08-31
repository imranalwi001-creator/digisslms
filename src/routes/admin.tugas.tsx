import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Loader2, Plus, Trash2, Pencil, FileText, Calendar, CheckCircle } from "lucide-react";
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
import { useCatalog } from "@/lib/materials-db";
import {
  listAssignmentsForAdmin,
  createAssignment,
  updateAssignment,
  deleteAssignment,
  listAssignmentSubmissionsForAdmin,
  gradeSubmission,
} from "@/lib/lms.functions";
import { useServerFn } from "@tanstack/react-start";
import { ScrollArea } from "@/components/ui/scroll-area";

export const Route = createFileRoute("/admin/tugas")({
  head: () => ({
    meta: [
      { title: "Kelola Tugas — Admin Digisschool LMS" },
      { name: "description", content: "Buat, ubah, dan nilai tugas siswa." },
      { property: "og:title", content: "Kelola Tugas — Admin Digisschool LMS" },
      { property: "og:description", content: "Manajemen tugas dan penilaian siswa." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: () => <RequireRole role="staff">{() => <AdminAssignments />}</RequireRole>,
});

function AdminAssignments() {
  const { list: materials } = useCatalog(true);
  const [assignments, setAssignments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<any | null>(null);
  const [materialSlug, setMaterialSlug] = useState(materials[0]?.slug || "");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [maxScore, setMaxScore] = useState(100);
  const { run, isPending, busy } = useAdminAction();
  const saving = isPending("save");

  const [submissions, setSubmissions] = useState<any[]>([]);
  const [subDialogOpen, setSubDialogOpen] = useState(false);
  const [selectedAssignment, setSelectedAssignment] = useState<any | null>(null);
  const [grading, setGrading] = useState<Record<string, { score: string; feedback: string }>>({});

  const fetchFn = useServerFn(listAssignmentsForAdmin);
  const createFn = useServerFn(createAssignment);
  const updateFn = useServerFn(updateAssignment);
  const deleteFn = useServerFn(deleteAssignment);
  const listSubFn = useServerFn(listAssignmentSubmissionsForAdmin);
  const gradeFn = useServerFn(gradeSubmission);

  const load = async () => {
    setLoading(true);
    try {
      const { assignments: data } = await fetchFn();
      setAssignments(data);
    } catch (err: any) {
      toast.error(err.message || "Gagal memuat tugas");
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
    setDescription("");
    setDueDate("");
    setMaxScore(100);
  };

  const openCreate = () => {
    resetForm();
    setDialogOpen(true);
  };

  const openEdit = (a: any) => {
    setEditing(a);
    setMaterialSlug(a.material_slug);
    setTitle(a.title);
    setDescription(a.description || "");
    setDueDate(a.due_date ? new Date(a.due_date).toISOString().slice(0, 16) : "");
    setMaxScore(a.max_score);
    setDialogOpen(true);
  };

  const handleSave = async () => {
    if (!title.trim() || !materialSlug) {
      toast.error("Judul dan materi wajib diisi");
      return;
    }
    const editMode = Boolean(editing);
    const ok = await run(
      "save",
      {
        loading: editMode ? "Menyimpan perubahan tugas..." : "Membuat tugas baru...",
        success: editMode ? "Tugas diperbarui" : "Tugas dibuat",
        error: editMode ? "Gagal menyimpan tugas" : "Gagal membuat tugas",
      },
      async () => {
        if (editing) {
          await updateFn({
            data: {
              id: editing.id,
              title,
              description,
              dueDate: dueDate ? new Date(dueDate).toISOString() : null,
              maxScore,
            },
          });
        } else {
          await createFn({
            data: {
              materialSlug,
              title,
              description,
              dueDate: dueDate ? new Date(dueDate).toISOString() : null,
              maxScore,
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
    if (!confirm("Hapus tugas ini?")) return;
    const ok = await run(
      `delete-${id}`,
      { loading: "Menghapus tugas...", success: "Tugas dihapus", error: "Gagal menghapus tugas" },
      async () => {
        await deleteFn({ data: { id } });
        return true;
      },
    );
    if (ok) await load();
  };

  const openSubmissions = async (a: any) => {
    setSelectedAssignment(a);
    setSubDialogOpen(true);
    try {
      const { submissions: data } = await listSubFn({ data: { assignmentId: a.id } });
      setSubmissions(data);
      const initial: Record<string, { score: string; feedback: string }> = {};
      for (const s of data) {
        initial[s.id] = { score: String(s.score ?? ""), feedback: s.feedback || "" };
      }
      setGrading(initial);
    } catch (err: any) {
      toast.error(err.message || "Gagal memuat pengumpulan");
    }
  };

  const submitGrade = async (submissionId: string) => {
    const g = grading[submissionId];
    if (!g || g.score === "") {
      toast.error("Isi nilai terlebih dahulu");
      return;
    }
    const ok = await run(
      `grade-${submissionId}`,
      { loading: "Menyimpan nilai...", success: "Nilai tersimpan", error: "Gagal menyimpan nilai" },
      async () => {
        await gradeFn({ data: { submissionId, score: Number(g.score), feedback: g.feedback } });
        return true;
      },
    );
    if (ok) await openSubmissions(selectedAssignment);
  };

  return (
    <DashboardShell role="staff" title="Kelola tugas" subtitle={`${assignments.length} tugas tersedia`}>
      <div className="space-y-5">
        <div className="flex items-center justify-between">
          <div />
          <Button onClick={openCreate}>
            <Plus className="mr-1.5 h-4 w-4" /> Buat tugas
          </Button>
        </div>

        {loading ? (
          <div className="flex h-64 items-center justify-center">
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
          </div>
        ) : (
          <div className="rounded-2xl border border-border/60 bg-background">
            {assignments.length === 0 ? (
              <div className="p-8 text-center text-sm text-muted-foreground">Belum ada tugas.</div>
            ) : (
              <div className="divide-y divide-border/60">
                {assignments.map((a) => (
                  <div key={a.id} className="flex items-center justify-between gap-3 p-4">
                    <div className="min-w-0">
                      <p className="font-medium">{a.title}</p>
                      <p className="text-xs text-muted-foreground">
                        {a.materials?.title || a.material_slug} · Maks {a.max_score} poin
                        {a.due_date && ` · Batas ${new Date(a.due_date).toLocaleString("id-ID")}`}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button size="sm" variant="outline" onClick={() => openSubmissions(a)} disabled={busy}>
                        <CheckCircle className="mr-1 h-4 w-4" /> Nilai
                      </Button>
                      <Button size="sm" variant="ghost" onClick={() => openEdit(a)} disabled={busy}>
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="text-destructive"
                        onClick={() => handleDelete(a.id)}
                        disabled={busy}
                      >
                        {isPending(`delete-${a.id}`) ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <Trash2 className="h-4 w-4" />
                        )}
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{editing ? "Ubah tugas" : "Buat tugas baru"}</DialogTitle>
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
              <Label>Judul tugas</Label>
              <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Contoh: Buat dokumen Word" />
            </div>
            <div className="space-y-1.5">
              <Label>Deskripsi</Label>
              <Textarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Instruksi dan detail tugas" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Batas waktu</Label>
                <Input type="datetime-local" value={dueDate} onChange={(e) => setDueDate(e.target.value)} />
              </div>
              <div className="space-y-1.5">
                <Label>Nilai maksimal</Label>
                <Input type="number" min={1} value={maxScore} onChange={(e) => setMaxScore(Number(e.target.value))} />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)} disabled={saving}>
              Batal
            </Button>
            <Button onClick={handleSave} disabled={saving}>
              {saving ? <Loader2 className="mr-1 h-4 w-4 animate-spin" /> : <FileText className="mr-1 h-4 w-4" />}
              {saving ? "Menyimpan..." : "Simpan tugas"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={subDialogOpen} onOpenChange={setSubDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Penilaian: {selectedAssignment?.title}</DialogTitle>
          </DialogHeader>
          <ScrollArea className="max-h-[60vh]">
            <div className="space-y-4 py-2">
              {submissions.length === 0 ? (
                <p className="text-sm text-muted-foreground">Belum ada pengumpulan.</p>
              ) : (
                submissions.map((s) => (
                  <div key={s.id} className="rounded-xl border border-border/60 p-4">
                    <div className="mb-2 flex items-center justify-between">
                      <p className="font-medium">{s.profiles?.display_name || s.user_id}</p>
                      <p className="text-xs text-muted-foreground">{new Date(s.created_at).toLocaleString("id-ID")}</p>
                    </div>
                    <p className="mb-2 text-sm">{s.content || "Tidak ada catatan teks."}</p>
                    {s.file_url && (
                      <a href={s.file_url} target="_blank" rel="noreferrer" className="text-sm text-primary hover:underline">
                        Lihat lampiran
                      </a>
                    )}
                    <div className="mt-3 grid grid-cols-2 gap-3">
                      <div>
                        <Label className="text-xs">Nilai (maks {selectedAssignment?.max_score})</Label>
                        <Input
                          type="number"
                          value={grading[s.id]?.score ?? ""}
                          onChange={(e) =>
                            setGrading((prev) => ({ ...prev, [s.id]: { ...prev[s.id], score: e.target.value } }))
                          }
                        />
                      </div>
                      <div>
                        <Label className="text-xs">Feedback</Label>
                        <Input
                          value={grading[s.id]?.feedback ?? ""}
                          onChange={(e) =>
                            setGrading((prev) => ({ ...prev, [s.id]: { ...prev[s.id], feedback: e.target.value } }))
                          }
                          placeholder="Feedback untuk siswa"
                        />
                      </div>
                    </div>
                    <Button size="sm" className="mt-2" onClick={() => submitGrade(s.id)} disabled={busy}>
                      {isPending(`grade-${s.id}`) ? (
                        <Loader2 className="mr-1 h-4 w-4 animate-spin" />
                      ) : (
                        <CheckCircle className="mr-1 h-4 w-4" />
                      )}{" "}
                      Simpan nilai
                    </Button>
                  </div>
                ))
              )}
            </div>
          </ScrollArea>
        </DialogContent>
      </Dialog>
    </DashboardShell>
  );
}
