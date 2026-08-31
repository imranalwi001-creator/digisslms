import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Loader2, Megaphone, Trash2, Plus, Pencil, X } from "lucide-react";
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
import {
  fetchAnnouncements,
  createAnnouncement,
  updateAnnouncement,
  deleteAnnouncement,
  formatDate,
  type Announcement,
} from "@/lib/lms";
import { useAdminAction } from "@/lib/admin-action";

export const Route = createFileRoute("/admin/pengumuman")({
  head: () => ({
    meta: [
      { title: "Pengumuman — Admin Digisschool LMS" },
      { name: "description", content: "Buat dan kelola pengumuman yang tampil di dashboard santri." },
      { property: "og:title", content: "Pengumuman — Admin Digisschool LMS" },
      { property: "og:description", content: "Kelola pengumuman untuk seluruh santri." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: () => <RequireRole role="staff">{({ userId }) => <AdminAnnouncements userId={userId} />}</RequireRole>,
});

function AdminAnnouncements({ userId }: { userId: string }) {
  const [items, setItems] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState(true);
  const { run, isPending, busy } = useAdminAction();
  const saving = isPending("save");
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [level, setLevel] = useState("info");
  const [editingId, setEditingId] = useState<string | null>(null);

  const resetForm = () => {
    setEditingId(null);
    setTitle("");
    setBody("");
    setLevel("info");
  };

  const startEdit = (a: Announcement) => {
    setEditingId(a.id);
    setTitle(a.title);
    setBody(a.body);
    setLevel(a.level);
  };

  const load = async () => {
    try {
      setItems(await fetchAnnouncements(50));
    } catch (err: any) {
      toast.error(err.message || "Gagal memuat pengumuman");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;
    const editMode = Boolean(editingId);
    const ok = await run(
      "save",
      {
        loading: editMode ? "Menyimpan perubahan pengumuman..." : "Menerbitkan pengumuman...",
        success: editMode ? "Pengumuman diperbarui" : "Pengumuman diterbitkan",
        error: editMode ? "Gagal menyimpan pengumuman" : "Gagal menerbitkan pengumuman",
      },
      async () => {
        if (editingId) {
          await updateAnnouncement(editingId, { title: title.trim(), body: body.trim(), level });
        } else {
          await createAnnouncement({ title: title.trim(), body: body.trim(), level, userId });
        }
        return true;
      },
    );
    if (!ok) return;
    resetForm();
    await load();
  };

  const remove = async (id: string) => {
    const ok = await run(
      `delete-${id}`,
      { loading: "Menghapus pengumuman...", success: "Pengumuman dihapus", error: "Gagal menghapus pengumuman" },
      async () => {
        await deleteAnnouncement(id);
        return true;
      },
    );
    if (ok) setItems((prev) => prev.filter((i) => i.id !== id));
  };

  return (
    <DashboardShell role="staff" title="Pengumuman" subtitle="Kabar yang tampil di dashboard siswa">
      <div className="grid gap-6 lg:grid-cols-[380px_1fr]">
        <form onSubmit={submit} className="h-fit space-y-4 rounded-2xl border border-border/60 bg-background p-5">
          <h2 className="flex items-center gap-2 text-base font-semibold tracking-tight">
            <Megaphone className="h-4 w-4 text-primary" /> {editingId ? "Ubah pengumuman" : "Pengumuman baru"}
          </h2>
          <div className="space-y-2">
            <Label htmlFor="title">Judul</Label>
            <Input id="title" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Misal: Jadwal ujian tengah semester" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="body">Isi</Label>
            <Textarea id="body" rows={5} value={body} onChange={(e) => setBody(e.target.value)} placeholder="Tulis detail pengumuman..." />
          </div>
          <div className="space-y-2">
            <Label>Tingkat</Label>
            <Select value={level} onValueChange={setLevel}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="info">Informasi</SelectItem>
                <SelectItem value="success">Kabar baik</SelectItem>
                <SelectItem value="warning">Penting</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <Button type="submit" className="w-full" disabled={busy || !title.trim()}>
            {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Plus className="mr-2 h-4 w-4" />}
            {saving ? "Memproses..." : editingId ? "Simpan perubahan" : "Terbitkan"}
          </Button>
          {editingId && (
            <Button type="button" variant="outline" className="w-full" onClick={resetForm}>
              <X className="mr-2 h-4 w-4" /> Batal ubah
            </Button>
          )}
        </form>

        <div className="space-y-3">
          {loading ? (
            <div className="flex h-40 items-center justify-center">
              <Loader2 className="h-6 w-6 animate-spin text-primary" />
            </div>
          ) : items.length === 0 ? (
            <p className="text-sm text-muted-foreground">Belum ada pengumuman.</p>
          ) : (
            items.map((a) => (
              <article key={a.id} className="rounded-2xl border border-border/60 bg-background p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="font-medium">{a.title}</h3>
                      <Badge variant={a.level === "warning" ? "destructive" : a.level === "success" ? "default" : "secondary"}>
                        {a.level}
                      </Badge>
                    </div>
                    <p className="mt-1 text-sm text-muted-foreground">{a.body}</p>
                    <p className="mt-2 text-xs text-muted-foreground">{formatDate(a.createdAt)}</p>
                  </div>
                  <div className="flex shrink-0 items-center gap-1">
                    <Button size="icon" variant="ghost" onClick={() => startEdit(a)} aria-label="Ubah pengumuman" disabled={busy}>
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={() => remove(a.id)}
                      aria-label="Hapus pengumuman"
                      disabled={busy}
                    >
                      {isPending(`delete-${a.id}`) ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Trash2 className="h-4 w-4 text-destructive" />
                      )}
                    </Button>
                  </div>
                </div>
              </article>
            ))
          )}
        </div>
      </div>
    </DashboardShell>
  );
}
