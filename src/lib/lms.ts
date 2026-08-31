import { materials, type Materi } from "./materials";

export type Enrollment = {
  id: string;
  userId: string;
  materialSlug: string;
  status: string;
  createdAt: string;
};

export type ModuleProgress = {
  id: string;
  userId: string;
  materialSlug: string;
  moduleIndex: number;
  completedAt: string;
};

export type Announcement = {
  id: string;
  title: string;
  body: string;
  level: string;
  createdAt: string;
};

export type StudentRow = {
  id: string;
  displayName: string | null;
  email: string | null;
  grade: number | null;
  phone: string | null;
  school: string | null;
  notes: string | null;
  status: string;
  createdAt: string;
  role: string;
  enrollments: number;
  completedModules: number;
  totalModules: number;
  progress: number;
  lastActivity: string | null;
};

async function db() {
  const { supabase } = await import("@/integrations/supabase/client");
  return supabase as any;
}

/* ---------- student ---------- */

/** Ensures a profile row exists for the signed-in user (no auth trigger available). */
export async function ensureProfile() {
  const supabase = await db();
  const { data } = await supabase.auth.getUser();
  const user = data?.user;
  if (!user) return;
  const meta = user.user_metadata || {};
  const { data: existing } = await supabase.from("profiles").select("id").eq("id", user.id).maybeSingle();
  if (existing) return;
  await supabase.from("profiles").insert({
    id: user.id,
    display_name: meta.full_name || meta.name || (user.email || "").split("@")[0],
    avatar_url: meta.avatar_url || meta.picture || null,
    email: user.email,
    grade: meta.grade ? Number(meta.grade) : null,
    phone: meta.phone || null,
    school: meta.school || null,
  });
}

export async function fetchEnrollments(userId: string): Promise<Enrollment[]> {
  const supabase = await db();
  const { data, error } = await supabase
    .from("enrollments")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return (data || []).map(mapEnrollment);
}

export async function fetchModuleProgress(userId: string): Promise<ModuleProgress[]> {
  const supabase = await db();
  const { data, error } = await supabase.from("module_progress").select("*").eq("user_id", userId);
  if (error) throw error;
  return (data || []).map(mapProgress);
}

export async function enroll(userId: string, materialSlug: string) {
  const supabase = await db();
  const { error } = await supabase
    .from("enrollments")
    .upsert({ user_id: userId, material_slug: materialSlug }, { onConflict: "user_id,material_slug" });
  if (error) throw error;
}

export async function unenroll(userId: string, materialSlug: string) {
  const supabase = await db();
  const { error } = await supabase
    .from("enrollments")
    .delete()
    .eq("user_id", userId)
    .eq("material_slug", materialSlug);
  if (error) throw error;
}

export async function toggleModule(
  userId: string,
  materialSlug: string,
  moduleIndex: number,
  done: boolean,
) {
  const supabase = await db();
  if (done) {
    const { error } = await supabase
      .from("module_progress")
      .upsert(
        { user_id: userId, material_slug: materialSlug, module_index: moduleIndex },
        { onConflict: "user_id,material_slug,module_index" },
      );
    if (error) throw error;
  } else {
    const { error } = await supabase
      .from("module_progress")
      .delete()
      .eq("user_id", userId)
      .eq("material_slug", materialSlug)
      .eq("module_index", moduleIndex);
    if (error) throw error;
  }
}

export async function fetchAnnouncements(limit = 20): Promise<Announcement[]> {
  const supabase = await db();
  const { data, error } = await supabase
    .from("announcements")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(limit);
  if (error) throw error;
  return (data || []).map(mapAnnouncement);
}

export async function createAnnouncement(input: {
  title: string;
  body: string;
  level: string;
  userId: string;
}) {
  const supabase = await db();
  const { error } = await supabase.from("announcements").insert({
    title: input.title,
    body: input.body,
    level: input.level,
    created_by: input.userId,
  });
  if (error) throw error;
}

export async function deleteAnnouncement(id: string) {
  const supabase = await db();
  const { error } = await supabase.from("announcements").delete().eq("id", id);
  if (error) throw error;
}

