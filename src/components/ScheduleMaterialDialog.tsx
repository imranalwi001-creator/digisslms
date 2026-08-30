import { useEffect, useRef, useState } from "react";
import { Eye, FileUp, History, Loader2, RotateCcw, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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
  activateMaterialVersion,
  addMaterialVersion,
  deleteMaterialVersion,
  fetchScheduleMaterials,
  kindLabel,
  previewType,
  toEmbedUrl,
  type ScheduleMaterial,
} from "@/lib/schedule-materials";
import type { Schedule } from "@/lib/teaching";

/** Inline preview for the active material version. */
function MaterialPreview({ item }: { item: ScheduleMaterial }) {
  const [src, setSrc] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    setLoading(true);
    (async () => {
      const url = item.kind === "file" ? await resolveSiteAsset(item.value) : item.value;
      if (active) {
        setSrc(url);
        setLoading(false);
      }
    })();
    return () => {
      active = false;
    };
  }, [item.id, item.kind, item.value]);

  if (item.kind === "catalog") {
    return (
      <p className="text-sm text-muted-foreground">
        Materi katalog: <span className="font-medium text-foreground">{item.title || item.value}</span>
      </p>
    );
  }
  if (loading) {
    return (
      <div className="flex h-40 items-center justify-center rounded-xl border border-border/50">
        <Loader2 className="h-5 w-5 animate-spin text-primary" />
      </div>
    );
  }
  if (!src) return <p className="text-sm text-muted-foreground">Pratinjau tidak tersedia.</p>;

  const type = previewType(item.value);
  if (type === "image") {
    return <img src={src} alt={item.title || "Pratinjau materi"} className="max-h-72 w-full rounded-xl object-contain" />;
  }
  if (type === "video") {
    return <video src={src} controls className="max-h-72 w-full rounded-xl" />;
  }
  if (type === "pdf" || type === "embed") {
    return (
      <iframe
        src={type === "embed" ? toEmbedUrl(src) : src}
        title={item.title || "Pratinjau materi"}
        className="h-72 w-full rounded-xl border border-border/50"
      />
    );
  }
  return (
    <a href={src} target="_blank" rel="noreferrer" className="text-sm font-medium text-primary hover:underline">
      Buka materi di tab baru
    </a>
  );
}

