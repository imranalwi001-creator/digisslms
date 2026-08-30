import React, { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Video,
  FileText,
  Headphones,
  Code2,
  Paperclip,
  Globe,
  Upload,
  Sparkles,
  CheckCircle2,
} from "lucide-react";
import { addContentItem, type LMSContentType } from "@/lib/course-content";
import { toast } from "sonner";

interface MultiTypeContentUploaderProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  materialSlug: string;
  materialTitle: string;
  moduleIndex?: number;
  moduleName?: string;
  onSuccess?: () => void;
}

export function MultiTypeContentUploader({
  open,
  onOpenChange,
  materialSlug,
  materialTitle,
  moduleIndex = 0,
  moduleName,
  onSuccess,
}: MultiTypeContentUploaderProps) {
  const [contentType, setContentType] = useState<LMSContentType>("video");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [urlOrFile, setUrlOrFile] = useState("");
  const [fileSize, setFileSize] = useState("");
  const [duration, setDuration] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      toast.warning("Judul konten wajib diisi");
      return;
    }

    setLoading(true);
    try {
      addContentItem({
        materialSlug,
        moduleIndex,
        type: contentType,
        title: title.trim(),
        description: description.trim() || undefined,
        url: urlOrFile.trim() || "https://example.com/asset",
        fileSize: fileSize.trim() || undefined,
        duration: duration.trim() || undefined,
        isDownloadable: contentType === "file" || contentType === "pdf",
      });

      toast.success(`Konten ${contentType.toUpperCase()} berhasil ditambahkan ke modul!`);
      setTitle("");
      setDescription("");
      setUrlOrFile("");
      setFileSize("");
      setDuration("");
      onOpenChange(false);
      onSuccess?.();
    } catch (err: any) {
      toast.error(err.message || "Gagal menambahkan konten");
    } finally {
      setLoading(false);
    }
  };

  const getTypeIcon = (type: LMSContentType) => {
    switch (type) {
      case "video":
        return <Video className="w-4 h-4 text-rose-500" />;
      case "pdf":
        return <FileText className="w-4 h-4 text-red-500" />;
      case "audio":
        return <Headphones className="w-4 h-4 text-purple-500" />;
      case "code":
        return <Code2 className="w-4 h-4 text-emerald-500" />;
      case "file":
        return <Paperclip className="w-4 h-4 text-blue-500" />;
      case "link":
        return <Globe className="w-4 h-4 text-amber-500" />;
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md sm:max-w-lg rounded-3xl p-6 border-border/80 bg-card shadow-2xl">
        <DialogHeader className="space-y-1 text-left">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary border border-primary/20 text-xs font-mono font-bold w-fit mb-1">
            <Upload className="w-3.5 h-3.5" />
            <span>Multi-Type Content Manager</span>
          </div>
          <DialogTitle className="text-xl font-bold text-foreground">
            Unggah Konten Pembelajaran
          </DialogTitle>
          <DialogDescription className="text-xs text-muted-foreground">
            Lampirkan video, dokumen PDF/PPT, audio podcast, modul coding, atau berkas unduhan ke kelas {materialTitle}.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 pt-2">
          {/* Content Type Selector */}
          <div className="space-y-1.5">
            <Label className="text-xs font-bold text-foreground">Tipe Konten LMS</Label>
            <div className="grid grid-cols-3 gap-2">
              {[
                { id: "video", label: "Video", icon: Video },
                { id: "pdf", label: "Dokumen / PDF", icon: FileText },
                { id: "audio", label: "Audio Podcast", icon: Headphones },
                { id: "code", label: "Lab Coding", icon: Code2 },
                { id: "file", label: "Lampiran ZIP/File", icon: Paperclip },
                { id: "link", label: "Artikel Web", icon: Globe },
              ].map((t) => (
                <button
                  type="button"
                  key={t.id}
                  onClick={() => setContentType(t.id as LMSContentType)}
                  className={`p-2.5 rounded-2xl border flex flex-col items-center justify-center gap-1.5 transition-all text-xs font-semibold ${
                    contentType === t.id
                      ? "bg-primary/15 border-primary text-foreground shadow-xs ring-1 ring-primary/40 font-bold"
                      : "bg-background border-border/60 hover:bg-secondary/60 text-muted-foreground hover:text-foreground"
                  }`}
                >
                  <t.icon className="w-4 h-4" />
                  <span className="text-[11px] truncate">{t.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Title */}
          <div className="space-y-1.5">
            <Label className="text-xs font-bold text-foreground">Judul Konten / Modul</Label>
            <Input
              placeholder={
                contentType === "video"
                  ? "Contoh: Video Penjelasan Algoritma Pencarian"
                  : contentType === "pdf"
                  ? "Contoh: Modul_Handout_Kurikulum_Merdeka.pdf"
                  : "Contoh: Starter Code & Lembar Kerja"
              }
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="text-xs rounded-xl"
              required
            />
          </div>

          {/* Description */}
          <div className="space-y-1.5">
            <Label className="text-xs font-bold text-foreground">Deskripsi & Instruksi Siswa</Label>
            <Textarea
              placeholder="Berikan panduan atau poin penting yang harus diperhatikan siswa..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={2}
              className="text-xs rounded-xl resize-none"
            />
          </div>

          {/* URL or Storage Link */}
          <div className="space-y-1.5">
            <Label className="text-xs font-bold text-foreground">
              {contentType === "video"
                ? "URL Video (YouTube / Vimeo / MP4 Cloud)"
                : contentType === "link"
                ? "Tautan URL Website / Artikel"
                : "Tautan Berkas / Cloud File URL"}
            </Label>
            <Input
              placeholder="https://..."
              value={urlOrFile}
              onChange={(e) => setUrlOrFile(e.target.value)}
              className="text-xs font-mono rounded-xl"
            />
          </div>

          {/* Metadata Duration or File Size */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className="text-xs font-bold text-foreground">Estimasi Durasi (opsional)</Label>
              <Input
                placeholder="Contoh: 15:30 atau 20 Menit"
                value={duration}
                onChange={(e) => setDuration(e.target.value)}
                className="text-xs rounded-xl"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-bold text-foreground">Ukuran Berkas (opsional)</Label>
              <Input
                placeholder="Contoh: 3.5 MB"
                value={fileSize}
                onChange={(e) => setFileSize(e.target.value)}
                className="text-xs rounded-xl"
              />
            </div>
          </div>

          <DialogFooter className="pt-3 gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => onOpenChange(false)}
              className="rounded-xl text-xs"
            >
              Batal
            </Button>
            <Button
              type="submit"
              size="sm"
              disabled={loading}
              className="rounded-xl text-xs font-bold gap-1.5"
            >
              <CheckCircle2 className="w-3.5 h-3.5" />
              Simpan & Terbitkan Konten
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
