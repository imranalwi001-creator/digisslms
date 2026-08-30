import { useEffect, useState } from "react";
import banner1 from "@/assets/banner-1.jpg";
import banner2 from "@/assets/banner-2.jpg";
import banner3 from "@/assets/banner-3.jpg";
import digisschoolLogo from "@/assets/digisschool-logo.png";

export const SITE_BUCKET = "site-assets";

export type HeroSlide = {
  image: string;
  kicker: string;
  titleLine1: string;
  titleLine2: string;
  desc: string;
  cta: string;
};

export type StatItem = { value: string; label: string };
export type FeatureItem = { title: string; desc: string };
export type ReviewItem = { name: string; role: string; avatar: string; quote: string };
export type FaqItem = { q: string; a: string };

export type SiteSettings = {
  brandName: string;
  logoUrl: string | null;
  tagline: string;
  heroSlides: HeroSlide[];
  stats: StatItem[];
  features: FeatureItem[];
  reviews: ReviewItem[];
  faqs: FaqItem[];
  cta: { title: string; desc: string; button: string };
  footer: { description: string; copyright: string };
};

export const defaultSettings: SiteSettings = {
  brandName: "Digisschool",
  logoUrl: digisschoolLogo,
  tagline: "Digital Islamic Boarding School LMS",
  heroSlides: [
    {
      image: banner1,
      kicker: "Belajar mandiri",
      titleLine1: "Belajar konsisten,",
      titleLine2: "satu pelajaran setiap hari",
      desc: "Ruang belajar yang tenang dan fokus — tuntaskan materi, jaga rangkaian hari belajar, dan lihat progres tanpa gangguan.",
      cta: "Mulai belajar gratis",
    },
    {
      image: banner2,
      kicker: "Belajar bersama",
      titleLine1: "Kelas yang hidup,",
      titleLine2: "ritme yang Anda atur",
      desc: "Ikuti kelas, diskusikan materi, dan selesaikan modul dengan jadwal yang menyesuaikan hari Anda.",
      cta: "Lihat kelas",
    },
    {
      image: banner3,
      kicker: "Progres terukur",
      titleLine1: "Setiap sesi tercatat,",
      titleLine2: "setiap capaian terlihat",
      desc: "Momentum belajar, tingkat penyelesaian materi, dan capaian berbasis persentase dalam satu halaman progres.",
      cta: "Lihat progres saya",
    },
  ],
  stats: [
    { value: "2.400+", label: "Siswa aktif" },
    { value: "", label: "Materi kurikulum" },
    { value: "", label: "Modul pembelajaran" },
    { value: "94%", label: "Tingkat penyelesaian" },
  ],
  features: [
    { title: "Rangkaian hari belajar", desc: "Lihat momentum belajar Anda tumbuh setiap hari. Jangan putus rantainya." },
    { title: "Kalender belajar", desc: "Lihat konsistensi belajar Anda dalam tampilan 30 hari yang rapi." },
    { title: "Analitik belajar", desc: "Rangkaian hari, rekor terpanjang, dan tingkat penyelesaian materi." },
    { title: "Pengingat belajar", desc: "Atur jam pengingat agar tidak pernah melewatkan jadwal belajar." },
    { title: "Mode gelap", desc: "Nyaman di mata, siang atau malam. Mengikuti sistem atau pilihan Anda." },
    { title: "Sinkron antar perangkat", desc: "Masuk untuk menyinkronkan kelas dan progres di semua perangkat." },
  ],
  reviews: [
    {
      name: "Daniel Cooper",
      role: "Desainer produk",
      avatar: "https://trovdwfeqyzlxzrtfbjv.supabase.co/storage/v1/object/public/assets/avatars/e20b66f6-e7e9-4c00-93d3-506c78cb66c2/avatar-19.jpg",
      quote: "Akhirnya ada LMS yang tidak berisik. Hanya saya dan materi belajar saya.",
    },
    {
      name: "Emma Lindström",
      role: "Software engineer",
      avatar: "https://trovdwfeqyzlxzrtfbjv.supabase.co/storage/v1/object/public/assets/avatars/307e7512-1637-4ea2-a5cd-875afeb1002b/avatar-21.jpg",
      quote: "Rangkaian hari belajarnya bikin nagih. Saya sudah konsisten 47 hari.",
    },
    {
      name: "Ryan Mitchell",
      role: "Mahasiswa pascasarjana",
      avatar: "https://trovdwfeqyzlxzrtfbjv.supabase.co/storage/v1/object/public/assets/avatars/6b77ccde-dbfd-4c23-8c9f-ce748683068a/avatar-16.jpg",
      quote: "Kalender belajarnya keren. Melihat progres secara visual jauh lebih memotivasi.",
    },
    {
      name: "Mei Lin",
      role: "Penulis lepas",
      avatar: "https://trovdwfeqyzlxzrtfbjv.supabase.co/storage/v1/object/public/assets/avatars/b706d9a7-3a45-4fdd-ab47-c7023d4d0cfa/avatar-20.jpg",
      quote: "Sederhana, bersih, tanpa iklan. Seperti inilah LMS seharusnya. Mode gelapnya cantik.",
    },
  ],
  faqs: [
    {
      q: "Apakah Continuum LMS gratis untuk siswa?",
      a: "Ya. Siswa dapat mendaftar, mengikuti kelas, dan memantau progres tanpa biaya. Sekolah dapat meminta fitur pengelolaan tambahan.",
    },
    {
      q: "Bagaimana progres belajar dihitung?",
      a: "Setiap modul yang ditandai selesai menambah persentase capaian materi. Persentase gabungan menentukan level Anda, mulai Pemula hingga Teladan.",
    },
    {
      q: "Apakah guru bisa menambahkan siswa secara manual?",
      a: "Bisa. Admin dapat membuat akun siswa lengkap dengan email, kata sandi, kelas, dan daftar materi yang diikuti dari panel admin.",
    },
    {
      q: "Apakah bisa dipakai di ponsel?",
      a: "Bisa. Tampilan menyesuaikan layar ponsel, tablet, dan komputer tanpa perlu memasang aplikasi.",
    },
  ],
  cta: {
    title: "Siap belajar Informatika lebih terarah?",
    desc: "Platform pembelajaran digital terpadu untuk santri dan siswa Digital Islamic Boarding School.",
    button: "Mulai belajar sekarang",
  },
  footer: {
    description: "Digital Islamic Boarding School LMS — Platform Belajar Digital Terpadu.",
    copyright: "Digisschool (Digital Islamic Boarding School)",
  },
};

