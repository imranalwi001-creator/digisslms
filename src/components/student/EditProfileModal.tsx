import React, { useState, useEffect, useRef } from "react";
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
import { Badge } from "@/components/ui/badge";
import {
  Camera,
  ImageIcon,
  Trash2,
  Sparkles,
  CheckCircle2,
  User,
  Link2,
  Globe,
  Loader2,
  X,
  Plus,
  ShieldCheck,
  Upload,
  ExternalLink,
  Code,
  FolderGit2,
  Layers,
  Laptop,
  PlaySquare,
  Instagram,
  Youtube,
  Linkedin,
  Share2,
} from "lucide-react";
import { toast } from "sonner";
import {
  fetchMyProfile,
  updateMyProfile,
  uploadProfileMedia,
  parseProfileLinks,
  serializeProfileLinks,
  type StudentProfile,
  type ProfileLink,
  type ProfileLinkCategory,
} from "@/lib/profile";
import { useProfileMedia } from "@/components/ProfileMedia";

interface EditProfileModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  userId: string;
  onSuccess?: () => void;
}

const AVATAR_PRESETS = [
  "https://api.dicebear.com/7.x/avataaars/svg?seed=Ahmad",
  "https://api.dicebear.com/7.x/avataaars/svg?seed=Fatima",
  "https://api.dicebear.com/7.x/avataaars/svg?seed=Zaid",
  "https://api.dicebear.com/7.x/avataaars/svg?seed=Aisyah",
  "https://api.dicebear.com/7.x/bottts/svg?seed=CyberSantri",
  "https://api.dicebear.com/7.x/identicon/svg?seed=DigisScholar",
];

const BANNER_PRESETS = [
  "https://images.unsplash.com/photo-1517694712202-14dd9538aa97?w=1200&q=80",
  "https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?w=1200&q=80",
  "https://images.unsplash.com/photo-1509062522246-3755977927d7?w=1200&q=80",
  "https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=1200&q=80",
];

const SUGGESTED_SKILLS = [
  "Algoritma",
  "Web Development",
  "Python",
  "HTML & CSS",
  "UI/UX Design",
  "Kecerdasan Buatan",
  "Basis Data",
  "Robotika",
  "Jaringan Komputer",
];

export function getCategoryIcon(category: ProfileLinkCategory, className = "w-4 h-4") {
  switch (category) {
    case "github":
      return <FolderGit2 className={className} />;
    case "project":
      return <Layers className={className} />;
    case "portfolio":
      return <Laptop className={className} />;
    case "instagram":
      return <Instagram className={className} />;
    case "youtube":
      return <Youtube className={className} />;
    case "linkedin":
      return <Linkedin className={className} />;
    default:
      return <Globe className={className} />;
  }
}

function SafeAvatarDisplay({
  value,
  name,
  className = "w-full h-full object-cover",
}: {
  value: string | null;
  name: string;
  className?: string;
}) {
  const src = useProfileMedia(value);
  const [hasError, setHasError] = useState(false);

  useEffect(() => {
    setHasError(false);
  }, [src]);

  if (src && !hasError) {
    return (
      <img
        src={src}
        alt="Avatar"
        className={className}
        onError={() => setHasError(true)}
      />
    );
  }

  return (
    <div className="w-full h-full flex items-center justify-center bg-primary/15 text-primary font-extrabold text-2xl">
      {name.charAt(0).toUpperCase() || "S"}
    </div>
  );
}

function SafeBannerDisplay({
  value,
  className = "w-full h-full object-cover",
}: {
  value: string | null;
  className?: string;
}) {
  const src = useProfileMedia(value);
  const [hasError, setHasError] = useState(false);

  useEffect(() => {
    setHasError(false);
  }, [src]);

  if (src && !hasError) {
    return (
      <img
        src={src}
        alt="Banner Cover"
        className={className}
        onError={() => setHasError(true)}
      />
    );
  }

  return (
    <div className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-r from-primary/20 via-primary/10 to-secondary/30 text-muted-foreground text-xs">
      <ImageIcon className="w-8 h-8 mb-1 opacity-50 text-primary" />
      <span className="font-mono text-[11px]">Sampul Bawaan Digisschool</span>
    </div>
  );
}

