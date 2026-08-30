import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Archive, CalendarRange, CheckCircle2, Loader2, Pencil, Plus, RotateCcw, Trash2 } from "lucide-react";
import { DashboardShell, StatCard } from "@/components/DashboardShell";
import { RequireRole } from "@/components/RequireRole";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
import {
  activateTerm,
  createTerm,
  deleteTerm,
  semesterLabel,
  setArchived,
  updateTerm,
  useTerms,
  type Term,
  type TermInput,
} from "@/lib/terms";

export const Route = createFileRoute("/admin/periode")({
  head: () => ({
    meta: [
      { title: "Tahun ajaran & semester — Admin Continuum LMS" },
      {
        name: "description",
        content: "Atur tahun pembelajaran dan semester aktif, serta kelola arsip periode lampau untuk laporan.",
      },
      { property: "og:title", content: "Tahun ajaran & semester — Admin Continuum LMS" },
      { property: "og:description", content: "Kelola periode aktif dan arsip tahun ajaran pada LMS." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: () => <RequireRole role="admin">{({ userId }) => <TermsPage userId={userId} />}</RequireRole>,
});

const emptyForm: TermInput = {
  yearLabel: `${new Date().getFullYear()}/${new Date().getFullYear() + 1}`,
  semester: 1,
  startDate: "",
  endDate: "",
  notes: "",
};

function TermsPage({ userId }: { userId: string }) {
  const { terms, active, loading, reload } = useTerms();
  const { run, isPending, busy } = useAdminAction();
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Term | null>(null);
  const [form, setForm] = useState<TermInput>(emptyForm);

  const openNew = () => {
    setEditing(null);
    setForm(emptyForm);
    setOpen(true);
  };

  const openEdit = (t: Term) => {
    setEditing(t);
    setForm({
      yearLabel: t.yearLabel,
      semester: t.semester,
      startDate: t.startDate ?? "",
      endDate: t.endDate ?? "",
      notes: t.notes,
    });
    setOpen(true);
  };

  const save = () =>
    run(
      "save",
      {
        loading: "Menyimpan periode…",
        success: editing ? "Periode diperbarui" : "Periode baru dibuat",
        error: "Gagal menyimpan periode",
      },
      async () => {
        if (!form.yearLabel.trim()) throw new Error("Label tahun ajaran wajib diisi");
        if (editing) await updateTerm(editing.id, form);
        else await createTerm(form, userId);
        await reload();
        setOpen(false);
      },
    );

  const activate = (t: Term) =>
    run(
      `activate-${t.id}`,
      {
        loading: "Mengaktifkan periode…",
        success: `${t.yearLabel} semester ${semesterLabel(t.semester)} kini aktif`,
        error: "Gagal mengaktifkan periode",
      },
      async () => {
        await activateTerm(t.id);
        await reload();
      },
    );

  const archive = (t: Term, archived: boolean) =>
    run(
      `archive-${t.id}`,
      {
        loading: archived ? "Mengarsipkan…" : "Mengembalikan dari arsip…",
        success: archived ? "Periode masuk arsip" : "Periode keluar dari arsip",
        error: "Gagal memperbarui arsip",
      },
      async () => {
        await setArchived(t.id, archived);
        await reload();
      },
    );

  const remove = (t: Term) =>
    run(
      `delete-${t.id}`,
      { loading: "Menghapus periode…", success: "Periode dihapus", error: "Gagal menghapus periode" },
      async () => {
        await deleteTerm(t.id);
        await reload();
      },
    );

  const archived = terms.filter((t) => !t.isActive);

  return (
    <DashboardShell
      role="admin"
      title="Tahun ajaran & semester"
      subtitle="Satu periode aktif; sisanya tersimpan sebagai arsip laporan."
      actions={
        <Button onClick={openNew} size="sm">
          <Plus className="mr-2 h-4 w-4" />
          Periode baru
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
            <StatCard
              label="Periode aktif"
              value={active ? `${active.yearLabel}` : "—"}
              hint={active ? `Semester ${semesterLabel(active.semester)}` : "Belum ada periode aktif"}
              icon={CheckCircle2}
            />
            <StatCard label="Total periode" value={terms.length} hint="Termasuk arsip" icon={CalendarRange} />
            <StatCard label="Arsip" value={archived.length} hint="Siap dipakai untuk laporan" icon={Archive} />
          </div>

          <div className="rounded-2xl border border-border/60 bg-background">
            <div className="border-b border-border/60 px-5 py-4">
              <h2 className="text-sm font-semibold">Daftar periode</h2>
              <p className="text-xs text-muted-foreground">
                Absensi, jurnal, jadwal, dan penilaian rubrik baru otomatis tercatat pada periode aktif.
              </p>
            </div>
            <ul className="divide-y divide-border/60">
              {terms.map((t) => (
                <li key={t.id} className="flex flex-wrap items-center gap-3 px-5 py-4">
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="font-medium">{t.yearLabel}</p>
                      <Badge variant="secondary">Semester {semesterLabel(t.semester)}</Badge>
                      {t.isActive ? (
                        <Badge className="bg-primary/15 text-primary hover:bg-primary/15">Aktif</Badge>
                      ) : t.isArchived ? (
                        <Badge variant="outline">Arsip</Badge>
                      ) : (
                        <Badge variant="outline">Draf</Badge>
                      )}
                    </div>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {t.startDate || "—"} s/d {t.endDate || "—"}
                      {t.notes ? ` · ${t.notes}` : ""}
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {!t.isActive && (
                      <Button size="sm" variant="outline" disabled={busy} onClick={() => activate(t)}>
                        {isPending(`activate-${t.id}`) ? (
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        ) : (
                          <CheckCircle2 className="mr-2 h-4 w-4" />
                        )}
                        Aktifkan
                      </Button>
                    )}
                    {!t.isActive && (
                      <Button
                        size="sm"
                        variant="ghost"
                        disabled={busy}
                        onClick={() => archive(t, !t.isArchived)}
                        title={t.isArchived ? "Keluarkan dari arsip" : "Arsipkan"}
                      >
                        {isPending(`archive-${t.id}`) ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : t.isArchived ? (
                          <RotateCcw className="h-4 w-4" />
                        ) : (
                          <Archive className="h-4 w-4" />
                        )}
                      </Button>
                    )}
                    <Button size="sm" variant="ghost" onClick={() => openEdit(t)} aria-label="Ubah">
                      <Pencil className="h-4 w-4" />
                    </Button>
                    {!t.isActive && (
                      <Button size="sm" variant="ghost" disabled={busy} onClick={() => remove(t)} aria-label="Hapus">
                        {isPending(`delete-${t.id}`) ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <Trash2 className="h-4 w-4 text-destructive" />
                        )}
                      </Button>
                    )}
                  </div>
                </li>
              ))}
              {!terms.length && (
                <li className="px-5 py-10 text-center text-sm text-muted-foreground">
                  Belum ada periode. Buat tahun ajaran pertama.
                </li>
              )}
            </ul>
          </div>
        </div>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{editing ? "Ubah periode" : "Periode baru"}</DialogTitle>
            <DialogDescription>
              Gunakan format tahun ajaran seperti 2026/2027 dan pilih semester ganjil atau genap.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label>Tahun ajaran</Label>
                <Input
                  value={form.yearLabel}
                  placeholder="2026/2027"
                  onChange={(e) => setForm({ ...form, yearLabel: e.target.value })}
                />
              </div>
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
                    <SelectItem value="1">Ganjil</SelectItem>
                    <SelectItem value="2">Genap</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Mulai</Label>
                <Input
                  type="date"
                  value={form.startDate ?? ""}
                  onChange={(e) => setForm({ ...form, startDate: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>Selesai</Label>
                <Input
                  type="date"
                  value={form.endDate ?? ""}
                  onChange={(e) => setForm({ ...form, endDate: e.target.value })}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Catatan</Label>
              <Textarea
                rows={2}
                value={form.notes}
                onChange={(e) => setForm({ ...form, notes: e.target.value })}
                placeholder="Misal: semester dengan program proyek digital"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>
              Batal
            </Button>
            <Button onClick={save} disabled={busy}>
              {isPending("save") ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              Simpan
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </DashboardShell>
  );
}
