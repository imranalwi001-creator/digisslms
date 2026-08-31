import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import {
  Loader2,
  Search,
  ShieldCheck,
  GraduationCap,
  Presentation,
  UserPlus,
  Pencil,
  Trash2,
  KeyRound,
} from "lucide-react";
import { toast } from "sonner";
import { useAdminAction } from "@/lib/admin-action";
import { DashboardShell } from "@/components/DashboardShell";
import { RequireRole } from "@/components/RequireRole";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  fetchAdminData,
  buildStudentRows,
  setUserRole,
  updateProfile,
  enroll,
  unenroll,
  formatDate,
  type StudentRow,
  type Enrollment,
} from "@/lib/lms";
import { useCatalog } from "@/lib/materials-db";
import {
  createStudentAccount,
  updateStudentCredentials,
  deleteStudentAccount,
} from "@/lib/admin-users.functions";

export const Route = createFileRoute("/admin/siswa")({
  head: () => ({
    meta: [
      { title: "Kelola Siswa — Admin Continuum LMS" },
      { name: "description", content: "Tambah, ubah, dan hapus data siswa beserta progres belajar dan peran akun." },
      { property: "og:title", content: "Kelola Siswa — Admin Continuum LMS" },
      { property: "og:description", content: "CRUD data siswa, kelas, dan peran akun Continuum LMS." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: () => <RequireRole role="staff">{({ userId, role }) => <AdminStudents currentUserId={userId} viewerRole={role} />}</RequireRole>,
});

type FormState = {
  fullName: string;
  email: string;
  password: string;
  grade: string;
  phone: string;
  school: string;
  notes: string;
  role: "student" | "guru" | "admin";
  status: string;
};

const emptyForm: FormState = {
  fullName: "",
  email: "",
  password: "",
  grade: "7",
  phone: "",
  school: "",
  notes: "",
  role: "student",
  status: "active",
};

function AdminStudents({
  currentUserId,
  viewerRole,
}: {
  currentUserId: string;
  viewerRole: "admin" | "guru" | "student";
}) {
  const canManageRoles = viewerRole === "admin";
  const { list: materials } = useCatalog(true);
  const [rows, setRows] = useState<StudentRow[]>([]);
  const [enrollments, setEnrollments] = useState<Enrollment[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [gradeFilter, setGradeFilter] = useState<string>("all");
  const { run, isPending, pendingKey: busy, busy: anyBusy } = useAdminAction();

  const [createOpen, setCreateOpen] = useState(false);
  const [editing, setEditing] = useState<StudentRow | null>(null);
  const [deleting, setDeleting] = useState<StudentRow | null>(null);
  const [form, setForm] = useState<FormState>(emptyForm);
  const saving = isPending("create") || isPending("edit");

  const load = async () => {
    try {
      const data = await fetchAdminData();
      setRows(buildStudentRows(data));
      setEnrollments(data.enrollments);
    } catch (err: any) {
      toast.error(err.message || "Gagal memuat siswa");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return rows.filter((r) => {
      const matchQuery =
        !q ||
        (r.displayName || "").toLowerCase().includes(q) ||
        (r.email || "").toLowerCase().includes(q) ||
        (r.school || "").toLowerCase().includes(q);
      const matchGrade = gradeFilter === "all" || String(r.grade ?? "") === gradeFilter;
      return matchQuery && matchGrade;
    });
  }, [rows, query, gradeFilter]);

  const openCreate = () => {
    setForm(emptyForm);
    setCreateOpen(true);
  };

  const openEdit = (row: StudentRow) => {
    setForm({
      fullName: row.displayName || "",
      email: row.email || "",
      password: "",
      grade: row.grade ? String(row.grade) : "7",
      phone: row.phone || "",
      school: row.school || "",
      notes: row.notes || "",
      role: row.role === "admin" ? "admin" : row.role === "guru" ? "guru" : "student",
      status: row.status || "active",
    });
    setEditing(row);
  };

  const submitCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.fullName.trim() || !form.email.trim() || form.password.length < 6) {
      toast.error("Nama, email, dan kata sandi (min. 6 karakter) wajib diisi");
      return;
    }
    const ok = await run(
      "create",
      { loading: "Membuat akun siswa...", success: "Akun siswa berhasil dibuat", error: "Gagal membuat akun" },
      async () => {
        await createStudentAccount({
          data: {
            fullName: form.fullName.trim(),
            email: form.email.trim(),
            password: form.password,
            grade: Number(form.grade),
            phone: form.phone.trim(),
            school: form.school.trim(),
            notes: form.notes.trim(),
            role: form.role,
          },
        });
        return true;
      },
    );
    if (!ok) return;
    setCreateOpen(false);
    await load();
  };

  const submitEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editing) return;
    const target = editing;
    const ok = await run(
      "edit",
      { loading: "Menyimpan perubahan siswa...", success: "Data siswa diperbarui", error: "Gagal menyimpan perubahan" },
      async () => {
        await updateProfile(target.id, {
          display_name: form.fullName.trim() || null,
          grade: form.grade ? Number(form.grade) : null,
          phone: form.phone.trim() || null,
          school: form.school.trim() || null,
          notes: form.notes.trim() || null,
          status: form.status,
        });

        const targetEmail = (target.email || "").trim().toLowerCase();
        const nextEmail = form.email.trim().toLowerCase();
        const emailChanged = Boolean(nextEmail) && nextEmail !== targetEmail;
        const passwordChanged = Boolean(form.password && form.password.trim().length >= 6);

        if (emailChanged || passwordChanged) {
          try {
            await updateStudentCredentials({
              data: {
                userId: target.id,
                ...(emailChanged ? { email: form.email.trim() } : {}),
                ...(passwordChanged ? { password: form.password.trim() } : {}),
              },
            });
          } catch (credErr: any) {
            console.warn("[Admin] updateStudentCredentials error:", credErr?.message);
          }
        }

        if (form.role !== target.role && target.id !== currentUserId) {
          await setUserRole(target.id, form.role);
        }
        return true;
      },
    );
    if (!ok) return;
    setEditing(null);
    await load();
  };

  const confirmDelete = async () => {
    if (!deleting) return;
    const target = deleting;
    const ok = await run(
      target.id,
      { loading: "Menghapus akun siswa...", success: "Akun siswa dihapus", error: "Gagal menghapus akun" },
      async () => {
        await deleteStudentAccount({ data: { userId: target.id } });
        return true;
      },
    );
    if (!ok) return;
    setDeleting(null);
    await load();
  };

  const fetchAfter = async (op: Promise<unknown>) => {
    await op;
    return await fetchAdminData();
  };

  const toggleEnrollment = async (userId: string, slug: string, next: boolean) => {
    const result = await run(
      `${userId}-${slug}`,
      {
        loading: next ? "Mendaftarkan siswa ke materi..." : "Membatalkan pendaftaran materi...",
        success: next ? "Siswa didaftarkan ke materi" : "Pendaftaran materi dibatalkan",
        error: "Gagal memperbarui kelas siswa",
      },
      async () => await fetchAfter(next ? enroll(userId, slug) : unenroll(userId, slug)),
    );
    if (!result) return;
    setRows(buildStudentRows(result));
    setEnrollments(result.enrollments);
  };

  const quickRole = async (row: StudentRow) => {
    const next: "admin" | "guru" | "student" =
      row.role === "student" ? "guru" : row.role === "guru" ? "admin" : "student";
    const ok = await run(
      row.id,
      { loading: "Mengubah peran pengguna...", success: `Peran diubah menjadi ${next}`, error: "Gagal mengubah peran" },
      async () => {
        await setUserRole(row.id, next);
        return true;
      },
    );
    if (ok) await load();
  };

  const formFields = (mode: "create" | "edit") => (
    <div className="grid gap-4 sm:grid-cols-2">
      <div className="space-y-2 sm:col-span-2">
        <Label htmlFor="f-name">Nama lengkap</Label>
        <Input
          id="f-name"
          value={form.fullName}
          onChange={(e) => setForm({ ...form, fullName: e.target.value })}
          placeholder="Nama siswa"
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="f-email">Email</Label>
        <Input
          id="f-email"
          type="email"
          value={form.email}
          onChange={(e) => setForm({ ...form, email: e.target.value })}
          placeholder="siswa@sekolah.id"
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="f-pass">{mode === "create" ? "Kata sandi" : "Kata sandi baru (opsional)"}</Label>
        <Input
          id="f-pass"
          type="text"
          value={form.password}
          onChange={(e) => setForm({ ...form, password: e.target.value })}
          placeholder="Minimal 6 karakter"
        />
      </div>
      <div className="space-y-2">
        <Label>Kelas</Label>
        <Select value={form.grade} onValueChange={(v) => setForm({ ...form, grade: v })}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="7">Kelas 7</SelectItem>
            <SelectItem value="8">Kelas 8</SelectItem>
            <SelectItem value="9">Kelas 9</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div className="space-y-2">
        <Label htmlFor="f-phone">No. HP</Label>
        <Input
          id="f-phone"
          value={form.phone}
          onChange={(e) => setForm({ ...form, phone: e.target.value })}
          placeholder="08xxxxxxxxxx"
        />
      </div>
      <div className="space-y-2 sm:col-span-2">
        <Label htmlFor="f-school">Asal sekolah</Label>
        <Input
          id="f-school"
          value={form.school}
          onChange={(e) => setForm({ ...form, school: e.target.value })}
          placeholder="SMP Negeri 1"
        />
      </div>
      <div className="space-y-2">
        <Label>Peran</Label>
        <Select
          disabled={!canManageRoles}
          value={form.role}
          onValueChange={(v) => setForm({ ...form, role: v as "student" | "guru" | "admin" })}
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="student">Siswa</SelectItem>
            <SelectItem value="guru">Guru</SelectItem>
            <SelectItem value="admin">Administrator</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div className="space-y-2">
        <Label>Status akun</Label>
        <Select value={form.status} onValueChange={(v) => setForm({ ...form, status: v })}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="active">Aktif</SelectItem>
            <SelectItem value="inactive">Nonaktif</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div className="space-y-2 sm:col-span-2">
        <Label htmlFor="f-notes">Catatan</Label>
        <Textarea
          id="f-notes"
          rows={3}
          value={form.notes}
          onChange={(e) => setForm({ ...form, notes: e.target.value })}
          placeholder="Catatan pembinaan, target belajar, dll."
        />
      </div>
    </div>
  );

  return (
    <DashboardShell
      role="staff"
      title="Kelola siswa"
      subtitle={`${rows.length} akun terdaftar`}
      actions={
        <Button onClick={openCreate} className="gap-2">
          <UserPlus className="h-4 w-4" /> Tambah siswa
        </Button>
      }
    >
      {loading ? (
        <div className="flex h-64 items-center justify-center">
          <Loader2 className="h-6 w-6 animate-spin text-primary" />
        </div>
      ) : (
        <div className="space-y-4">
          <div className="flex flex-wrap items-center gap-3">
            <div className="relative max-w-sm flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Cari nama, email, atau sekolah"
                className="pl-9"
              />
            </div>
            <Select value={gradeFilter} onValueChange={setGradeFilter}>
              <SelectTrigger className="w-40">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Semua kelas</SelectItem>
                <SelectItem value="7">Kelas 7</SelectItem>
                <SelectItem value="8">Kelas 8</SelectItem>
                <SelectItem value="9">Kelas 9</SelectItem>
              </SelectContent>
            </Select>
            <Button variant="outline" onClick={openCreate} className="gap-2 sm:hidden">
              <UserPlus className="h-4 w-4" /> Tambah
            </Button>
          </div>

          <div className="overflow-x-auto rounded-2xl border border-border/60 bg-background">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Siswa</TableHead>
                  <TableHead className="hidden lg:table-cell">Kontak</TableHead>
                  <TableHead>Peran</TableHead>
                  <TableHead className="hidden md:table-cell">Kelas</TableHead>
                  <TableHead className="hidden md:table-cell">Modul</TableHead>
                  <TableHead>Progres</TableHead>
                  <TableHead className="hidden lg:table-cell">Aktivitas</TableHead>
                  <TableHead className="text-right">Aksi</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((r) => (
                  <TableRow key={r.id}>
                    <TableCell>
                      <p className="font-medium">{r.displayName || "Siswa tanpa nama"}</p>
                      <p className="text-xs text-muted-foreground">
                        {r.grade ? `Kelas ${r.grade}` : "Kelas —"} · Bergabung {formatDate(r.createdAt)}
                      </p>
                      {r.status !== "active" && (
                        <Badge variant="destructive" className="mt-1">
                          Nonaktif
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell className="hidden lg:table-cell text-sm text-muted-foreground">
                      <p>{r.email || "—"}</p>
                      <p className="text-xs">{r.phone || r.school || ""}</p>
                    </TableCell>
                    <TableCell>
                      <Badge variant={r.role === "student" ? "secondary" : "default"} className="gap-1">
                        {r.role === "admin" ? (
                          <ShieldCheck className="h-3 w-3" />
                        ) : r.role === "guru" ? (
                          <Presentation className="h-3 w-3" />
                        ) : (
                          <GraduationCap className="h-3 w-3" />
                        )}
                        {r.role === "admin" ? "Admin" : r.role === "guru" ? "Guru" : "Siswa"}
                      </Badge>
                    </TableCell>
                    <TableCell className="hidden md:table-cell">{r.enrollments}</TableCell>
                    <TableCell className="hidden md:table-cell">
                      {r.completedModules}/{r.totalModules}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Progress value={r.progress} className="h-1.5 w-16" />
                        <span className="text-xs text-muted-foreground">{r.progress}%</span>
                      </div>
                    </TableCell>
                    <TableCell className="hidden lg:table-cell text-sm text-muted-foreground">
                      {formatDate(r.lastActivity)}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center justify-end gap-1">
                        <Button
                          size="icon"
                          variant="ghost"
                          aria-label="Ubah data siswa"
                          disabled={anyBusy}
                          onClick={() => openEdit(r)}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          size="icon"
                          variant="ghost"
                          aria-label="Ubah peran"
                          disabled={anyBusy || r.id === currentUserId || !canManageRoles}
                          onClick={() => quickRole(r)}
                        >
                          {busy === r.id ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <KeyRound className="h-4 w-4" />
                          )}
                        </Button>
                        <Button
                          size="icon"
                          variant="ghost"
                          aria-label="Hapus siswa"
                          disabled={anyBusy || r.id === currentUserId || !canManageRoles}
                          onClick={() => setDeleting(r)}
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
                {filtered.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={8} className="py-8 text-center text-sm text-muted-foreground">
                      Tidak ada siswa yang cocok.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </div>
      )}

      {/* Create */}
      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>Tambah data siswa</DialogTitle>
            <DialogDescription>
              Akun langsung aktif dan siswa dapat masuk dengan email serta kata sandi ini.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={submitCreate} className="space-y-5">
            {formFields("create")}
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setCreateOpen(false)} disabled={saving}>
                Batal
              </Button>
              <Button type="submit" disabled={saving}>
                {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Simpan siswa
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Edit */}
      <Dialog open={!!editing} onOpenChange={(v) => !v && setEditing(null)}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>Ubah data siswa</DialogTitle>
            <DialogDescription>Perbarui profil, akses akun, dan kelas yang diikuti.</DialogDescription>
          </DialogHeader>
          <form onSubmit={submitEdit} className="space-y-5">
            {formFields("edit")}

            {editing && (
              <div className="space-y-2">
                <Label>Kelas yang diikuti</Label>
                <div className="grid max-h-56 gap-2 overflow-y-auto rounded-xl border border-border/60 p-3 sm:grid-cols-2">
                  {materials.map((m) => {
                    const active = enrollments.some(
                      (e) => e.userId === editing.id && e.materialSlug === m.slug,
                    );
                    return (
                      <label key={m.slug} className="flex items-start gap-2 text-sm">
                        <Checkbox
                          checked={active}
                          disabled={busy === `${editing.id}-${m.slug}`}
                          onCheckedChange={(v) => toggleEnrollment(editing.id, m.slug, !!v)}
                        />
                        <span>
                          {m.title}
                          <span className="block text-xs text-muted-foreground">
                            Kelas {m.grade} · {m.subject}
                          </span>
                        </span>
                      </label>
                    );
                  })}
                </div>
              </div>
            )}

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setEditing(null)} disabled={saving}>
                Tutup
              </Button>
              <Button type="submit" disabled={saving}>
                {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Simpan perubahan
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete */}
      <AlertDialog open={!!deleting} onOpenChange={(v) => !v && setDeleting(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Hapus akun siswa?</AlertDialogTitle>
            <AlertDialogDescription>
              Akun {deleting?.displayName || deleting?.email} beserta seluruh progres belajarnya akan
              dihapus permanen.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Batal</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete} disabled={anyBusy}>
              {anyBusy && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Hapus
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </DashboardShell>
  );
}
