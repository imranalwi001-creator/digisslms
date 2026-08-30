import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { BookMarked, Bookmark, Loader2, Pencil, Plus, Trash2, X } from "lucide-react";
import { toast } from "sonner";
import { DashboardShell } from "@/components/DashboardShell";
import { RequireRole } from "@/components/RequireRole";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
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
import {
  builtinJournalTemplates,
  deleteCustomTemplate,
  loadCustomTemplates,
  saveCustomTemplate,
  type JournalTemplate,
} from "@/lib/journal-templates";
import { deleteJournal, fetchJournals, formatDay, saveJournal, type Journal } from "@/lib/teaching";

export const Route = createFileRoute("/admin/jurnal")({
  head: () => ({
    meta: [
      { title: "Jurnal harian mengajar — Continuum LMS" },
      { name: "description", content: "Catat kegiatan, hambatan, dan refleksi pembelajaran harian Digital Class." },
      { property: "og:title", content: "Jurnal harian mengajar — Continuum LMS" },
      { property: "og:description", content: "Dokumentasi harian proses pembelajaran di kelas." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: () => <RequireRole role="staff">{({ userId }) => <JournalPage userId={userId} />}</RequireRole>,
});

const emptyForm = {
  id: undefined as string | undefined,
  journalDate: new Date().toISOString().slice(0, 10),
  grade: "7",
  topic: "",
  activities: "",
  obstacles: "",
  reflection: "",
};

function JournalPage({ userId }: { userId: string }) {
  const [items, setItems] = useState<Journal[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");
  const [form, setForm] = useState(emptyForm);
  const { run, isPending, busy } = useAdminAction();
  const saving = isPending("save");
  const [customTemplates, setCustomTemplates] = useState<JournalTemplate[]>([]);
  const [templateId, setTemplateId] = useState("none");

  useEffect(() => {
    setCustomTemplates(loadCustomTemplates());
  }, []);

  const templates = useMemo(
    () => [...builtinJournalTemplates, ...customTemplates],
    [customTemplates],
  );

  const applyTemplate = (id: string) => {
    setTemplateId(id);
    const tpl = templates.find((t) => t.id === id);
    if (!tpl) return;
    setForm((prev) => ({
      ...prev,
      activities: tpl.activities,
      obstacles: tpl.obstacles,
      reflection: tpl.reflection,
    }));
    toast.success(`Template "${tpl.name}" diterapkan`);
  };

  const storeTemplate = () => {
    const name = window.prompt("Nama template", form.topic.trim() || "Template saya");
    if (!name?.trim()) return;
    setCustomTemplates(
      saveCustomTemplate({
        name: name.trim(),
        activities: form.activities,
        obstacles: form.obstacles,
        reflection: form.reflection,
      }),
    );
    toast.success("Template tersimpan");
  };

  const removeTemplate = (id: string) => {
    setCustomTemplates(deleteCustomTemplate(id));
    if (templateId === id) setTemplateId("none");
    toast.success("Template dihapus");
  };

  const load = async () => {
    try {
      setItems(await fetchJournals());
    } catch (err: any) {
      toast.error(err.message || "Gagal memuat jurnal");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.topic.trim()) return;
    const editMode = Boolean(form.id);
    const ok = await run(
      "save",
      {
        loading: editMode ? "Menyimpan perubahan jurnal..." : "Menyimpan jurnal...",
        success: editMode ? "Jurnal diperbarui" : "Jurnal tersimpan",
        error: "Gagal menyimpan jurnal",
      },
      async () => {
        await saveJournal({
          id: form.id,
          journalDate: form.journalDate,
          grade: Number(form.grade),
          topic: form.topic.trim(),
          activities: form.activities.trim(),
          obstacles: form.obstacles.trim(),
          reflection: form.reflection.trim(),
          sessionId: null,
          userId,
        });
        return true;
      },
    );
    if (!ok) return;
    setForm({ ...emptyForm, journalDate: form.journalDate, grade: form.grade });
    await load();
  };

  const remove = async (id: string) => {
    const ok = await run(
      `del-${id}`,
      { loading: "Menghapus jurnal...", success: "Jurnal dihapus", error: "Gagal menghapus jurnal" },
      async () => {
        await deleteJournal(id);
        return true;
      },
    );
    if (ok) setItems((prev) => prev.filter((i) => i.id !== id));
  };

  const visible = filter === "all" ? items : items.filter((i) => String(i.grade) === filter);

  return (
    <DashboardShell role="staff" title="Jurnal harian" subtitle="Dokumentasi kegiatan, hambatan, dan refleksi mengajar">
      <div className="grid gap-6 lg:grid-cols-[380px_1fr]">
        <form onSubmit={submit} className="h-fit space-y-4 rounded-2xl border border-border/60 bg-background p-5">
          <h2 className="flex items-center gap-2 text-base font-semibold tracking-tight">
            <BookMarked className="h-4 w-4 text-primary" /> {form.id ? "Ubah jurnal" : "Jurnal baru"}
          </h2>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label htmlFor="tanggal">Tanggal</Label>
              <Input id="tanggal" type="date" value={form.journalDate} onChange={(e) => setForm({ ...form, journalDate: e.target.value })} />
            </div>
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
          </div>
          <div className="space-y-2">
            <Label htmlFor="topik">Topik pembelajaran</Label>
            <Input id="topik" value={form.topic} onChange={(e) => setForm({ ...form, topic: e.target.value })} placeholder="Misal: Algoritma percabangan" />
          </div>
          <div className="space-y-2 rounded-xl border border-border/50 bg-muted/20 p-3">
            <Label className="text-xs uppercase tracking-wider text-muted-foreground">Template jurnal</Label>
            <Select value={templateId} onValueChange={applyTemplate}>
              <SelectTrigger><SelectValue placeholder="Pilih template" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="none">Tanpa template</SelectItem>
                {templates.map((t) => (
                  <SelectItem key={t.id} value={t.id}>
                    {t.name}
                    {t.builtin ? "" : " (saya)"}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button type="button" variant="outline" size="sm" className="w-full" onClick={storeTemplate}>
              <Bookmark className="mr-2 h-4 w-4" /> Simpan isian ini sebagai template
            </Button>
            {customTemplates.length > 0 && (
              <ul className="space-y-1 pt-1">
                {customTemplates.map((t) => (
                  <li key={t.id} className="flex items-center justify-between gap-2 text-xs text-muted-foreground">
                    <span className="truncate">{t.name}</span>
                    <button type="button" className="text-destructive hover:underline" onClick={() => removeTemplate(t.id)}>
                      Hapus
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
          <div className="space-y-2">
            <Label htmlFor="kegiatan">Kegiatan</Label>
            <Textarea id="kegiatan" rows={4} value={form.activities} onChange={(e) => setForm({ ...form, activities: e.target.value })} placeholder="Apa saja yang dilakukan di kelas..." />
          </div>
          <div className="space-y-2">
            <Label htmlFor="hambatan">Hambatan</Label>
            <Textarea id="hambatan" rows={3} value={form.obstacles} onChange={(e) => setForm({ ...form, obstacles: e.target.value })} placeholder="Kendala yang muncul..." />
          </div>
          <div className="space-y-2">
            <Label htmlFor="refleksi">Refleksi / tindak lanjut</Label>
            <Textarea id="refleksi" rows={3} value={form.reflection} onChange={(e) => setForm({ ...form, reflection: e.target.value })} placeholder="Rencana perbaikan pertemuan berikutnya..." />
          </div>
          <Button type="submit" className="w-full" disabled={busy || !form.topic.trim()}>
            {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Plus className="mr-2 h-4 w-4" />}
            {saving ? "Memproses..." : form.id ? "Simpan perubahan" : "Simpan jurnal"}
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

          {loading ? (
            <div className="flex h-40 items-center justify-center">
              <Loader2 className="h-6 w-6 animate-spin text-primary" />
            </div>
          ) : visible.length === 0 ? (
            <p className="text-sm text-muted-foreground">Belum ada jurnal.</p>
          ) : (
            <div className="space-y-3">
              {visible.map((j) => (
                <article key={j.id} className="rounded-2xl border border-border/60 bg-background p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="font-medium">{j.topic}</h3>
                        <Badge variant="secondary">Kelas {j.grade}</Badge>
                      </div>
                      <p className="mt-1 text-xs text-muted-foreground">{formatDay(j.journalDate)}</p>
                      {j.activities && (
                        <p className="mt-2 text-sm text-muted-foreground">
                          <span className="font-medium text-foreground">Kegiatan: </span>
                          {j.activities}
                        </p>
                      )}
                      {j.obstacles && (
                        <p className="mt-1 text-sm text-muted-foreground">
                          <span className="font-medium text-foreground">Hambatan: </span>
                          {j.obstacles}
                        </p>
                      )}
                      {j.reflection && (
                        <p className="mt-1 text-sm text-muted-foreground">
                          <span className="font-medium text-foreground">Refleksi: </span>
                          {j.reflection}
                        </p>
                      )}
                    </div>
                    <div className="flex shrink-0 items-center gap-1">
                      <Button
                        size="icon"
                        variant="ghost"
                        aria-label="Ubah jurnal"
                        disabled={busy}
                        onClick={() =>
                          setForm({
                            id: j.id,
                            journalDate: j.journalDate,
                            grade: String(j.grade),
                            topic: j.topic,
                            activities: j.activities,
                            obstacles: j.obstacles,
                            reflection: j.reflection,
                          })
                        }
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button size="icon" variant="ghost" aria-label="Hapus jurnal" disabled={busy} onClick={() => remove(j.id)}>
                        {isPending(`del-${j.id}`) ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <Trash2 className="h-4 w-4 text-destructive" />
                        )}
                      </Button>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          )}
        </div>
      </div>
    </DashboardShell>
  );
}
