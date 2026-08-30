import { Link } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { Camera, CheckCircle2, Circle, ImageIcon, Loader2, Save, Sparkles, Link2, Trophy } from "lucide-react";
import { toast } from "sonner";
import { ProfileAvatar, ProfileBanner } from "@/components/ProfileMedia";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { fetchMyProfile, updateMyProfile, uploadProfileMedia, type StudentProfile } from "@/lib/profile";
import { EditProfileModal } from "@/components/student/EditProfileModal";

const MAX_BIO = 280;

function ProfileCompleteness({ items }: { items: { label: string; hint: string; done: boolean }[] }) {
  const done = items.filter((i) => i.done).length;
  const percent = Math.round((done / items.length) * 100);
  const allDone = done === items.length;

  return (
    <section className="rounded-2xl border border-border/60 bg-background p-5 sm:p-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <CheckCircle2 className={`h-4 w-4 ${allDone ? "text-primary" : "text-muted-foreground"}`} />
          <h2 className="text-base font-semibold tracking-tight">Kelengkapan profil</h2>
        </div>
        <span className="font-mono text-sm font-semibold tabular-nums text-primary">{percent}%</span>
      </div>

      <div className="mt-3 h-2 w-full overflow-hidden rounded-full bg-muted">
        <div className="h-full rounded-full bg-primary transition-all duration-700 ease-out" style={{ width: `${percent}%` }} />
      </div>

      <p className="mt-3 text-sm text-muted-foreground">
        {allDone
          ? "Mantap! Profil publikmu sudah lengkap dan siap dilihat teman sekelas."
          : `Tinggal ${items.length - done} langkah lagi agar profil publikmu tampil maksimal.`}
      </p>

      <ul className="mt-4 grid gap-2 sm:grid-cols-2">
        {items.map((item) => (
          <li
            key={item.label}
            className={`flex items-start gap-2.5 rounded-xl border p-3 text-sm transition-colors ${
              item.done ? "border-primary/30 bg-primary/5" : "border-border/60 bg-muted/30"
            }`}
          >
            {item.done ? (
              <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
            ) : (
              <Circle className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
            )}
            <div className="min-w-0">
              <p className={`font-medium ${item.done ? "text-foreground" : "text-foreground/80"}`}>{item.label}</p>
              {!item.done && <p className="text-xs text-muted-foreground">{item.hint}</p>}
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}

/** Editor profil siswa — tampil sebagai tab di dashboard siswa. */
export function ProfilePanel({ userId }: { userId: string }) {
  const [profile, setProfile] = useState<StudentProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState<"avatar" | "banner" | null>(null);
  const [displayName, setDisplayName] = useState("");
  const [headline, setHeadline] = useState("");
  const [bio, setBio] = useState("");
  const [socialLink, setSocialLink] = useState("");
  const [avatarValue, setAvatarValue] = useState<string | null>(null);
  const [bannerValue, setBannerValue] = useState<string | null>(null);
  const avatarRef = useRef<HTMLInputElement>(null);
  const bannerRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    let active = true;
    fetchMyProfile(userId)
      .then((p) => {
        if (!active || !p) return;
        setProfile(p);
        setDisplayName(p.displayName ?? "");
        setHeadline(p.headline ?? "");
        setBio(p.bio ?? "");
        setSocialLink(p.socialLink ?? "");
        setAvatarValue(p.avatarUrl);
        setBannerValue(p.bannerUrl);
      })
      .catch((e: any) => console.warn("Gagal memuat profil:", e))
      .finally(() => active && setLoading(false));
    return () => {
      active = false;
    };
  }, [userId]);

  const handleUpload = async (kind: "avatar" | "banner", file?: File | null) => {
    if (!file) return;
    setUploading(kind);
    const toastId = toast.loading(kind === "avatar" ? "Mengunggah foto profil..." : "Mengunggah banner...");
    try {
      const path = await uploadProfileMedia(userId, kind, file);
      await updateMyProfile(userId, kind === "avatar" ? { avatarUrl: path } : { bannerUrl: path });
      if (kind === "avatar") setAvatarValue(path);
      else setBannerValue(path);
      toast.success(kind === "avatar" ? "Foto profil diperbarui" : "Banner diperbarui", { id: toastId });
    } catch (e: any) {
      toast.error(e.message || "Gagal mengunggah gambar", { id: toastId });
    } finally {
      setUploading(null);
      if (avatarRef.current) avatarRef.current.value = "";
      if (bannerRef.current) bannerRef.current.value = "";
    }
  };

  const handleSave = async () => {
    if (!displayName.trim()) {
      toast.error("Nama tampilan tidak boleh kosong");
      return;
    }
    if (bio.length > MAX_BIO) {
      toast.error(`Bio maksimal ${MAX_BIO} karakter`);
      return;
    }
    const link = socialLink.trim();
    if (link && !/^https?:\/\/.+/i.test(link)) {
      toast.error("Tautan harus diawali http:// atau https://");
      return;
    }
    setSaving(true);
    const toastId = toast.loading("Menyimpan profil...");
    try {
      await updateMyProfile(userId, {
        displayName: displayName.trim().slice(0, 80),
        headline: headline.trim().slice(0, 120) || null,
        bio: bio.trim(),
        socialLink: link || null,
      });
      if (typeof window !== "undefined") {
        window.dispatchEvent(new CustomEvent("digisschool:profile_updated"));
      }
      toast.success("Profil berhasil disimpan", { id: toastId });
    } catch (e: any) {
      toast.error(e.message || "Gagal menyimpan profil", { id: toastId });
    } finally {
      setSaving(false);
    }
  };

  const [modalOpen, setModalOpen] = useState(false);

  const reloadProfile = () => {
    fetchMyProfile(userId)
      .then((p) => {
        if (!p) return;
        setProfile(p);
        setDisplayName(p.displayName ?? "");
        setHeadline(p.headline ?? "");
        setBio(p.bio ?? "");
        setSocialLink(p.socialLink ?? "");
        setAvatarValue(p.avatarUrl);
        setBannerValue(p.bannerUrl);
      })
      .catch(() => {});
  };

  useEffect(() => {
    const handleUpdated = () => reloadProfile();
    window.addEventListener("digisschool:profile_updated", handleUpdated);
    return () => window.removeEventListener("digisschool:profile_updated", handleUpdated);
  }, [userId]);

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Button
          size="sm"
          variant="default"
          onClick={() => setModalOpen(true)}
          className="rounded-xl text-xs font-bold gap-1.5 shadow-sm"
        >
          <Sparkles className="w-3.5 h-3.5" /> Edit Lengkap dengan Modal
        </Button>
        <Button size="sm" variant="outline" className="rounded-xl text-xs font-bold" asChild>
          <Link to="/siswa/$id" params={{ id: userId }}>
            <Trophy className="mr-1.5 h-4 w-4" /> Lihat Tampilan Publik
          </Link>
        </Button>
      </div>

      <EditProfileModal
        open={modalOpen}
        onOpenChange={setModalOpen}
        userId={userId}
        onSuccess={reloadProfile}
      />

      <ProfileCompleteness
        items={[
          { label: "Foto profil", hint: "Unggah foto agar mudah dikenali teman sekelas.", done: !!avatarValue },
          { label: "Banner", hint: "Tambahkan banner supaya profil tampak hidup.", done: !!bannerValue },
          { label: "Nama tampilan", hint: "Isi nama lengkap kamu.", done: !!displayName.trim() },
          { label: "Moto / headline", hint: "Tulis satu kalimat semangat belajarmu.", done: !!headline.trim() },
          { label: "Bio", hint: "Ceritakan minat dan targetmu minimal 20 karakter.", done: bio.trim().length >= 20 },
          { label: "Tautan", hint: "Tambahkan tautan sosial atau portofolio (opsional).", done: !!socialLink.trim() },
        ]}
      />

      <section className="overflow-hidden rounded-3xl border border-border/60 bg-background">
        <ProfileBanner value={bannerValue} className="h-44 sm:h-56">
          <div className="absolute right-4 top-4">
            <input
              ref={bannerRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => handleUpload("banner", e.target.files?.[0])}
            />
            <Button size="sm" variant="secondary" disabled={uploading !== null} onClick={() => bannerRef.current?.click()}>
              {uploading === "banner" ? (
                <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />
              ) : (
                <ImageIcon className="mr-1.5 h-4 w-4" />
              )}
              Ganti banner
            </Button>
          </div>
        </ProfileBanner>

        <div className="relative px-5 pb-6 sm:px-8">
          <div className="-mt-12 flex flex-wrap items-end gap-4">
            <div className="relative">
              <ProfileAvatar value={avatarValue} name={displayName} className="h-24 w-24" />
              <input
                ref={avatarRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => handleUpload("avatar", e.target.files?.[0])}
              />
              <button
                type="button"
                disabled={uploading !== null}
                onClick={() => avatarRef.current?.click()}
                aria-label="Ganti foto profil"
                className="absolute -bottom-2 -right-2 flex h-9 w-9 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-md transition-transform hover:scale-105 disabled:opacity-60"
              >
                {uploading === "avatar" ? <Loader2 className="h-4 w-4 animate-spin" /> : <Camera className="h-4 w-4" />}
              </button>
            </div>
            <div className="min-w-0 flex-1 pb-1">
              <h2 className="truncate text-xl font-semibold tracking-tight">{displayName || "Nama kamu"}</h2>
              <p className="truncate text-sm text-muted-foreground">{headline || "Tambahkan moto belajar singkat"}</p>
            </div>
            <Badge variant="secondary" className="mb-1">
              Kelas {profile?.grade ?? "-"}
            </Badge>
          </div>
          <p className="mt-4 max-w-2xl whitespace-pre-line text-sm text-muted-foreground">
            {bio || "Bio kamu akan tampil di sini dan bisa dilihat teman sekelas."}
          </p>
        </div>
      </section>

      <section className="rounded-2xl border border-border/60 bg-background p-5 sm:p-6">
        <div className="flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-primary" />
          <h2 className="text-base font-semibold tracking-tight">Informasi profil</h2>
        </div>
        <div className="mt-5 grid gap-5 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="displayName">Nama tampilan</Label>
            <Input
              id="displayName"
              value={displayName}
              maxLength={80}
              onChange={(e) => setDisplayName(e.target.value)}
              placeholder="Nama lengkap kamu"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="headline">Moto / headline</Label>
            <Input
              id="headline"
              value={headline}
              maxLength={120}
              onChange={(e) => setHeadline(e.target.value)}
              placeholder="Contoh: Calon programmer muda dari kelas 8"
            />
          </div>
          <div className="space-y-2 sm:col-span-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="bio">Bio</Label>
              <span className="text-xs text-muted-foreground">
                {bio.length}/{MAX_BIO}
              </span>
            </div>
            <Textarea
              id="bio"
              value={bio}
              rows={4}
              maxLength={MAX_BIO}
              onChange={(e) => setBio(e.target.value)}
              placeholder="Ceritakan minat belajarmu, target semester ini, atau prestasi yang ingin diraih."
            />
          </div>
          <div className="space-y-2 sm:col-span-2">
            <Label htmlFor="socialLink" className="flex items-center gap-1.5">
              <Link2 className="h-3.5 w-3.5" /> Tautan (opsional)
            </Label>
            <Input
              id="socialLink"
              value={socialLink}
              onChange={(e) => setSocialLink(e.target.value)}
              placeholder="https://instagram.com/username"
            />
          </div>
        </div>
        <div className="mt-6 flex justify-end">
          <Button onClick={handleSave} disabled={saving || uploading !== null}>
            {saving ? <Loader2 className="mr-1.5 h-4 w-4 animate-spin" /> : <Save className="mr-1.5 h-4 w-4" />}
            {saving ? "Menyimpan..." : "Simpan profil"}
          </Button>
        </div>
      </section>
    </div>
  );
}