/* ---------- admin ---------- */

export async function fetchAdminData() {
  try {
    const { getTursoClient } = await import("@/lib/turso");
    const db = getTursoClient();

    const [profilesRes, rolesRes, enrollmentsRes, progressRes, usersRes] = await Promise.all([
      db.execute("SELECT * FROM profiles ORDER BY created_at DESC;").catch(() => ({ rows: [] })),
      db.execute("SELECT * FROM user_roles;").catch(() => ({ rows: [] })),
      db.execute("SELECT * FROM enrollments;").catch(() => ({ rows: [] })),
      db.execute("SELECT * FROM module_progress;").catch(() => ({ rows: [] })),
      db.execute("SELECT * FROM users ORDER BY created_at DESC;").catch(() => ({ rows: [] })),
    ]);

    const profileMap = new Map<string, ProfileRow>();

    // 1. Add from profiles table
    for (const r of profilesRes.rows || []) {
      profileMap.set(String(r.id), {
        id: String(r.id),
        display_name: r.display_name ? String(r.display_name) : null,
        email: r.email ? String(r.email) : null,
        grade: r.grade ? Number(r.grade) : null,
        phone: r.phone ? String(r.phone) : null,
        school: r.school ? String(r.school) : null,
        notes: r.notes ? String(r.notes) : null,
        status: r.status ? String(r.status) : "active",
        created_at: String(r.created_at || new Date().toISOString()),
      });
    }

    // 2. Supplement/Merge from users table
    for (const u of usersRes.rows || []) {
      const existing = profileMap.get(String(u.id));
      if (existing) {
        if (!existing.email && u.email) existing.email = String(u.email);
        if (!existing.display_name && u.full_name) existing.display_name = String(u.full_name);
      } else {
        profileMap.set(String(u.id), {
          id: String(u.id),
          display_name: u.full_name ? String(u.full_name) : null,
          email: u.email ? String(u.email) : null,
          grade: null,
          phone: u.phone_number ? String(u.phone_number) : null,
          school: null,
          notes: null,
          status: u.status ? String(u.status) : "active",
          created_at: String(u.created_at || new Date().toISOString()),
        });
      }
    }

    const rolesList: Array<{ user_id: string; role: string }> = (rolesRes.rows || []).map((r) => ({
      user_id: String(r.user_id),
      role: String(r.role),
    }));

    // Supplement roles from users table if not in user_roles
    for (const u of usersRes.rows || []) {
      if (u.role && !rolesList.some((r) => r.user_id === String(u.id))) {
        rolesList.push({ user_id: String(u.id), role: String(u.role) });
      }
    }

    const enrollmentsList = (enrollmentsRes.rows || []).map((e) => ({
      id: String(e.id || `${e.user_id}-${e.material_slug}`),
      userId: String(e.user_id),
      materialSlug: String(e.material_slug),
      status: "active",
      createdAt: String(e.created_at || ""),
    }));

    const progressList = (progressRes.rows || []).map((p) => ({
      id: String(p.id || `${p.user_id}-${p.material_slug}-${p.module_index}`),
      userId: String(p.user_id),
      materialSlug: String(p.material_slug),
      moduleIndex: Number(p.module_index),
      completedAt: String(p.completed_at || ""),
    }));

    return {
      profiles: Array.from(profileMap.values()),
      roles: rolesList,
      enrollments: enrollmentsList,
      progress: progressList,
    };
  } catch (tursoErr) {
    console.warn("[LMS] Fallback to client db:", tursoErr);
    const supabase = await db();
    const [profiles, roles, enrollments, progress] = await Promise.all([
      supabase.from("profiles").select("*").order("created_at", { ascending: false }),
      supabase.from("user_roles").select("*"),
      supabase.from("enrollments").select("*"),
      supabase.from("module_progress").select("*"),
    ]);
    return {
      profiles: (profiles.data || []) as ProfileRow[],
      roles: (roles.data || []) as Array<{ user_id: string; role: string }>,
      enrollments: ((enrollments.data || []) as any[]).map(mapEnrollment),
      progress: ((progress.data || []) as any[]).map(mapProgress),
    };
  }
}

