import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { CalendarDays, ExternalLink, Loader2, Paperclip, Pencil, Plus, Trash2, Upload, X, History } from "lucide-react";
import { toast } from "sonner";
import { DashboardShell } from "@/components/DashboardShell";
import { RequireRole } from "@/components/RequireRole";
import { ClassReminderCard } from "@/components/ClassReminderCard";
import { ScheduleMaterialDialog } from "@/components/ScheduleMaterialDialog";
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
import { useCatalog } from "@/lib/materials-db";
import { resolveSiteAsset, uploadSiteAsset } from "@/lib/site-settings";
import {
  dayNames,
  deleteSchedule,
  fetchSchedules,
  saveSchedule,
  type Schedule,
} from "@/lib/teaching";

const isUploadPath = (value: string) => value.startsWith("materi-jadwal/");

/** Renders the linked lesson material: catalog page, uploaded file, or external URL. */
function MaterialLink({ value, catalogTitle }: { value: string; catalogTitle?: string }) {
  const [href, setHref] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    if (isUploadPath(value)) {
      resolveSiteAsset(value).then((url) => active && setHref(url));
    }
    return () => {
      active = false;
    };
  }, [value]);

  if (isUploadPath(value)) {
    return href ? (
      <a
        href={href}
        target="_blank"
        rel="noreferrer"
        className="mt-1 inline-flex items-center gap-1 text-xs font-medium text-primary hover:underline"
      >
        <Paperclip className="h-3 w-3" /> Berkas materi
      </a>
    ) : (
      <span className="mt-1 inline-flex items-center gap-1 text-xs text-muted-foreground">
        <Loader2 className="h-3 w-3 animate-spin" /> Memuat berkas...
      </span>
    );
  }

  if (/^https?:\/\//.test(value)) {
    return (
      <a
        href={value}
        target="_blank"
        rel="noreferrer"
        className="mt-1 inline-flex items-center gap-1 text-xs font-medium text-primary hover:underline"
      >
        <ExternalLink className="h-3 w-3" /> Tautan materi
      </a>
    );
  }

  return (
    <Link
      to="/materi/$slug"
      params={{ slug: value }}
      className="mt-1 inline-flex items-center gap-1 text-xs font-medium text-primary hover:underline"
    >
      <ExternalLink className="h-3 w-3" /> {catalogTitle ?? value}
    </Link>
  );
}