function arr<T>(value: unknown, fallback: T[]): T[] {
  return Array.isArray(value) && value.length > 0 ? (value as T[]) : fallback;
}

function obj<T extends object>(value: unknown, fallback: T): T {
  return value && typeof value === "object" ? { ...fallback, ...(value as T) } : fallback;
}

export function rowToSettings(row: any): SiteSettings {
  if (!row) return defaultSettings;
  const brandName = (row.brand_name && !row.brand_name.toLowerCase().includes("continuum")) 
    ? row.brand_name 
    : "Digisschool";
  return {
    brandName,
    logoUrl: row.logo_url || defaultSettings.logoUrl,
    tagline: row.tagline || defaultSettings.tagline,
    heroSlides: arr<HeroSlide>(row.hero_slides, defaultSettings.heroSlides),
    stats: arr<StatItem>(row.stats, defaultSettings.stats),
    features: arr<FeatureItem>(row.features, defaultSettings.features),
    reviews: arr<ReviewItem>(row.reviews, defaultSettings.reviews),
    faqs: arr<FaqItem>(row.faqs, defaultSettings.faqs),
    cta: obj(row.cta, defaultSettings.cta),
    footer: obj(row.footer, defaultSettings.footer),
  };
}

export function settingsToRow(s: SiteSettings) {
  return {
    brand_name: s.brandName,
    logo_url: s.logoUrl,
    tagline: s.tagline,
    hero_slides: s.heroSlides,
    stats: s.stats,
    features: s.features,
    reviews: s.reviews,
    faqs: s.faqs,
    cta: s.cta,
    footer: s.footer,
  };
}

export async function fetchSiteSettings(): Promise<SiteSettings> {
  try {
    const { supabase } = await import("@/integrations/supabase/client");
    const { data } = await (supabase as any).from("site_settings").select("*").eq("id", "default").maybeSingle();
    return rowToSettings(data);
  } catch {
    return defaultSettings;
  }
}

export async function saveSiteSettings(settings: SiteSettings): Promise<void> {
  const { supabase } = await import("@/integrations/supabase/client");
  const { error } = await (supabase as any)
    .from("site_settings")
    .upsert({ id: "default", ...settingsToRow(settings) });
  if (error) throw error;
}

/** Uploads a site image (logo/banner) and returns its storage path. */
export async function uploadSiteAsset(file: File, prefix: string): Promise<string> {
  const { supabase } = await import("@/integrations/supabase/client");
  const ext = file.name.split(".").pop()?.toLowerCase() || "jpg";
  const path = `${prefix}/${Date.now()}.${ext}`;
  const { error } = await supabase.storage.from(SITE_BUCKET).upload(path, file, { upsert: true });
  if (error) throw error;
  return path;
}

/** Resolves a stored value (absolute URL, bundled asset, or storage path) into a displayable src. */
export async function resolveSiteAsset(value: string | null | undefined): Promise<string | null> {
  if (!value) return defaultSettings.logoUrl;
  if (/^(https?:)?\/\//.test(value) || value.startsWith("/") || value.startsWith("data:") || value.startsWith("blob:")) return value;
  try {
    const { supabase } = await import("@/integrations/supabase/client");
    const { data } = await supabase.storage.from(SITE_BUCKET).createSignedUrl(value, 60 * 60 * 24 * 7);
    return data?.signedUrl ?? defaultSettings.logoUrl;
  } catch {
    return defaultSettings.logoUrl;
  }
}

/** Reads live site settings (falls back to built-in defaults). */
export function useSiteSettings() {
  const [settings, setSettings] = useState<SiteSettings>(defaultSettings);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let active = true;
    fetchSiteSettings()
      .then((s) => {
        if (active) setSettings(s);
      })
      .catch(() => {})
      .finally(() => {
        if (active) setIsLoading(false);
      });
    return () => {
      active = false;
    };
  }, []);

  return { settings, isLoading, setSettings };
}

/** Resolves an asset reference to a usable src for rendering. */
export function useSiteAsset(value: string | null | undefined) {
  const [src, setSrc] = useState<string | null>(value || defaultSettings.logoUrl);

  useEffect(() => {
    let active = true;
    if (value) {
      resolveSiteAsset(value).then((r) => {
        if (active) setSrc(r || defaultSettings.logoUrl);
      });
    } else {
      setSrc(defaultSettings.logoUrl);
    }
    return () => {
      active = false;
    };
  }, [value]);

  return src || defaultSettings.logoUrl;
}

/** Resolves a list of asset references (keeps order, null when unresolved). */
export function useSiteAssets(values: (string | null | undefined)[]) {
  const key = values.join("|");
  const [srcs, setSrcs] = useState<(string | null)[]>(values.map((v) => v ?? null));

  useEffect(() => {
    let active = true;
    Promise.all(values.map((v) => resolveSiteAsset(v))).then((r) => {
      if (active) setSrcs(r);
    });
    return () => {
      active = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);

  return srcs;
}
