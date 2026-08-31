export type ProfileLinkCategory =
  | "github"
  | "project"
  | "portfolio"
  | "instagram"
  | "youtube"
  | "tiktok"
  | "linkedin"
  | "figma"
  | "other";

export type ProfileLink = {
  id: string;
  title: string;
  url: string;
  category: ProfileLinkCategory;
  description?: string;
};

export function parseProfileLinks(raw?: string | null): ProfileLink[] {
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) {
      return parsed.filter((item) => item && typeof item.url === "string" && item.url.trim() !== "");
    }
  } catch {
    // If it's a legacy single url string (e.g. "https://instagram.com/...")
    if (typeof raw === "string" && raw.trim().startsWith("http")) {
      const url = raw.trim();
      let category: ProfileLinkCategory = "other";
      let title = "Tautan Sosial";
      if (url.includes("github.com")) {
        category = "github";
        title = "GitHub Repository";
      } else if (url.includes("instagram.com")) {
        category = "instagram";
        title = "Instagram";
      } else if (url.includes("youtube.com") || url.includes("youtu.be")) {
        category = "youtube";
        title = "YouTube Channel";
      } else if (url.includes("linkedin.com")) {
        category = "linkedin";
        title = "LinkedIn";
      }
      return [{ id: "legacy-1", title, url, category }];
    }
  }
  return [];
}

export function serializeProfileLinks(links: ProfileLink[]): string | null {
  const valid = links.filter((l) => l.url && l.url.trim() !== "");
  if (valid.length === 0) return null;
  return JSON.stringify(valid);
}

export type StudentProfile = {
  id: string;
  displayName: string | null;
  avatarUrl: string | null;
  bannerUrl: string | null;
  headline: string | null;
  bio: string;
  socialLink: string | null;
  links?: ProfileLink[];
  grade: number | null;
  leaderboardOptOut: boolean;
};

export const PROFILE_BUCKET = "profile-media";

async function db() {
  const { supabase } = await import("@/integrations/supabase/client");
  return supabase as any;
}

const PROFILE_COLUMNS =
  "id, display_name, avatar_url, banner_url, headline, bio, social_link, grade, leaderboard_opt_out";

function mapProfile(data: any): StudentProfile {
  return {
    id: data.id,
    displayName: data.display_name,
    avatarUrl: data.avatar_url,
    bannerUrl: data.banner_url ?? null,
    headline: data.headline ?? null,
    bio: data.bio ?? "",
    socialLink: data.social_link ?? null,
    links: parseProfileLinks(data.social_link),
    grade: data.grade ?? null,
    leaderboardOptOut: !!data.leaderboard_opt_out,
  };
}

export async function fetchMyProfile(userId: string): Promise<StudentProfile | null> {
  try {
    const { getTursoClient } = await import("@/lib/turso");
    const db = getTursoClient();
    const res = await db.execute({
      sql: "SELECT * FROM profiles WHERE id = ? LIMIT 1;",
      args: [userId],
    });
    if (res.rows.length > 0) {
      return mapProfile(res.rows[0]);
    }
  } catch (err) {
    console.warn("[Profile] Turso fetch error, falling back:", err);
  }

  try {
    const supabase = await db();
    const { data } = await supabase
      .from("profiles")
      .select(PROFILE_COLUMNS)
      .eq("id", userId)
      .maybeSingle();
    if (!data) return null;
    return mapProfile(data);
  } catch {
    return null;
  }
}

/** Sets the student's class. */
export async function setMyGrade(userId: string, grade: 7 | 8 | 9) {
  try {
    const { getTursoClient } = await import("@/lib/turso");
    const db = getTursoClient();
    await db.batch([
      { sql: "UPDATE profiles SET grade = ? WHERE id = ?;", args: [grade, userId] },
      { sql: "UPDATE users SET grade = ? WHERE id = ?;", args: [grade, userId] },
    ], "write");
  } catch (err) {
    const supabase = await db();
    await supabase.from("profiles").update({ grade }).eq("id", userId);
  }
}

export async function setLeaderboardOptOut(userId: string, optOut: boolean) {
  try {
    const { getTursoClient } = await import("@/lib/turso");
    const db = getTursoClient();
    await db.execute({
      sql: "UPDATE profiles SET leaderboard_opt_out = ? WHERE id = ?;",
      args: [optOut ? 1 : 0, userId],
    });
  } catch (err) {
    const supabase = await db();
    await supabase.from("profiles").update({ leaderboard_opt_out: optOut }).eq("id", userId);
  }
}

export type ProfileEditableFields = {
  displayName?: string | null;
  headline?: string | null;
  bio?: string;
  socialLink?: string | null;
  avatarUrl?: string | null;
  bannerUrl?: string | null;
};

