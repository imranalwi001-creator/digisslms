import React, { useState, useRef } from "react";
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
  Video,
  FileText,
  Headphones,
  Code2,
  Paperclip,
  Globe,
  Upload,
  CheckCircle2,
  HardDrive,
  Link as LinkIcon,
  X,
  File,
  Loader2,
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
  const [sourceMode, setSourceMode] = useState<"device" | "url">("device");
  const [contentType, setContentType] = useState<LMSContentType>("pdf");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [urlOrFile, setUrlOrFile] = useState("");
  const [fileSize, setFileSize] = useState("");
  const [duration, setDuration] = useState("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [filePreview, setFilePreview] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [loading, setLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const formatBytes = (bytes: number): string => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  const detectTypeFromExtension = (filename: string): LMSContentType => {
    const ext = filename.split(".").pop()?.toLowerCase() || "";
    if (["mp4", "webm", "mkv", "mov", "avi"].includes(ext)) return "video";
    if (["pdf", "ppt", "pptx", "doc", "docx"].includes(ext)) return "pdf";
    if (["mp3", "wav", "m4a", "aac", "ogg"].includes(ext)) return "audio";
    if (["py", "js", "ts", "html", "css", "json", "ipynb"].includes(ext)) return "code";
    return "file";
  };

  const handleFileSelection = (file: File) => {
    setSelectedFile(file);
    const sizeStr = formatBytes(file.size);
    setFileSize(sizeStr);

    // Auto set title if empty
    if (!title.trim()) {
      const cleanName = file.name.replace(/\.[^/.]+$/, "").replace(/[_-]/g, " ");
      setTitle(cleanName);
    }

    // Auto detect type
    const detected = detectTypeFromExtension(file.name);
    setContentType(detected);

    // Read as Data URL or Object URL for immediate playback & download
    const reader = new FileReader();
    reader.onload = (e) => {
      const result = e.target?.result as string;
      setFilePreview(result);
      setUrlOrFile(result);
    };
    reader.readAsDataURL(file);
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleFileSelection(e.target.files[0]);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileSelection(e.dataTransfer.files[0]);
    }
  };

  const handleRemoveFile = () => {
    setSelectedFile(null);
    setFilePreview(null);
    setUrlOrFile("");
    setFileSize("");
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const getAcceptTypes = (type: LMSContentType): string => {
    switch (type) {
      case "video":
        return "video/mp4,video/webm,video/ogg,video/quicktime,.mp4,.webm,.mkv,.mov";
      case "pdf":
        return ".pdf,.ppt,.pptx,.doc,.docx,application/pdf";
      case "audio":
        return "audio/mp3,audio/wav,audio/m4a,audio/aac,.mp3,.wav,.m4a";
      case "code":
        return ".zip,.py,.js,.ts,.html,.css,.json,.ipynb,.txt";
      default:
        return "*";
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      toast.warning("Judul konten wajib diisi");
      return;
    }

    if (sourceMode === "device" && !selectedFile && !urlOrFile) {
      toast.warning("Silakan pilih berkas dari perangkat Anda terlebih dahulu");
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
        url: urlOrFile.trim() || (selectedFile ? `local://${selectedFile.name}` : "https://example.com/asset"),
        fileSize: fileSize.trim() || undefined,
        duration: duration.trim() || undefined,
        isDownloadable: contentType === "file" || contentType === "pdf" || sourceMode === "device",
      });

      toast.success(
        sourceMode === "device"
          ? `Berkas "${selectedFile?.name || title}" berhasil diunggah dari perangkat!`
          : `Konten ${contentType.toUpperCase()} berhasil ditambahkan!`,
      );
      setTitle("");
      setDescription("");
      setUrlOrFile("");
      setFileSize("");
      setDuration("");
      setSelectedFile(null);
      setFilePreview(null);
      onOpenChange(false);
      onSuccess?.();
    } catch (err: any) {
      toast.error(err.message || "Gagal menambahkan konten");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg sm:max-w-xl rounded-2xl p-6 border-border/80 bg-card shadow-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader className="space-y-1.5 text-left">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary border border-primary/20 text-xs font-mono font-bold w-fit">
            <Upload className="w-3.5 h-3.5" />
            <span>Pengelola Konten Modul</span>
          </div>
          <DialogTitle className="text-xl font-bold text-foreground">
            Unggah Konten Pembelajaran
          </DialogTitle>
          <DialogDescription className="text-xs text-muted-foreground">
            {moduleName ? `Modul: ${moduleName} · ` : ""}Kelas {materialTitle}. Pilih unggah langsung dari memori perangkat (HP/Laptop) atau tautan URL.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 pt-2">
          {/* Source Mode Switcher */}
          <div className="space-y-1.5">
            <Label className="text-xs font-bold text-foreground">Sumber Berkas / Konten</Label>
            <div className="grid grid-cols-2 gap-2 rounded-xl border border-border/70 p-1 bg-surface-alt">
              <button
                type="button"
                onClick={() => setSourceMode("device")}
                className={`flex items-center justify-center gap-2 py-2 px-3 rounded-lg text-xs font-bold transition-all ${
                  sourceMode === "device"
                    ? "bg-background text-foreground shadow-xs border border-border/60"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                <HardDrive className="w-4 h-4 text-primary" />
                <span>Unggah dari Perangkat</span>
              </button>
              <button
                type="button"
                onClick={() => setSourceMode("url")}
                className={`flex items-center justify-center gap-2 py-2 px-3 rounded-lg text-xs font-bold transition-all ${
                  sourceMode === "url"
                    ? "bg-background text-foreground shadow-xs border border-border/60"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                <LinkIcon className="w-4 h-4 text-primary" />
                <span>Tautan URL / Cloud</span>
              </button>
            </div>
          </div>

          {/* Content Type Selector */}
          <div className="space-y-1.5">
            <Label className="text-xs font-bold text-foreground">Kategori Tipe Berkas</Label>
            <div className="grid grid-cols-3 gap-2">
              {[
                { id: "pdf", label: "Dokumen / PDF", icon: FileText },
                { id: "video", label: "Video MP4", icon: Video },
                { id: "audio", label: "Audio Podcast", icon: Headphones },
                { id: "code", label: "Lab Coding", icon: Code2 },
                { id: "file", label: "Lampiran / ZIP", icon: Paperclip },
                { id: "link", label: "Artikel Web", icon: Globe },
              ].map((t) => (
                <button
                  type="button"
                  key={t.id}
                  onClick={() => setContentType(t.id as LMSContentType)}
                  className={`p-2.5 rounded-xl border flex flex-col items-center justify-center gap-1.5 transition-all text-xs font-semibold ${
                    contentType === t.id
                      ? "bg-primary/10 border-primary/50 text-foreground ring-1 ring-primary/40 font-bold"
                      : "bg-background border-border/60 hover:bg-secondary/60 text-muted-foreground hover:text-foreground"
                  }`}
                >
                  <t.icon className="w-4 h-4 text-primary" />
                  <span className="text-[11px] truncate">{t.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Device Upload Area */}
          {sourceMode === "device" ? (
            <div className="space-y-2">
              <Label className="text-xs font-bold text-foreground">Pilih Berkas dari Komputer / HP</Label>
              <input
                ref={fileInputRef}
                type="file"
                accept={getAcceptTypes(contentType)}
                onChange={handleFileInputChange}
                className="hidden"
              />

              {!selectedFile ? (
                <div
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                  onClick={() => fileInputRef.current?.click()}
                  className={`border-2 border-dashed rounded-2xl p-6 flex flex-col items-center justify-center gap-2.5 text-center cursor-pointer transition-all ${
                    isDragging
                      ? "border-primary bg-primary/10 scale-[0.99]"
                      : "border-border/80 bg-surface-alt/50 hover:bg-surface-alt hover:border-primary/50"
                  }`}
                >
                  <div className="w-11 h-11 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary">
                    <Upload className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-foreground">
                      Klik untuk telusuri berkas atau seret ke sini
                    </p>
                    <p className="text-[11px] text-muted-foreground mt-0.5">
                      Mendukung PDF, Video MP4, Audio MP3, Dokumen DOCX/PPTX, file ZIP, dan Kode
                    </p>
                  </div>
                </div>
              ) : (
                <div className="flex items-center justify-between p-3.5 rounded-xl border border-primary/40 bg-primary/5">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-9 h-9 rounded-xl bg-primary/15 flex items-center justify-center text-primary shrink-0">
                      <File className="w-4 h-4" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs font-bold text-foreground truncate">{selectedFile.name}</p>
                      <p className="text-[11px] font-mono text-muted-foreground">
                        {fileSize} · {selectedFile.type || "Berkas lokal"}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5 shrink-0">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => fileInputRef.current?.click()}
                      className="text-xs h-7 px-2 rounded-lg"
                    >
                      Ganti
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={handleRemoveFile}
                      className="h-7 w-7 text-muted-foreground hover:text-destructive"
                      title="Hapus berkas"
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              )}
            </div>
          ) : (
            /* URL Input */
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
          )}

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
            <Label className="text-xs font-bold text-foreground">Deskripsi & Catatan Siswa (opsional)</Label>
            <Textarea
              placeholder="Berikan instruksi atau ringkasan penting untuk dipelajari siswa..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={2}
              className="text-xs rounded-xl resize-none"
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
              <Label className="text-xs font-bold text-foreground">Ukuran Berkas</Label>
              <Input
                placeholder="Contoh: 3.5 MB"
                value={fileSize}
                onChange={(e) => setFileSize(e.target.value)}
                className="text-xs rounded-xl font-mono"
              />
            </div>
          </div>

          <DialogFooter className="pt-2 gap-2">
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
              {loading ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <CheckCircle2 className="w-3.5 h-3.5" />
              )}
              {sourceMode === "device" ? "Simpan Berkas & Terbitkan" : "Simpan & Terbitkan Konten"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
