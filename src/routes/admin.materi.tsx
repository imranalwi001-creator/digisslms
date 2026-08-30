import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { Loader2, Clock, Users, CheckCircle2, Plus, Pencil, Trash2, Lock, Upload } from "lucide-react";
import { toast } from "sonner";
import { useAdminAction } from "@/lib/admin-action";
import { DashboardShell } from "@/components/DashboardShell";
import { RequireRole } from "@/components/RequireRole";
import { MultiTypeContentUploader } from "@/components/lms/MultiTypeContentUploader";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Progress } from "@/components/ui/progress";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { fetchAdminData } from "@/lib/lms";
import {
  useCatalog,
  createMaterial,
  updateMaterial,
  deleteMaterial,
  slugify,
  type CatalogMaterial,
  type MaterialInput,
} from "@/lib/materials-db";

export const Route = createFileRoute("/admin/materi")({
  head: () => ({
    meta: [
      { title: "Kelola Materi — Admin Continuum LMS" },
      { name: "description", content: "Tambah, ubah, dan hapus materi pembelajaran serta pantau statistik peserta." },
      { property: "og:title", content: "Kelola Materi — Admin Continuum LMS" },
      { property: "og:description", content: "CRUD materi pembelajaran dan statistik penyelesaian tiap materi." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: () => <RequireRole role="staff">{() => <AdminMaterials />}</RequireRole>,
});

const emptyForm: MaterialInput = {
  slug: "",
  title: "",
  subject: "Informatika",
  grade: 7,
  semester: 1,
  element: null,
  description: "",
  imageUrl: null,
  duration: "",
  moduleList: [],
  isPublished: true,
};

function AdminMaterials() {
  const { list, loading: catalogLoading, reload } = useCatalog(true);
  const [stats, setStats] = useState<Record<string, { learners: number; done: number }>>({});
  const [loading, setLoading] = useState(true);
  const [grade, setGrade] = useState<"all" | 7 | 8 | 9>("all");
  const [semester, setSemester] = useState<"all" | 1 | 2>("all");

  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<CatalogMaterial | null>(null);
  const [uploadTarget, setUploadTarget] = useState<CatalogMaterial | null>(null);
  const [form, setForm] = useState<MaterialInput>(emptyForm);
  const [modulesText, setModulesText] = useState("");
  const { run, isPending, busy } = useAdminAction();
  const [deleteTarget, setDeleteTarget] = useState<CatalogMaterial | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const data = await fetchAdminData();
        const next: Record<string, { learners: number; done: number }> = {};
        for (const e of data.enrollments) {
          next[e.materialSlug] = next[e.materialSlug] || { learners: 0, done: 0 };
          next[e.materialSlug].learners += 1;
        }
        for (const p of data.progress) {
          next[p.materialSlug] = next[p.materialSlug] || { learners: 0, done: 0 };
          next[p.materialSlug].done += 1;
        }
        setStats(next);
      } catch (err: any) {
        toast.error(err.message || "Gagal memuat statistik materi");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const filtered = useMemo(
    () =>
      list.filter(
        (m) => (grade === "all" || m.grade === grade) && (semester === "all" || m.semester === semester),
      ),
    [list, grade, semester],
  );

  function openCreate() {
    setEditing(null);
    setForm(emptyForm);
    setModulesText("");
    setOpen(true);
  }

  function openEdit(m: CatalogMaterial) {
    setEditing(m);
    setForm({
      slug: m.slug,
      title: m.title,
      subject: m.subject,
      grade: m.grade,
      semester: m.semester,
      element: m.element,
      description: m.description,
      imageUrl: m.isCustom ? (m.image.startsWith("http") ? m.image : null) : null,
      duration: m.duration,
      moduleList: m.moduleList,
      isPublished: m.isPublished,
    });
    setModulesText(m.moduleList.join("\n"));
    setOpen(true);
  }

  async function save() {
    const moduleList = modulesText
      .split("\n")
      .map((s) => s.trim())
      .filter(Boolean);
    const slug = (form.slug ? slugify(form.slug) : slugify(form.title)).trim();
    if (!form.title.trim()) return toast.error("Judul materi wajib diisi");
    if (!slug) return toast.error("Slug materi tidak valid");
    if (moduleList.length === 0) return toast.error("Minimal satu modul pembelajaran");

    const payload: MaterialInput = {
      ...form,
      slug,
      title: form.title.trim(),
      subject: form.subject.trim() || "Umum",
      duration: form.duration.trim() || `${Math.max(1, Math.round(moduleList.length * 0.5))} jam`,
      imageUrl: form.imageUrl?.trim() ? form.imageUrl.trim() : null,
      moduleList,
    };

    const isUpdate = Boolean(editing?.isCustom && editing?.id);
    const ok = await run(
      "save",
      {
        loading: isUpdate ? "Menyimpan perubahan materi..." : "Menyimpan materi baru...",
        success: isUpdate
          ? "Materi diperbarui"
          : editing
            ? "Materi bawaan berhasil ditimpa"
            : "Materi baru ditambahkan",
        error: "Gagal menyimpan materi",
      },
      async () => {
        if (editing?.isCustom && editing.id) {
          await updateMaterial(editing.id, payload);
        } else {
          await createMaterial(payload);
        }
        return true;
      },
    );
    if (!ok) return;
    setOpen(false);
    await reload();
  }

  async function confirmDelete() {
    if (!deleteTarget?.id) return;
    const id = deleteTarget.id;
    const ok = await run(
      `delete-${id}`,
      { loading: "Menghapus materi...", success: "Materi dihapus", error: "Gagal menghapus materi" },
      async () => {
        await deleteMaterial(id);
        return true;
      },
    );
    if (!ok) return;
    setDeleteTarget(null);
    await reload();
  }

  const isLoading = loading || catalogLoading;

  return (
    <DashboardShell role="staff" title="Kelola materi" subtitle={`${list.length} materi pembelajaran`}>
      {isLoading ? (
        <div className="flex h-64 items-center justify-center">
          <Loader2 className="h-6 w-6 animate-spin text-primary" />
        </div>
      ) : (
        <div className="space-y-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-wrap gap-2">
              {(["all", 7, 8, 9] as const).map((g) => (
                <Button key={String(g)} size="sm" variant={grade === g ? "default" : "outline"} onClick={() => setGrade(g)}>
                  {g === "all" ? "Semua kelas" : `Kelas ${g}`}
                </Button>
              ))}
              {(["all", 1, 2] as const).map((sem) => (
                <Button
                  key={`sem-${sem}`}
                  size="sm"
                  variant={semester === sem ? "secondary" : "ghost"}
                  onClick={() => setSemester(sem)}
                >
                  {sem === "all" ? "Semua semester" : `Semester ${sem}`}
                </Button>
              ))}
            </div>
            <Button size="sm" onClick={openCreate}>
              <Plus className="mr-1.5 h-4 w-4" /> Tambah materi
            </Button>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            {filtered.map((m) => {
              const s = stats[m.slug] ?? { learners: 0, done: 0 };
              const capacity = s.learners * m.modules;
              const percent = capacity ? Math.round((s.done / capacity) * 100) : 0;
              return (
                <article key={m.slug} className="overflow-hidden rounded-2xl border border-border/60 bg-background">
                  <div className="flex gap-4 p-4">
                    <img src={m.image} alt={m.title} className="h-24 w-32 flex-shrink-0 rounded-xl object-cover" loading="lazy" />
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <Badge variant="secondary">Kelas {m.grade}</Badge>
                        <Badge variant="outline">Semester {m.semester}</Badge>
                        <span className="text-xs text-muted-foreground">{m.element || m.subject}</span>
                        {!m.isPublished && <Badge variant="outline">Draf</Badge>}
                        {!m.isCustom && (
                          <span className="flex items-center gap-1 text-[11px] text-muted-foreground">
                            <Lock className="h-3 w-3" /> bawaan
                          </span>
                        )}
                      </div>
                      <h3 className="mt-1 truncate font-medium">{m.title}</h3>
                      <p className="mt-1 flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Users className="h-3 w-3" /> {s.learners} peserta
                        </span>
                        <span className="flex items-center gap-1">
                          <CheckCircle2 className="h-3 w-3" /> {s.done} modul selesai
                        </span>
                        <span className="flex items-center gap-1">
                          <Clock className="h-3 w-3" /> {m.duration}
                        </span>
                      </p>
                    </div>
                  </div>
                  <div className="space-y-2 border-t border-border/60 px-4 py-3">
                    <div className="flex items-center justify-between text-xs text-muted-foreground">
                      <span>Tingkat penyelesaian</span>
                      <span>{percent}%</span>
                    </div>
                    <Progress value={percent} className="h-1.5" />
                    <div className="flex flex-wrap items-center gap-2 pt-1">
                      <Button asChild size="sm" variant="ghost" className="px-2">
                        <Link to="/materi/$slug" params={{ slug: m.slug }}>
                          Lihat
                        </Link>
                      </Button>
                      <Button size="sm" variant="secondary" onClick={() => setUploadTarget(m)}>
                        <Upload className="mr-1.5 h-3.5 w-3.5 text-primary" /> Konten ({m.modules})
                      </Button>
                      <Button size="sm" variant="outline" onClick={() => openEdit(m)} disabled={busy}>
                        <Pencil className="mr-1.5 h-3.5 w-3.5" /> {m.isCustom ? "Ubah" : "Timpa"}
                      </Button>
                      {m.isCustom && (
                        <Button
                          size="sm"
                          variant="ghost"
                          className="text-destructive"
                          onClick={() => setDeleteTarget(m)}
                          disabled={busy}
                        >
                          {isPending(`delete-${m.id}`) ? (
                            <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
                          ) : (
                            <Trash2 className="mr-1.5 h-3.5 w-3.5" />
                          )}{" "}
                          Hapus
                        </Button>
                      )}
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        </div>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>{editing ? "Ubah materi" : "Tambah materi baru"}</DialogTitle>
            <DialogDescription>
              {editing && !editing.isCustom
                ? "Materi bawaan akan ditimpa dengan versi yang bisa kamu kelola."
                : "Isi detail materi dan daftar modul pembelajaran."}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="title">Judul materi</Label>
              <Input
                id="title"
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                placeholder="Microsoft Word Dasar"
              />
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="subject">Mata pelajaran</Label>
                <Input id="subject" value={form.subject} onChange={(e) => setForm({ ...form, subject: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label>Kelas</Label>
                <Select
                  value={String(form.grade)}
                  onValueChange={(v) => setForm({ ...form, grade: Number(v) as 7 | 8 | 9 })}
                >
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

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label>Semester</Label>
                <Select
                  value={String(form.semester)}
                  onValueChange={(v) => setForm({ ...form, semester: Number(v) as 1 | 2 })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1">Semester 1 (Ganjil)</SelectItem>
                    <SelectItem value="2">Semester 2 (Genap)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="element">Elemen Informatika</Label>
                <Input
                  id="element"
                  value={form.element ?? ""}
                  onChange={(e) => setForm({ ...form, element: e.target.value || null })}
                  placeholder="Berpikir Komputasional"
                />
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="slug">Slug URL</Label>
                <Input
                  id="slug"
                  value={form.slug}
                  disabled={!!editing?.isCustom}
                  onChange={(e) => setForm({ ...form, slug: e.target.value })}
                  placeholder="otomatis dari judul"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="duration">Durasi</Label>
                <Input
                  id="duration"
                  value={form.duration}
                  onChange={(e) => setForm({ ...form, duration: e.target.value })}
                  placeholder="5 jam"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="image">URL gambar sampul (opsional)</Label>
              <Input
                id="image"
                value={form.imageUrl ?? ""}
                onChange={(e) => setForm({ ...form, imageUrl: e.target.value })}
                placeholder="https://..."
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Deskripsi</Label>
              <Textarea
                id="description"
                rows={3}
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="modules">Daftar modul (satu per baris)</Label>
              <Textarea
                id="modules"
                rows={7}
                value={modulesText}
                onChange={(e) => setModulesText(e.target.value)}
                placeholder={"Pengenalan\nPraktik dasar\nEvaluasi"}
              />
            </div>

            <div className="flex items-center justify-between rounded-xl border border-border/60 px-4 py-3">
              <div>
                <p className="text-sm font-medium">Terbitkan materi</p>
                <p className="text-xs text-muted-foreground">Materi draf tidak terlihat oleh siswa.</p>
              </div>
              <Switch checked={form.isPublished} onCheckedChange={(v) => setForm({ ...form, isPublished: v })} />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)} disabled={busy}>
              Batal
            </Button>
            <Button onClick={save} disabled={busy}>
              {isPending("save") && <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />}
              {isPending("save") ? "Menyimpan..." : "Simpan"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!deleteTarget} onOpenChange={(o) => !o && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Hapus materi ini?</AlertDialogTitle>
            <AlertDialogDescription>
              “{deleteTarget?.title}” akan dihapus dari katalog. Progres siswa yang tersimpan tidak ikut terhapus.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={busy}>Batal</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete} disabled={busy}>
              {busy && <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />}
              {busy ? "Menghapus..." : "Hapus"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {uploadTarget && (
        <MultiTypeContentUploader
          open={!!uploadTarget}
          onOpenChange={(o) => !o && setUploadTarget(null)}
          materialSlug={uploadTarget.slug}
          materialTitle={uploadTarget.title}
          moduleIndex={0}
          onSuccess={() => {
            toast.success("Konten multi-media berhasil diperbarui!");
          }}
        />
      )}
    </DashboardShell>
  );
}