export function EditProfileModal({
  open,
  onOpenChange,
  userId,
  onSuccess,
}: EditProfileModalProps) {
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState<"avatar" | "banner" | null>(null);

  const [displayName, setDisplayName] = useState("");
  const [headline, setHeadline] = useState("");
  const [bio, setBio] = useState("");
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [bannerUrl, setBannerUrl] = useState<string | null>(null);
  const [skills, setSkills] = useState<string[]>(["Informatika", "Algoritma"]);
  const [newSkill, setNewSkill] = useState("");

  // Multiple links manager
  const [links, setLinks] = useState<ProfileLink[]>([]);
  const [newLinkTitle, setNewLinkTitle] = useState("");
  const [newLinkUrl, setNewLinkUrl] = useState("");
  const [newLinkCategory, setNewLinkCategory] = useState<ProfileLinkCategory>("project");

  const avatarInputRef = useRef<HTMLInputElement>(null);
  const bannerInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!open || !userId) return;
    setLoading(true);
    fetchMyProfile(userId)
      .then((p) => {
        if (p) {
          setDisplayName(p.displayName || "");
          setHeadline(p.headline || "");
          setBio(p.bio || "");
          setAvatarUrl(p.avatarUrl);
          setBannerUrl(p.bannerUrl);
          const parsed = parseProfileLinks(p.socialLink);
          setLinks(parsed);
        }
      })
      .catch((err) => console.warn("Failed to load profile for edit modal:", err))
      .finally(() => setLoading(false));
  }, [open, userId]);

  const handleFileUpload = async (kind: "avatar" | "banner", file?: File | null) => {
    if (!file) return;
    setUploading(kind);
    const toastId = toast.loading(
      kind === "avatar" ? "Mengompresi & mengunggah avatar..." : "Mengompresi & mengunggah banner..."
    );
    try {
      const resultUrl = await uploadProfileMedia(userId, kind, file);
      if (kind === "avatar") {
        setAvatarUrl(resultUrl);
        toast.success("Foto avatar berhasil dimuat & siap disimpan!", { id: toastId });
      } else {
        setBannerUrl(resultUrl);
        toast.success("Banner cover berhasil dimuat & siap disimpan!", { id: toastId });
      }
    } catch (err: any) {
      toast.error(err.message || "Gagal mengunggah berkas", { id: toastId });
    } finally {
      setUploading(null);
      if (avatarInputRef.current) avatarInputRef.current.value = "";
      if (bannerInputRef.current) bannerInputRef.current.value = "";
    }
  };

  const handleAddSkill = () => {
    const trimmed = newSkill.trim().replace(/^#/, "");
    if (!trimmed) return;
    if (skills.includes(trimmed)) {
      toast.info("Tag keahlian sudah ada");
      return;
    }
    if (skills.length >= 8) {
      toast.warning("Maksimal 8 tag keahlian");
      return;
    }
    setSkills([...skills, trimmed]);
    setNewSkill("");
  };

  const handleRemoveSkill = (skillToRemove: string) => {
    setSkills(skills.filter((s) => s !== skillToRemove));
  };

  // Add Link Handler
  const handleAddLink = () => {
    const url = newLinkUrl.trim();
    if (!url) {
      toast.warning("URL tautan tidak boleh kosong");
      return;
    }
    if (!/^https?:\/\/.+/i.test(url)) {
      toast.warning("Tautan harus diawali dengan http:// atau https://");
      return;
    }
    const title = newLinkTitle.trim() || getDefaultTitleForCategory(newLinkCategory);

    const newEntry: ProfileLink = {
      id: `link-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      title,
      url,
      category: newLinkCategory,
    };

    setLinks([...links, newEntry]);
    setNewLinkTitle("");
    setNewLinkUrl("");
    toast.success(`Tautan "${title}" berhasil ditambahkan ke daftar!`);
  };

  const handleRemoveLink = (linkId: string) => {
    setLinks(links.filter((l) => l.id !== linkId));
  };

  const addPresetLink = (category: ProfileLinkCategory, title: string) => {
    setNewLinkCategory(category);
    setNewLinkTitle(title);
  };

  const getDefaultTitleForCategory = (cat: ProfileLinkCategory) => {
    switch (cat) {
      case "project":
        return "Proyek Demo Aplikasi";
      case "github":
        return "GitHub Repository";
      case "portfolio":
        return "Portofolio Website";
      case "instagram":
        return "Instagram";
      case "youtube":
        return "YouTube Channel";
      case "linkedin":
        return "LinkedIn";
      default:
        return "Tautan Web";
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!displayName.trim()) {
      toast.warning("Nama tampilan tidak boleh kosong");
      return;
    }
    if (bio.length > 280) {
      toast.warning("Bio maksimal 280 karakter");
      return;
    }

    setSaving(true);
    const toastId = toast.loading("Menyimpan profil & tautan portofolio ke database...");
    try {
      const serializedLinks = serializeProfileLinks(links);

      await updateMyProfile(userId, {
        displayName: displayName.trim().slice(0, 80),
        headline: headline.trim().slice(0, 120) || null,
        bio: bio.trim(),
        socialLink: serializedLinks,
        avatarUrl,
        bannerUrl,
      });

      // Dispatch global refresh event across all UI components
      if (typeof window !== "undefined") {
        window.dispatchEvent(new CustomEvent("digisschool:profile_updated"));
      }

      toast.success("Profil & tautan proyek berhasil disimpan ke database!", { id: toastId });
      onOpenChange(false);
      onSuccess?.();
    } catch (err: any) {
      toast.error(err.message || "Gagal memperbarui profil", { id: toastId });
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xl sm:max-w-2xl max-h-[90vh] overflow-y-auto rounded-3xl p-6 border-border/80 bg-card shadow-2xl">
        <DialogHeader className="space-y-1 text-left border-b border-border/60 pb-3">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary border border-primary/20 text-xs font-mono font-bold w-fit">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Edit Profil & Portofolio Santri</span>
          </div>
          <DialogTitle className="text-xl sm:text-2xl font-bold text-foreground">
            Pengaturan & Personalisasi Profil
          </DialogTitle>
          <DialogDescription className="text-xs text-muted-foreground">
            Kelola foto avatar, banner cover, moto belajar, tautan proyek aplikasi, dan sosial media Anda di Digisschool.
          </DialogDescription>
        </DialogHeader>

        {loading ? (
          <div className="flex h-64 items-center justify-center">
            <Loader2 className="h-7 w-7 animate-spin text-primary" />
          </div>
        ) : (
          <form onSubmit={handleSave} className="space-y-6 pt-2">
            {/* Banner Cover Manager */}
            <div className="space-y-2">
              <Label className="text-xs font-bold text-foreground uppercase tracking-wider font-mono flex items-center justify-between">
                <span>1. Banner Sampul Profil (Cover CRUD)</span>
                {uploading === "banner" && (
                  <span className="text-primary text-[11px] flex items-center gap-1 font-normal">
                    <Loader2 className="w-3 h-3 animate-spin" /> Memproses gambar...
                  </span>
                )}
              </Label>
              <div className="relative h-32 sm:h-40 rounded-2xl overflow-hidden border border-border/80 bg-muted/30 group">
                <SafeBannerDisplay value={bannerUrl} />

                {/* Banner Actions Overlay */}
                <div className="absolute inset-0 bg-black/45 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2 p-3">
                  <Button
                    type="button"
                    size="sm"
                    variant="secondary"
                    className="text-xs font-bold gap-1.5 rounded-xl shadow-md cursor-pointer"
                    disabled={uploading !== null}
                    onClick={() => bannerInputRef.current?.click()}
                  >
                    <Camera className="w-3.5 h-3.5" />
                    Unggah Gambar
                  </Button>
                  {bannerUrl && (
                    <Button
                      type="button"
                      size="sm"
                      variant="destructive"
                      className="text-xs font-bold gap-1.5 rounded-xl shadow-md cursor-pointer"
                      onClick={() => setBannerUrl(null)}
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      Hapus
                    </Button>
                  )}
                </div>

                <input
                  ref={bannerInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => handleFileUpload("banner", e.target.files?.[0])}
                />
              </div>

              {/* Banner Presets */}
              <div className="flex items-center gap-2 pt-1 overflow-x-auto no-scrollbar">
                <span className="text-[11px] font-mono text-muted-foreground shrink-0">Preset:</span>
                {BANNER_PRESETS.map((preset, i) => (
                  <button
                    type="button"
                    key={i}
                    onClick={() => setBannerUrl(preset)}
                    className="h-7 w-14 rounded-lg overflow-hidden border border-border/60 shrink-0 hover:scale-105 transition-transform cursor-pointer"
                  >
                    <img src={preset} alt={`Preset ${i + 1}`} className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            </div>

            {/* Avatar Manager */}
            <div className="space-y-2">
              <Label className="text-xs font-bold text-foreground uppercase tracking-wider font-mono flex items-center justify-between">
                <span>2. Foto Avatar Profil (Avatar CRUD)</span>
                {uploading === "avatar" && (
                  <span className="text-primary text-[11px] flex items-center gap-1 font-normal">
                    <Loader2 className="w-3 h-3 animate-spin" /> Memproses avatar...
                  </span>
                )}
              </Label>
              <div className="flex flex-col sm:flex-row items-center gap-4 p-4 rounded-2xl border border-border/80 bg-background/80">
                <div className="relative w-20 h-20 rounded-2xl overflow-hidden border-2 border-primary/40 bg-muted/40 shrink-0 group">
                  <SafeAvatarDisplay value={avatarUrl} name={displayName} />

                  <button
                    type="button"
                    onClick={() => avatarInputRef.current?.click()}
                    aria-label="Ganti Avatar"
                    className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white cursor-pointer"
                  >
                    <Camera className="w-5 h-5" />
                  </button>
                </div>

                <div className="space-y-2 flex-1 w-full text-center sm:text-left">
                  <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      className="rounded-xl text-xs font-bold gap-1.5 cursor-pointer hover:bg-primary/10 hover:text-primary"
                      disabled={uploading !== null}
                      onClick={() => avatarInputRef.current?.click()}
                    >
                      <Upload className="w-3.5 h-3.5" />
                      Unggah Foto Avatar
                    </Button>
                    {avatarUrl && (
                      <Button
                        type="button"
                        size="sm"
                        variant="ghost"
                        className="rounded-xl text-xs text-destructive hover:bg-destructive/10 cursor-pointer"
                        onClick={() => setAvatarUrl(null)}
                      >
                        <Trash2 className="w-3.5 h-3.5 mr-1" />
                        Reset Default
                      </Button>
                    )}
                  </div>

                  {/* Avatar Presets */}
                  <div className="flex items-center justify-center sm:justify-start gap-1.5 pt-1 overflow-x-auto no-scrollbar">
                    <span className="text-[11px] font-mono text-muted-foreground shrink-0 mr-1">Preset:</span>
                    {AVATAR_PRESETS.map((preset, i) => (
                      <button
                        type="button"
                        key={i}
                        onClick={() => setAvatarUrl(preset)}
                        className={`w-7 h-7 rounded-full overflow-hidden border transition-all cursor-pointer ${
                          avatarUrl === preset ? "border-primary ring-2 ring-primary/40" : "border-border/60 hover:scale-110"
                        }`}
                      >
                        <img src={preset} alt={`Avatar ${i + 1}`} className="w-full h-full object-cover" />
                      </button>
                    ))}
                  </div>
                </div>

                <input
                  ref={avatarInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => handleFileUpload("avatar", e.target.files?.[0])}
                />
              </div>
            </div>

            {/* General Form Fields */}
            <div className="grid sm:grid-cols-2 gap-4">
              {/* Display Name */}
              <div className="space-y-1.5">
                <Label className="text-xs font-bold text-foreground">Nama Lengkap / Tampilan</Label>
                <Input
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  placeholder="Nama Lengkap Siswa"
                  className="rounded-xl text-xs"
                  required
                />
              </div>

              {/* Headline */}
              <div className="space-y-1.5">
                <Label className="text-xs font-bold text-foreground">Moto Belajar / Headline</Label>
                <Input
                  value={headline}
                  onChange={(e) => setHeadline(e.target.value)}
                  placeholder="Contoh: Santri Penggemar Coding & Algoritma"
                  className="rounded-xl text-xs"
                />
              </div>
            </div>

            {/* Bio */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <Label className="text-xs font-bold text-foreground">Bio & Tentang Saya</Label>
                <span className="text-[11px] font-mono text-muted-foreground">
                  {bio.length}/280 karakter
                </span>
              </div>
              <Textarea
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                placeholder="Ceritakan tentang minat belajar, cita-cita, dan mata pelajaran favoritmu..."
                rows={3}
                className="rounded-xl text-xs resize-none"
              />
            </div>

            {/* MULTI-LINK & PROJECT MANAGER (CRUD) */}
            <div className="space-y-3 p-4 rounded-2xl border border-border/80 bg-secondary/20">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
                    <Share2 className="w-4 h-4" />
                  </div>
                  <div>
                    <Label className="text-xs font-bold text-foreground uppercase tracking-wider font-mono">
                      3. Tautan Proyek Aplikasi & Media Sosial (Multi-Link)
                    </Label>
                    <p className="text-[11px] text-muted-foreground">
                      Tambahkan portofolio aplikasi, repository GitHub, atau akun media sosial Anda.
                    </p>
                  </div>
                </div>
                <Badge variant="outline" className="font-mono text-xs">
                  {links.length} Tautan
                </Badge>
              </div>

              {/* List of Existing Links */}
              {links.length > 0 && (
                <div className="space-y-2 pt-1">
                  {links.map((link) => (
                    <div
                      key={link.id}
                      className="flex items-center justify-between gap-3 p-3 rounded-xl border border-border bg-card shadow-xs group hover:border-primary/40 transition-colors"
                    >
                      <div className="flex items-center gap-2.5 min-w-0 flex-1">
                        <div className="w-8 h-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center shrink-0">
                          {getCategoryIcon(link.category)}
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="text-xs font-bold text-foreground truncate">{link.title}</p>
                          <p className="text-[11px] font-mono text-muted-foreground truncate">{link.url}</p>
                        </div>
                      </div>

                      <div className="flex items-center gap-1.5 shrink-0">
                        <a
                          href={link.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="p-1.5 rounded-lg text-muted-foreground hover:text-primary hover:bg-secondary transition-colors"
                          title="Buka Tautan"
                        >
                          <ExternalLink className="w-3.5 h-3.5" />
                        </a>
                        <button
                          type="button"
                          onClick={() => handleRemoveLink(link.id)}
                          className="p-1.5 rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors cursor-pointer"
                          title="Hapus Tautan"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Add New Link Inputs */}
              <div className="pt-2 border-t border-border/50 space-y-2.5">
                <div className="grid grid-cols-1 sm:grid-cols-[140px_1fr] gap-2">
                  <select
                    value={newLinkCategory}
                    onChange={(e) => {
                      const cat = e.target.value as ProfileLinkCategory;
                      setNewLinkCategory(cat);
                      if (!newLinkTitle || newLinkTitle === getDefaultTitleForCategory(newLinkCategory)) {
                        setNewLinkTitle(getDefaultTitleForCategory(cat));
                      }
                    }}
                    className="h-9 px-2.5 rounded-xl border border-input bg-background text-xs font-medium focus:outline-none focus:ring-1 focus:ring-primary cursor-pointer"
                  >
                    <option value="project">💻 Proyek Aplikasi</option>
                    <option value="github">🐙 GitHub Repo</option>
                    <option value="portfolio">🌐 Portofolio Web</option>
                    <option value="instagram">📸 Instagram</option>
                    <option value="youtube">📺 YouTube</option>
                    <option value="linkedin">💼 LinkedIn</option>
                    <option value="other">🔗 Tautan Lain</option>
                  </select>

                  <Input
                    value={newLinkTitle}
                    onChange={(e) => setNewLinkTitle(e.target.value)}
                    placeholder="Judul (Contoh: Demo Web Kasir / Portofolio)"
                    className="rounded-xl text-xs h-9"
                  />
                </div>

                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <Globe className="w-4 h-4 text-muted-foreground absolute left-3 top-2.5" />
                    <Input
                      value={newLinkUrl}
                      onChange={(e) => setNewLinkUrl(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          e.preventDefault();
                          handleAddLink();
                        }
                      }}
                      placeholder="https://proyek-saya.vercel.app atau https://github.com/..."
                      className="rounded-xl text-xs pl-9 font-mono h-9"
                    />
                  </div>
                  <Button
                    type="button"
                    size="sm"
                    onClick={handleAddLink}
                    className="rounded-xl text-xs font-bold gap-1 shrink-0 h-9 cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    Tambah Tautan
                  </Button>
                </div>

                {/* Quick Presets */}
                <div className="flex flex-wrap items-center gap-1.5 pt-1">
                  <span className="text-[10px] font-mono text-muted-foreground mr-1">Preset cepat:</span>
                  <button
                    type="button"
                    onClick={() => addPresetLink("project", "Live Demo Proyek")}
                    className="text-[10px] font-mono px-2 py-0.5 rounded-lg bg-background border border-border/80 hover:bg-secondary text-foreground transition-colors cursor-pointer"
                  >
                    + 💻 Proyek Aplikasi
                  </button>
                  <button
                    type="button"
                    onClick={() => addPresetLink("github", "GitHub Repository")}
                    className="text-[10px] font-mono px-2 py-0.5 rounded-lg bg-background border border-border/80 hover:bg-secondary text-foreground transition-colors cursor-pointer"
                  >
                    + 🐙 GitHub
                  </button>
                  <button
                    type="button"
                    onClick={() => addPresetLink("instagram", "Instagram")}
                    className="text-[10px] font-mono px-2 py-0.5 rounded-lg bg-background border border-border/80 hover:bg-secondary text-foreground transition-colors cursor-pointer"
                  >
                    + 📸 Instagram
                  </button>
                </div>
              </div>
            </div>

            {/* Skill Tags CRUD */}
            <div className="space-y-2">
              <Label className="text-xs font-bold text-foreground uppercase tracking-wider font-mono">
                4. Minat & Keahlian Santri (Tags)
              </Label>
              <div className="flex flex-wrap gap-2 mb-2">
                {skills.map((skill) => (
                  <Badge
                    key={skill}
                    variant="secondary"
                    className="gap-1 py-1 px-2.5 rounded-xl text-xs font-medium bg-secondary text-secondary-foreground border border-border"
                  >
                    <span>#{skill}</span>
                    <button
                      type="button"
                      onClick={() => handleRemoveSkill(skill)}
                      className="text-muted-foreground hover:text-destructive transition-colors ml-0.5 cursor-pointer"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </Badge>
                ))}
              </div>

              <div className="flex items-center gap-2">
                <Input
                  value={newSkill}
                  onChange={(e) => setNewSkill(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      handleAddSkill();
                    }
                  }}
                  placeholder="Ketik keahlian baru (misal: Python) lalu tekan Tambah"
                  className="rounded-xl text-xs"
                />
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={handleAddSkill}
                  className="rounded-xl text-xs font-bold gap-1 shrink-0 cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  Tambah
                </Button>
              </div>

              {/* Suggestions */}
              <div className="flex flex-wrap gap-1.5 pt-1">
                <span className="text-[10px] font-mono text-muted-foreground self-center mr-1">Rekomendasi:</span>
                {SUGGESTED_SKILLS.filter((s) => !skills.includes(s)).slice(0, 4).map((s) => (
                  <button
                    type="button"
                    key={s}
                    onClick={() => setSkills([...skills, s])}
                    className="text-[10px] font-mono px-2 py-0.5 rounded-lg bg-muted/60 text-muted-foreground hover:text-foreground hover:bg-muted transition-colors cursor-pointer"
                  >
                    + {s}
                  </button>
                ))}
              </div>
            </div>

            <DialogFooter className="pt-4 border-t border-border/60 gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => onOpenChange(false)}
                className="rounded-xl text-xs font-semibold cursor-pointer"
                disabled={saving}
              >
                Batal
              </Button>
              <Button
                type="submit"
                size="sm"
                disabled={saving}
                className="rounded-xl text-xs font-bold gap-1.5 shadow-md shadow-primary/20 cursor-pointer"
              >
                {saving ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    Menyimpan ke Database...
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    Simpan Profil & Tautan
                  </>
                )}
              </Button>
            </DialogFooter>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