export async function updateMyProfile(userId: string, fields: ProfileEditableFields) {
  try {
    const { getTursoClient } = await import("@/lib/turso");
    const db = getTursoClient();
    await db.batch([
      {
        sql: `UPDATE profiles 
              SET display_name = COALESCE(?, display_name),
                  full_name = COALESCE(?, full_name),
                  headline = COALESCE(?, headline),
                  bio = COALESCE(?, bio),
                  social_link = COALESCE(?, social_link),
                  avatar_url = COALESCE(?, avatar_url),
                  banner_url = COALESCE(?, banner_url)
              WHERE id = ?;`,
        args: [
          fields.displayName ?? null,
          fields.displayName ?? null,
          fields.headline ?? null,
          fields.bio ?? null,
          fields.socialLink ?? null,
          fields.avatarUrl ?? null,
          fields.bannerUrl ?? null,
          userId,
        ],
      },
      {
        sql: `UPDATE users 
              SET full_name = COALESCE(?, full_name),
                  avatar_url = COALESCE(?, avatar_url)
              WHERE id = ?;`,
        args: [fields.displayName ?? null, fields.avatarUrl ?? null, userId],
      },
    ], "write");

    // Update local storage session if it's the current user
    const { getTursoCurrentSession, saveTursoSession } = await import("@/lib/turso-auth");
    const current = getTursoCurrentSession();
    if (current && current.id === userId) {
      if (fields.displayName) current.full_name = fields.displayName;
      if (fields.avatarUrl) current.avatar_url = fields.avatarUrl;
      saveTursoSession(current);
    }
  } catch (err) {
    const supabase = await db();
    const payload: Record<string, unknown> = {};
    if (fields.displayName !== undefined) payload.display_name = fields.displayName;
    if (fields.headline !== undefined) payload.headline = fields.headline;
    if (fields.bio !== undefined) payload.bio = fields.bio;
    if (fields.socialLink !== undefined) payload.social_link = fields.socialLink;
    if (fields.avatarUrl !== undefined) payload.avatar_url = fields.avatarUrl;
    if (fields.bannerUrl !== undefined) payload.banner_url = fields.bannerUrl;
    await supabase.from("profiles").update(payload).eq("id", userId);
  }
}

const MAX_UPLOAD_BYTES = 10 * 1024 * 1024;

/**
 * Resizes and compresses an image in browser memory down to optimized base64 Data URL.
 * Ensures 100% instant display without broken image links or CORS errors.
 */
export async function fileToOptimizedDataUrl(
  file: File,
  maxWidth: number,
  maxHeight: number,
  quality = 0.85,
): Promise<string> {
  return new Promise((resolve, reject) => {
    if (!file.type.startsWith("image/")) {
      reject(new Error("File harus berupa gambar (JPG, PNG, WEBP)"));
      return;
    }
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement("canvas");
        let width = img.width;
        let height = img.height;

        if (width > maxWidth || height > maxHeight) {
          const ratio = Math.min(maxWidth / width, maxHeight / height);
          width = Math.max(1, Math.round(width * ratio));
          height = Math.max(1, Math.round(height * ratio));
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext("2d");
        if (!ctx) {
          resolve(e.target?.result as string);
          return;
        }
        ctx.drawImage(img, 0, 0, width, height);
        resolve(canvas.toDataURL("image/jpeg", quality));
      };
      img.onerror = () => resolve(e.target?.result as string);
      img.src = e.target?.result as string;
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

/** Uploads an avatar/banner image and returns an immediately renderable image string. */
export async function uploadProfileMedia(
  userId: string,
  kind: "avatar" | "banner",
  file: File,
): Promise<string> {
  if (!file.type.startsWith("image/")) throw new Error("File harus berupa gambar");
  if (file.size > MAX_UPLOAD_BYTES) throw new Error("Ukuran gambar maksimal 10 MB");

  // 1. Optimize image in-memory for instant rendering
  const maxWidth = kind === "avatar" ? 360 : 1280;
  const maxHeight = kind === "avatar" ? 360 : 480;
  const quality = kind === "avatar" ? 0.88 : 0.84;
  const optimizedDataUrl = await fileToOptimizedDataUrl(file, maxWidth, maxHeight, quality);

  // 2. Optionally upload to Supabase storage in background
  try {
    const supabase = await db();
    const ext = (file.name.split(".").pop() || "jpg").toLowerCase().replace(/[^a-z0-9]/g, "");
    const path = `${userId}/${kind}-${Date.now()}.${ext || "jpg"}`;
    await supabase.storage
      .from(PROFILE_BUCKET)
      .upload(path, file, { upsert: true, contentType: file.type });
  } catch (storageErr) {
    console.warn("Storage upload fallback to Data URL:", storageErr);
  }

  return optimizedDataUrl;
}

const signedCache = new Map<string, { url: string; expires: number }>();

/** Resolves a stored avatar/banner value into a displayable URL. */
export async function resolveProfileMedia(value?: string | null): Promise<string | null> {
  if (!value) return null;
  if (/^(https?:|data:|blob:|\/)/.test(value)) return value;
  const cached = signedCache.get(value);
  if (cached && cached.expires > Date.now()) return cached.url;
  try {
    const supabase = await db();
    const { data, error } = await supabase.storage.from(PROFILE_BUCKET).createSignedUrl(value, 60 * 60 * 24 * 7);
    if (error || !data?.signedUrl) return null;
    signedCache.set(value, { url: data.signedUrl, expires: Date.now() + 60 * 60 * 6 * 1000 });
    return data.signedUrl;
  } catch {
    return null;
  }
}