/** Version history manager for the material attached to one schedule slot. */
export function ScheduleMaterialDialog({
  schedule,
  userId,
  open,
  onOpenChange,
  onChanged,
}: {
  schedule: Schedule | null;
  userId: string;
  open: boolean;
  onOpenChange: (v: boolean) => void;
  onChanged?: () => void;
}) {
  const [items, setItems] = useState<ScheduleMaterial[]>([]);
  const [loading, setLoading] = useState(true);
  const [value, setValue] = useState("");
  const [title, setTitle] = useState("");
  const [note, setNote] = useState("");
  const [previewId, setPreviewId] = useState<string | null>(null);
  const { run, isPending, busy } = useAdminAction();
  const { list: catalog } = useCatalog(true);
  const fileRef = useRef<HTMLInputElement>(null);

  const load = async (id: string) => {
    setLoading(true);
    try {
      const list = await fetchScheduleMaterials([id]);
      setItems(list);
      setPreviewId(list.find((m) => m.isActive)?.id ?? list[0]?.id ?? null);
    } catch (err: any) {
      toast.error(err.message || "Gagal memuat versi materi");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (open && schedule) {
      setValue("");
      setTitle("");
      setNote("");
      void load(schedule.id);
    }
  }, [open, schedule?.id]);

  if (!schedule) return null;

  const upload = async (file: File) => {
    const path = await run(
      "upload",
      { loading: "Mengunggah berkas...", success: "Berkas terunggah", error: "Gagal mengunggah berkas" },
      () => uploadSiteAsset(file, "materi-jadwal"),
    );
    if (path) {
      setValue(path);
      if (!title.trim()) setTitle(file.name);
    }
  };

  const addVersion = async () => {
    if (!value.trim()) return;
    const created = await run(
      "add",
      { loading: "Menyimpan versi baru...", success: "Versi materi tersimpan", error: "Gagal menyimpan versi" },
      () =>
        addMaterialVersion({
          scheduleId: schedule.id,
          title: title.trim() || catalog.find((m) => m.slug === value)?.title || value,
          value: value.trim(),
          note: note.trim(),
          userId,
          existing: items,
        }),
    );
    if (!created) return;
    setValue("");
    setTitle("");
    setNote("");
    await load(schedule.id);
    onChanged?.();
  };

  const restore = async (id: string) => {
    const ok = await run(
      `restore-${id}`,
      { loading: "Mengaktifkan versi...", success: "Versi diaktifkan", error: "Gagal mengaktifkan versi" },
      async () => {
        await activateMaterialVersion(schedule.id, id);
        return true;
      },
    );
    if (ok) {
      await load(schedule.id);
      onChanged?.();
    }
  };

  const remove = async (id: string) => {
    const ok = await run(
      `del-${id}`,
      { loading: "Menghapus versi...", success: "Versi dihapus", error: "Gagal menghapus versi" },
      async () => {
        await deleteMaterialVersion(id);
        return true;
      },
    );
    if (ok) {
      await load(schedule.id);
      onChanged?.();
    }
  };

  const preview = items.find((m) => m.id === previewId) ?? null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[88vh] max-w-2xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <History className="h-4 w-4 text-primary" /> Materi pertemuan
          </DialogTitle>
          <DialogDescription>
            {schedule.title} · Kelas {schedule.grade} · {schedule.startTime}–{schedule.endTime}. Setiap pembaruan
            disimpan sebagai versi baru tanpa menghapus riwayat.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3 rounded-xl border border-border/50 bg-muted/20 p-3">
          <Label className="text-xs uppercase tracking-wider text-muted-foreground">Versi baru</Label>
          <Select
            value={catalog.some((m) => m.slug === value) ? value : "none"}
            onValueChange={(v) => setValue(v === "none" ? "" : v)}
          >
            <SelectTrigger><SelectValue placeholder="Pilih dari katalog" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="none">Tanpa materi katalog</SelectItem>
              {catalog
                .filter((m) => m.grade === schedule.grade)
                .map((m) => (
                  <SelectItem key={m.slug} value={m.slug}>{m.title}</SelectItem>
                ))}
            </SelectContent>
          </Select>
          <Input value={value} onChange={(e) => setValue(e.target.value)} placeholder="atau tempel tautan materi" />
          <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Judul materi (opsional)" />
          <Input value={note} onChange={(e) => setNote(e.target.value)} placeholder="Catatan perubahan (opsional)" />
          <input
            ref={fileRef}
            type="file"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) void upload(file);
              e.target.value = "";
            }}
          />
          <div className="flex flex-wrap gap-2">
            <Button type="button" size="sm" variant="outline" disabled={busy} onClick={() => fileRef.current?.click()}>
              {isPending("upload") ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <FileUp className="mr-2 h-4 w-4" />}
              Unggah berkas
            </Button>
            <Button type="button" size="sm" disabled={busy || !value.trim()} onClick={addVersion}>
              {isPending("add") ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              Simpan sebagai versi {Math.max(0, ...items.map((m) => m.version)) + 1}
            </Button>
          </div>
        </div>

        {loading ? (
          <div className="flex h-24 items-center justify-center">
            <Loader2 className="h-5 w-5 animate-spin text-primary" />
          </div>
        ) : items.length === 0 ? (
          <p className="text-sm text-muted-foreground">Belum ada versi materi untuk pertemuan ini.</p>
        ) : (
          <>
            <ul className="space-y-2">
              {items.map((m) => (
                <li key={m.id} className="rounded-xl border border-border/50 p-3">
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="truncate text-sm font-medium">{m.title || m.value}</p>
                        <Badge variant={m.isActive ? "default" : "secondary"}>v{m.version}</Badge>
                        <Badge variant="outline">{kindLabel[m.kind]}</Badge>
                        {m.isActive && <span className="text-[11px] text-primary">aktif</span>}
                      </div>
                      <p className="mt-1 truncate text-xs text-muted-foreground">{m.value}</p>
                      {m.note && <p className="mt-1 text-xs text-muted-foreground">Catatan: {m.note}</p>}
                    </div>
                    <div className="flex shrink-0 items-center gap-1">
                      <Button size="icon" variant="ghost" aria-label="Pratinjau" onClick={() => setPreviewId(m.id)}>
                        <Eye className="h-4 w-4" />
                      </Button>
                      {!m.isActive && (
                        <Button size="icon" variant="ghost" aria-label="Aktifkan versi" disabled={busy} onClick={() => restore(m.id)}>
                          {isPending(`restore-${m.id}`) ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <RotateCcw className="h-4 w-4" />
                          )}
                        </Button>
                      )}
                      <Button size="icon" variant="ghost" aria-label="Hapus versi" disabled={busy} onClick={() => remove(m.id)}>
                        {isPending(`del-${m.id}`) ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <Trash2 className="h-4 w-4 text-destructive" />
                        )}
                      </Button>
                    </div>
                  </div>
                </li>
              ))}
            </ul>

            {preview && (
              <div className="rounded-xl border border-border/50 p-3">
                <p className="mb-2 text-xs uppercase tracking-wider text-muted-foreground">
                  Pratinjau v{preview.version}
                </p>
                <MaterialPreview item={preview} />
              </div>
            )}
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
