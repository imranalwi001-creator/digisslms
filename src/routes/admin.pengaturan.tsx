import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { Loader2, Plus, Save, Trash2, Upload, RotateCcw, Image as ImageIcon } from "lucide-react";
import { toast } from "sonner";
import { DashboardShell } from "@/components/DashboardShell";
import { RequireRole } from "@/components/RequireRole";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAdminAction } from "@/lib/admin-action";
import {
  defaultSettings,
  fetchSiteSettings,
  saveSiteSettings,
  uploadSiteAsset,
  useSiteAsset,
  type SiteSettings,
} from "@/lib/site-settings";

export const Route = createFileRoute("/admin/pengaturan")({
  head: () => ({
    meta: [
      { title: "Pengaturan situs — Admin Digisschool LMS" },
      { name: "description", content: "Ubah logo, nama brand, banner, dan seluruh konten halaman utama LMS." },
      { property: "og:title", content: "Pengaturan situs — Admin Digisschool LMS" },
      { property: "og:description", content: "Kustomisasi tampilan dan konten halaman utama LMS." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: () => <RequireRole role="admin">{() => <AdminSettingsPage />}</RequireRole>,
});

/* ── Image field: upload to storage or paste a URL ── */
function ImageField({
  label,
  value,
  prefix,
  onChange,
}: {
  label: string;
  value: string | null;
  prefix: string;
  onChange: (v: string | null) => void;
}) {
  const preview = useSiteAsset(value);
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);

  const handleFile = async (file: File | undefined) => {
    if (!file) return;
    setUploading(true);
    try {
      const path = await uploadSiteAsset(file, prefix);
      onChange(path);
      toast.success("Gambar berhasil diunggah");
    } catch (err: any) {
      toast.error(err?.message ? `Gagal mengunggah: ${err.message}` : "Gagal mengunggah gambar");
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="space-y-2">
      <Label>{label}</Label>
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex h-16 w-24 flex-shrink-0 items-center justify-center overflow-hidden rounded-lg border border-border bg-muted">
          {preview ? (
            <img src={preview} alt={label} className="h-full w-full object-contain" />
          ) : (
            <ImageIcon className="h-5 w-5 text-muted-foreground" />
          )}
        </div>
        <div className="flex flex-wrap gap-2">
          <input
            ref={inputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => handleFile(e.target.files?.[0])}
          />
          <Button type="button" variant="outline" size="sm" disabled={uploading} onClick={() => inputRef.current?.click()}>
            {uploading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Upload className="mr-2 h-4 w-4" />}
            Unggah
          </Button>
          {value ? (
            <Button type="button" variant="ghost" size="sm" onClick={() => onChange(null)}>
              <Trash2 className="mr-2 h-4 w-4" />
              Hapus
            </Button>
          ) : null}
        </div>
      </div>
      <Input
        value={value ?? ""}
        onChange={(e) => onChange(e.target.value || null)}
        placeholder="atau tempel URL gambar (https://...)"
      />
    </div>
  );
}

function SectionCard({ title, desc, children }: { title: string; desc?: string; children: React.ReactNode }) {
  return (
    <div className="rounded-2xl border border-border bg-card p-5 sm:p-6">
      <div className="mb-4">
        <h2 className="text-base font-semibold text-foreground">{title}</h2>
        {desc ? <p className="mt-1 text-sm text-muted-foreground">{desc}</p> : null}
      </div>
      <div className="space-y-4">{children}</div>
    </div>
  );
}

function ItemShell({ title, onRemove, children }: { title: string; onRemove: () => void; children: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-border/70 bg-background p-4">
      <div className="mb-3 flex items-center justify-between gap-3">
        <p className="text-sm font-medium text-foreground">{title}</p>
        <Button type="button" variant="ghost" size="icon" onClick={onRemove} aria-label="Hapus">
          <Trash2 className="h-4 w-4 text-destructive" />
        </Button>
      </div>
      <div className="space-y-3">{children}</div>
    </div>
  );
}

function AdminSettingsPage() {
  const [settings, setSettings] = useState<SiteSettings>(defaultSettings);
  const [loading, setLoading] = useState(true);
  const { run, busy } = useAdminAction();

  useEffect(() => {
    fetchSiteSettings()
      .then(setSettings)
      .catch(() => toast.error("Gagal memuat pengaturan"))
      .finally(() => setLoading(false));
  }, []);

  const patch = (p: Partial<SiteSettings>) => setSettings((s) => ({ ...s, ...p }));

  const save = () =>
    run(
      "save",
      { loading: "Menyimpan pengaturan…", success: "Pengaturan situs tersimpan", error: "Gagal menyimpan pengaturan" },
      () => saveSiteSettings(settings),
    );

  if (loading) {
    return (
      <DashboardShell role="admin" title="Pengaturan situs">
        <div className="flex h-64 items-center justify-center">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      </DashboardShell>
    );
  }

  return (
    <DashboardShell role="admin" title="Pengaturan situs">
      <div className="space-y-5 pb-24">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <p className="max-w-xl text-sm text-muted-foreground">
            Ubah identitas brand dan seluruh konten halaman utama. Perubahan langsung tampil untuk semua pengunjung setelah disimpan.
          </p>
          <div className="flex gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setSettings(defaultSettings);
                toast.info("Konten dikembalikan ke bawaan — tekan Simpan untuk menerapkan");
              }}
            >
              <RotateCcw className="mr-2 h-4 w-4" />
              Setel ulang
            </Button>
            <Button type="button" onClick={save} disabled={busy}>
              {busy ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
              Simpan perubahan
            </Button>
          </div>
        </div>

        <Tabs defaultValue="brand" className="w-full">
          <TabsList className="flex w-full flex-wrap justify-start gap-1 h-auto">
            <TabsTrigger value="brand">Brand</TabsTrigger>
            <TabsTrigger value="hero">Banner</TabsTrigger>
            <TabsTrigger value="stats">Statistik</TabsTrigger>
            <TabsTrigger value="features">Fitur</TabsTrigger>
            <TabsTrigger value="reviews">Testimoni</TabsTrigger>
            <TabsTrigger value="faq">FAQ</TabsTrigger>
            <TabsTrigger value="cta">CTA & Footer</TabsTrigger>
          </TabsList>

          {/* Brand */}
          <TabsContent value="brand" className="mt-4">
            <SectionCard title="Identitas brand" desc="Logo dan nama yang tampil di header, footer, dan seluruh halaman.">
              <ImageField
                label="Logo"
                value={settings.logoUrl}
                prefix="logo"
                onChange={(v) => patch({ logoUrl: v })}
              />
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label>Nama brand</Label>
                  <Input value={settings.brandName} onChange={(e) => patch({ brandName: e.target.value })} />
                </div>
                <div className="space-y-2">
                  <Label>Tagline</Label>
                  <Input value={settings.tagline} onChange={(e) => patch({ tagline: e.target.value })} />
                </div>
              </div>
            </SectionCard>
          </TabsContent>

          {/* Hero slides */}
          <TabsContent value="hero" className="mt-4">
            <SectionCard title="Slider banner utama" desc="Setiap slide punya gambar, label, dua baris judul, deskripsi, dan teks tombol.">
              {settings.heroSlides.map((slide, i) => (
                <ItemShell
                  key={`slide-${i}`}
                  title={`Slide ${i + 1}`}
                  onRemove={() => patch({ heroSlides: settings.heroSlides.filter((_, j) => j !== i) })}
                >
                  <ImageField
                    label="Gambar banner"
                    value={slide.image}
                    prefix="banner"
                    onChange={(v) =>
                      patch({
                        heroSlides: settings.heroSlides.map((s, j) => (j === i ? { ...s, image: v ?? "" } : s)),
                      })
                    }
                  />
                  <div className="grid gap-3 sm:grid-cols-2">
                    <div className="space-y-2">
                      <Label>Label kecil</Label>
                      <Input
                        value={slide.kicker}
                        onChange={(e) =>
                          patch({ heroSlides: settings.heroSlides.map((s, j) => (j === i ? { ...s, kicker: e.target.value } : s)) })
                        }
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Teks tombol</Label>
                      <Input
                        value={slide.cta}
                        onChange={(e) =>
                          patch({ heroSlides: settings.heroSlides.map((s, j) => (j === i ? { ...s, cta: e.target.value } : s)) })
                        }
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Judul baris 1</Label>
                      <Input
                        value={slide.titleLine1}
                        onChange={(e) =>
                          patch({ heroSlides: settings.heroSlides.map((s, j) => (j === i ? { ...s, titleLine1: e.target.value } : s)) })
                        }
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Judul baris 2</Label>
                      <Input
                        value={slide.titleLine2}
                        onChange={(e) =>
                          patch({ heroSlides: settings.heroSlides.map((s, j) => (j === i ? { ...s, titleLine2: e.target.value } : s)) })
                        }
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>Deskripsi</Label>
                    <Textarea
                      rows={3}
                      value={slide.desc}
                      onChange={(e) =>
                        patch({ heroSlides: settings.heroSlides.map((s, j) => (j === i ? { ...s, desc: e.target.value } : s)) })
                      }
                    />
                  </div>
                </ItemShell>
              ))}
              <Button
                type="button"
                variant="outline"
                onClick={() =>
                  patch({
                    heroSlides: [
                      ...settings.heroSlides,
                      { image: "", kicker: "", titleLine1: "", titleLine2: "", desc: "", cta: "Mulai" },
                    ],
                  })
                }
              >
                <Plus className="mr-2 h-4 w-4" />
                Tambah slide
              </Button>
            </SectionCard>
          </TabsContent>

          {/* Stats */}
          <TabsContent value="stats" className="mt-4">
            <SectionCard title="Statistik" desc="Empat angka ringkas di bawah banner. Kosongkan nilai untuk memakai perhitungan otomatis.">
              {settings.stats.map((s, i) => (
                <ItemShell
                  key={`stat-${i}`}
                  title={`Statistik ${i + 1}`}
                  onRemove={() => patch({ stats: settings.stats.filter((_, j) => j !== i) })}
                >
                  <div className="grid gap-3 sm:grid-cols-2">
                    <div className="space-y-2">
                      <Label>Nilai</Label>
                      <Input
                        value={s.value}
                        onChange={(e) => patch({ stats: settings.stats.map((x, j) => (j === i ? { ...x, value: e.target.value } : x)) })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Keterangan</Label>
                      <Input
                        value={s.label}
                        onChange={(e) => patch({ stats: settings.stats.map((x, j) => (j === i ? { ...x, label: e.target.value } : x)) })}
                      />
                    </div>
                  </div>
                </ItemShell>
              ))}
              <Button type="button" variant="outline" onClick={() => patch({ stats: [...settings.stats, { value: "", label: "" }] })}>
                <Plus className="mr-2 h-4 w-4" />
                Tambah statistik
              </Button>
            </SectionCard>
          </TabsContent>

          {/* Features */}
          <TabsContent value="features" className="mt-4">
            <SectionCard title="Daftar fitur" desc="Kartu fitur pada bagian “Fitur” di halaman utama.">
              {settings.features.map((f, i) => (
                <ItemShell
                  key={`feature-${i}`}
                  title={`Fitur ${i + 1}`}
                  onRemove={() => patch({ features: settings.features.filter((_, j) => j !== i) })}
                >
                  <div className="space-y-2">
                    <Label>Judul</Label>
                    <Input
                      value={f.title}
                      onChange={(e) => patch({ features: settings.features.map((x, j) => (j === i ? { ...x, title: e.target.value } : x)) })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Deskripsi</Label>
                    <Textarea
                      rows={2}
                      value={f.desc}
                      onChange={(e) => patch({ features: settings.features.map((x, j) => (j === i ? { ...x, desc: e.target.value } : x)) })}
                    />
                  </div>
                </ItemShell>
              ))}
              <Button type="button" variant="outline" onClick={() => patch({ features: [...settings.features, { title: "", desc: "" }] })}>
                <Plus className="mr-2 h-4 w-4" />
                Tambah fitur
              </Button>
            </SectionCard>
          </TabsContent>

          {/* Reviews */}
          <TabsContent value="reviews" className="mt-4">
            <SectionCard title="Testimoni" desc="Cerita singkat siswa atau guru yang tampil di halaman utama.">
              {settings.reviews.map((r, i) => (
                <ItemShell
                  key={`review-${i}`}
                  title={r.name || `Testimoni ${i + 1}`}
                  onRemove={() => patch({ reviews: settings.reviews.filter((_, j) => j !== i) })}
                >
                  <ImageField
                    label="Foto"
                    value={r.avatar}
                    prefix="testimoni"
                    onChange={(v) => patch({ reviews: settings.reviews.map((x, j) => (j === i ? { ...x, avatar: v ?? "" } : x)) })}
                  />
                  <div className="grid gap-3 sm:grid-cols-2">
                    <div className="space-y-2">
                      <Label>Nama</Label>
                      <Input
                        value={r.name}
                        onChange={(e) => patch({ reviews: settings.reviews.map((x, j) => (j === i ? { ...x, name: e.target.value } : x)) })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Peran</Label>
                      <Input
                        value={r.role}
                        onChange={(e) => patch({ reviews: settings.reviews.map((x, j) => (j === i ? { ...x, role: e.target.value } : x)) })}
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>Kutipan</Label>
                    <Textarea
                      rows={2}
                      value={r.quote}
                      onChange={(e) => patch({ reviews: settings.reviews.map((x, j) => (j === i ? { ...x, quote: e.target.value } : x)) })}
                    />
                  </div>
                </ItemShell>
              ))}
              <Button
                type="button"
                variant="outline"
                onClick={() => patch({ reviews: [...settings.reviews, { name: "", role: "", avatar: "", quote: "" }] })}
              >
                <Plus className="mr-2 h-4 w-4" />
                Tambah testimoni
              </Button>
            </SectionCard>
          </TabsContent>

          {/* FAQ */}
          <TabsContent value="faq" className="mt-4">
            <SectionCard title="Pertanyaan umum" desc="Daftar tanya jawab pada bagian FAQ.">
              {settings.faqs.map((f, i) => (
                <ItemShell
                  key={`faq-${i}`}
                  title={`Pertanyaan ${i + 1}`}
                  onRemove={() => patch({ faqs: settings.faqs.filter((_, j) => j !== i) })}
                >
                  <div className="space-y-2">
                    <Label>Pertanyaan</Label>
                    <Input
                      value={f.q}
                      onChange={(e) => patch({ faqs: settings.faqs.map((x, j) => (j === i ? { ...x, q: e.target.value } : x)) })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Jawaban</Label>
                    <Textarea
                      rows={3}
                      value={f.a}
                      onChange={(e) => patch({ faqs: settings.faqs.map((x, j) => (j === i ? { ...x, a: e.target.value } : x)) })}
                    />
                  </div>
                </ItemShell>
              ))}
              <Button type="button" variant="outline" onClick={() => patch({ faqs: [...settings.faqs, { q: "", a: "" }] })}>
                <Plus className="mr-2 h-4 w-4" />
                Tambah pertanyaan
              </Button>
            </SectionCard>
          </TabsContent>

          {/* CTA & Footer */}
          <TabsContent value="cta" className="mt-4 space-y-5">
            <SectionCard title="Ajakan akhir halaman" desc="Bagian penutup sebelum footer.">
              <div className="space-y-2">
                <Label>Judul</Label>
                <Input value={settings.cta.title} onChange={(e) => patch({ cta: { ...settings.cta, title: e.target.value } })} />
              </div>
              <div className="space-y-2">
                <Label>Deskripsi</Label>
                <Textarea rows={2} value={settings.cta.desc} onChange={(e) => patch({ cta: { ...settings.cta, desc: e.target.value } })} />
              </div>
              <div className="space-y-2">
                <Label>Teks tombol</Label>
                <Input value={settings.cta.button} onChange={(e) => patch({ cta: { ...settings.cta, button: e.target.value } })} />
              </div>
            </SectionCard>

            <SectionCard title="Footer" desc="Deskripsi singkat dan teks hak cipta.">
              <div className="space-y-2">
                <Label>Deskripsi</Label>
                <Textarea
                  rows={2}
                  value={settings.footer.description}
                  onChange={(e) => patch({ footer: { ...settings.footer, description: e.target.value } })}
                />
              </div>
              <div className="space-y-2">
                <Label>Teks hak cipta</Label>
                <Input
                  value={settings.footer.copyright}
                  onChange={(e) => patch({ footer: { ...settings.footer, copyright: e.target.value } })}
                />
              </div>
            </SectionCard>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardShell>
  );
}