export const Route = createFileRoute("/admin/jadwal")({
  head: () => ({
    meta: [
      { title: "Jadwal pembelajaran — Continuum LMS" },
      { name: "description", content: "Susun jadwal mengajar mingguan Digital Class untuk kelas 7, 8, dan 9." },
      { property: "og:title", content: "Jadwal pembelajaran — Continuum LMS" },
      { property: "og:description", content: "Kelola jadwal mingguan tiap kelas dengan rapi." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: () => <RequireRole role="staff">{({ userId }) => <SchedulePage userId={userId} />}</RequireRole>,
});

const emptyForm = {
  id: undefined as string | undefined,
  grade: "7",
  subject: "Digital Class",
  title: "",
  dayOfWeek: "1",
  startTime: "07:30",
  endTime: "09:00",
  room: "",
  materialSlug: "",
};

function SchedulePage({ userId }: { userId: string }) {
  const [items, setItems] = useState<Schedule[]>([]);
  const [versionsFor, setVersionsFor] = useState<Schedule | null>(null);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");
  const [form, setForm] = useState(emptyForm);
  const { run, isPending, busy } = useAdminAction();
  const { list: catalog } = useCatalog(true);
  const fileRef = useRef<HTMLInputElement>(null);
  const saving = isPending("save");
  const catalogTitle = (slug: string) => catalog.find((m) => m.slug === slug)?.title;

  const uploadMaterial = async (file: File) => {
    const path = await run(
      "upload",
      { loading: "Mengunggah materi...", success: "Materi terunggah", error: "Gagal mengunggah materi" },
      () => uploadSiteAsset(file, "materi-jadwal"),
    );
    if (path) setForm((prev) => ({ ...prev, materialSlug: path }));
  };

  const load = async () => {
    try {
      setItems(await fetchSchedules());
    } catch (err: any) {
      toast.error(err.message || "Gagal memuat jadwal");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title.trim()) return;
    const editMode = Boolean(form.id);
    const ok = await run(
      "save",
      {
        loading: editMode ? "Menyimpan perubahan jadwal..." : "Menambahkan jadwal...",
        success: editMode ? "Jadwal diperbarui" : "Jadwal ditambahkan",
        error: "Gagal menyimpan jadwal",
      },
      async () => {
        await saveSchedule({
          id: form.id,
          grade: Number(form.grade),
          subject: form.subject.trim() || "Digital Class",
          title: form.title.trim(),
          dayOfWeek: Number(form.dayOfWeek),
          startTime: form.startTime,
          endTime: form.endTime,
          room: form.room.trim(),
          materialSlug: form.materialSlug.trim() || null,
          userId,
        });
        return true;
      },
    );
    if (!ok) return;
    setForm(emptyForm);
    await load();
  };

  const remove = async (id: string) => {
    const ok = await run(
      `del-${id}`,
      { loading: "Menghapus jadwal...", success: "Jadwal dihapus", error: "Gagal menghapus jadwal" },
      async () => {
        await deleteSchedule(id);
        return true;
      },
    );
    if (ok) setItems((prev) => prev.filter((i) => i.id !== id));
  };

  const visible = filter === "all" ? items : items.filter((i) => String(i.grade) === filter);
  const byDay = dayNames.map((_, day) => visible.filter((i) => i.dayOfWeek === day));

  return (
    <DashboardShell role="staff" title="Jadwal pembelajaran" subtitle="Rencana mengajar mingguan tiap kelas">
      <div className="grid gap-6 lg:grid-cols-[340px_1fr]">
        <form onSubmit={submit} className="h-fit space-y-4 rounded-2xl border border-border/60 bg-background p-5">
          <h2 className="flex items-center gap-2 text-base font-semibold tracking-tight">
            <CalendarDays className="h-4 w-4 text-primary" /> {form.id ? "Ubah jadwal" : "Jadwal baru"}
          </h2>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label>Kelas</Label>
              <Select value={form.grade} onValueChange={(v) => setForm({ ...form, grade: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {[7, 8, 9].map((g) => (
                    <SelectItem key={g} value={String(g)}>Kelas {g}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Hari</Label>
              <Select value={form.dayOfWeek} onValueChange={(v) => setForm({ ...form, dayOfWeek: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {dayNames.map((d, i) => (
                    <SelectItem key={d} value={String(i)}>{d}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="title">Topik / kegiatan</Label>
            <Input id="title" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="Misal: Dasar spreadsheet" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="subject">Mata pelajaran</Label>
            <Input id="subject" value={form.subject} onChange={(e) => setForm({ ...form, subject: e.target.value })} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label htmlFor="start">Mulai</Label>
              <Input id="start" type="time" value={form.startTime} onChange={(e) => setForm({ ...form, startTime: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="end">Selesai</Label>
              <Input id="end" type="time" value={form.endTime} onChange={(e) => setForm({ ...form, endTime: e.target.value })} />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="room">Ruang</Label>
            <Input id="room" value={form.room} onChange={(e) => setForm({ ...form, room: e.target.value })} placeholder="Lab Komputer" />
          </div>

          <div className="space-y-2 rounded-xl border border-border/50 bg-muted/20 p-3">
            <Label className="text-xs uppercase tracking-wider text-muted-foreground">Materi pertemuan</Label>
            <Select
              value={form.materialSlug && !isUploadPath(form.materialSlug) && !/^https?:/.test(form.materialSlug) ? form.materialSlug : "none"}
              onValueChange={(v) => setForm({ ...form, materialSlug: v === "none" ? "" : v })}
            >
              <SelectTrigger><SelectValue placeholder="Pilih materi" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="none">Tanpa materi</SelectItem>
                {catalog
                  .filter((m) => String(m.grade) === form.grade)
                  .map((m) => (
                    <SelectItem key={m.slug} value={m.slug}>{m.title}</SelectItem>
                  ))}
              </SelectContent>
            </Select>
            <Input
              value={form.materialSlug}
              onChange={(e) => setForm({ ...form, materialSlug: e.target.value })}
              placeholder="atau tempel tautan (Google Drive, YouTube, dll.)"
            />
            <input
              ref={fileRef}
              type="file"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) void uploadMaterial(file);
                e.target.value = "";
              }}
            />
            <Button type="button" variant="outline" size="sm" className="w-full" disabled={busy} onClick={() => fileRef.current?.click()}>
              {isPending("upload") ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Upload className="mr-2 h-4 w-4" />}
              Unggah berkas materi
            </Button>
            {form.materialSlug && (
              <p className="truncate text-[11px] text-muted-foreground">Tertaut: {form.materialSlug}</p>
            )}
          </div>

          <Button type="submit" className="w-full" disabled={busy || !form.title.trim()}>
            {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Plus className="mr-2 h-4 w-4" />}
            {saving ? "Memproses..." : form.id ? "Simpan perubahan" : "Tambah jadwal"}
          </Button>
          {form.id && (
            <Button type="button" variant="outline" className="w-full" onClick={() => setForm(emptyForm)}>
              <X className="mr-2 h-4 w-4" /> Batal ubah
            </Button>
          )}
        </form>

        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <Label className="text-xs text-muted-foreground">Tampilkan</Label>
            <Select value={filter} onValueChange={setFilter}>
              <SelectTrigger className="w-40"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Semua kelas</SelectItem>
                {[7, 8, 9].map((g) => (
                  <SelectItem key={g} value={String(g)}>Kelas {g}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <ClassReminderCard schedules={filter === "all" ? items : visible} audience="staff" />

          {loading ? (
            <div className="flex h-40 items-center justify-center">
              <Loader2 className="h-6 w-6 animate-spin text-primary" />
            </div>
          ) : (
            <div className="grid gap-3 sm:grid-cols-2">
              {byDay.map((list, day) => (
                <div key={day} className="rounded-2xl border border-border/60 bg-background p-4">
                  <p className="text-sm font-semibold tracking-tight">{dayNames[day]}</p>
                  {list.length === 0 ? (
                    <p className="mt-2 text-xs text-muted-foreground">Tidak ada jadwal.</p>
                  ) : (
                    <ul className="mt-3 space-y-2">
                      {list.map((s) => (
                        <li key={s.id} className="rounded-xl border border-border/50 bg-muted/30 p-3">
                          <div className="flex items-start justify-between gap-2">
                            <div className="min-w-0">
                              <p className="truncate text-sm font-medium">{s.title}</p>
                              <p className="text-xs text-muted-foreground">
                                {s.startTime}–{s.endTime} · {s.subject}
                                {s.room ? ` · ${s.room}` : ""}
                              </p>
                              {s.materialSlug && (
                                <MaterialLink value={s.materialSlug} catalogTitle={catalogTitle(s.materialSlug)} />
                              )}
                            </div>
                            <div className="flex shrink-0 items-center gap-1">
                              <Badge variant="secondary">K{s.grade}</Badge>
                              <Button
                                size="icon"
                                variant="ghost"
                                aria-label="Ubah jadwal"
                                disabled={busy}
                                onClick={() =>
                                  setForm({
                                    id: s.id,
                                    grade: String(s.grade),
                                    subject: s.subject,
                                    title: s.title,
                                    dayOfWeek: String(s.dayOfWeek),
                                    startTime: s.startTime,
                                    endTime: s.endTime,
                                     room: s.room ?? "",
                                     materialSlug: s.materialSlug ?? "",
                                   })
                                }
                              >
                                <Pencil className="h-3.5 w-3.5" />
                              </Button>
                              <Button size="icon" variant="ghost" aria-label="Hapus jadwal" disabled={busy} onClick={() => remove(s.id)}>
                                {isPending(`del-${s.id}`) ? (
                                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                                ) : (
                                  <Trash2 className="h-3.5 w-3.5 text-destructive" />
                                )}
                              </Button>
                            </div>
                          </div>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
      <ScheduleMaterialDialog
        schedule={versionsFor}
        userId={userId}
        open={Boolean(versionsFor)}
        onOpenChange={(v) => !v && setVersionsFor(null)}
        onChanged={load}
      />
    </DashboardShell>
  );
}