export type ProfileRow = {
  id: string;
  display_name: string | null;
  email: string | null;
  grade: number | null;
  phone: string | null;
  school: string | null;
  notes: string | null;
  status: string | null;
  created_at: string;
};

export async function updateProfile(
  userId: string,
  patch: {
    display_name?: string | null;
    grade?: number | null;
    phone?: string | null;
    school?: string | null;
    notes?: string | null;
    status?: string;
  },
) {
  const supabase = await db();
  const { error } = await supabase.from("profiles").update(patch).eq("id", userId);
  if (error) throw error;
}

export async function updateAnnouncement(
  id: string,
  patch: { title: string; body: string; level: string },
) {
  const supabase = await db();
  const { error } = await supabase.from("announcements").update(patch).eq("id", id);
  if (error) throw error;
}

export async function fetchEnrollmentsFor(userId: string) {
  return fetchEnrollments(userId);
}

export async function setUserRole(userId: string, role: "admin" | "guru" | "student") {
  const supabase = await db();
  const { error: delErr } = await supabase.from("user_roles").delete().eq("user_id", userId);
  if (delErr) throw delErr;
  const { error } = await supabase.from("user_roles").insert({ user_id: userId, role });
  if (error) throw error;
}

export function buildStudentRows(data: Awaited<ReturnType<typeof fetchAdminData>>): StudentRow[] {
  return data.profiles.map((p) => {
    const role = data.roles.find((r) => r.user_id === p.id)?.role ?? "student";
    const myEnrollments = data.enrollments.filter((e) => e.userId === p.id);
    const myProgress = data.progress.filter((pr) => pr.userId === p.id);
    const totalModules = myEnrollments.reduce(
      (sum, e) => sum + (findMaterial(e.materialSlug)?.modules ?? 0),
      0,
    );
    const last = myProgress
      .map((pr) => pr.completedAt)
      .sort()
      .at(-1);
    return {
      id: p.id,
      displayName: p.display_name,
      email: p.email ?? null,
      grade: p.grade ?? null,
      phone: p.phone ?? null,
      school: p.school ?? null,
      notes: p.notes ?? null,
      status: p.status ?? "active",
      createdAt: p.created_at,
      role,
      enrollments: myEnrollments.length,
      completedModules: myProgress.length,
      totalModules,
      progress: totalModules ? Math.round((myProgress.length / totalModules) * 100) : 0,
      lastActivity: last ?? null,
    };
  });
}

/* ---------- helpers ---------- */

export function findMaterial(slug: string): Materi | undefined {
  return materials.find((m) => m.slug === slug);
}

export function materialProgress(slug: string, progress: ModuleProgress[]) {
  const material = findMaterial(slug);
  const total = material?.modules ?? 0;
  const done = progress.filter((p) => p.materialSlug === slug).length;
  return { total, done, percent: total ? Math.round((done / total) * 100) : 0 };
}

export function formatDate(value: string | null): string {
  if (!value) return "—";
  return new Date(value).toLocaleDateString("id-ID", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export function levelLabel(percent: number): { label: string; next: number } {
  if (percent >= 90) return { label: "Teladan", next: 100 };
  if (percent >= 70) return { label: "Ahli", next: 90 };
  if (percent >= 45) return { label: "Mahir", next: 70 };
  if (percent >= 20) return { label: "Berkembang", next: 45 };
  return { label: "Pemula", next: 20 };
}

function mapEnrollment(row: any): Enrollment {
  return {
    id: row.id,
    userId: row.user_id,
    materialSlug: row.material_slug,
    status: row.status,
    createdAt: row.created_at,
  };
}

function mapProgress(row: any): ModuleProgress {
  return {
    id: row.id,
    userId: row.user_id,
    materialSlug: row.material_slug,
    moduleIndex: row.module_index,
    completedAt: row.completed_at,
  };
}

function mapAnnouncement(row: any): Announcement {
  return {
    id: row.id,
    title: row.title,
    body: row.body,
    level: row.level,
    createdAt: row.created_at,
  };
}
