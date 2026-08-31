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

/** Ensures a profile row exists for the signed-in user. */
export async function ensureProfile() {
  try {
    const { getTursoCurrentSession } = await import("@/lib/turso-auth");
    const user = getTursoCurrentSession();
    if (!user) return;
    const { getTursoClient } = await import("@/lib/turso");
    const db = getTursoClient();
    await db.execute({
      sql: `INSERT OR IGNORE INTO profiles (id, display_name, full_name, email, role, status)
            VALUES (?, ?, ?, ?, ?, 'active');`,
      args: [user.id, user.full_name, user.full_name, user.email, user.role],
    });
  } catch {
    // Non-fatal
  }
}

export async function fetchEnrollments(userId: string): Promise<Enrollment[]> {
  try {
    const { getTursoClient } = await import("@/lib/turso");
    const db = getTursoClient();
    const res = await db.execute({
      sql: "SELECT * FROM enrollments WHERE user_id = ? ORDER BY created_at DESC;",
      args: [userId],
    });
    return (res.rows || []).map((e) => ({
      id: String(e.id || `${e.user_id}-${e.material_slug}`),
      userId: String(e.user_id),
      materialSlug: String(e.material_slug),
      status: "active",
      createdAt: String(e.created_at || ""),
    }));
  } catch (err) {
    const supabase = await db();
    const { data } = await supabase
      .from("enrollments")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false });
    return (data || []).map(mapEnrollment);
  }
}

export async function fetchModuleProgress(userId: string): Promise<ModuleProgress[]> {
  try {
    const { getTursoClient } = await import("@/lib/turso");
    const db = getTursoClient();
    const res = await db.execute({
      sql: "SELECT * FROM module_progress WHERE user_id = ?;",
      args: [userId],
    });
    return (res.rows || []).map((p) => ({
      id: String(p.id || `${p.user_id}-${p.material_slug}-${p.module_index}`),
      userId: String(p.user_id),
      materialSlug: String(p.material_slug),
      moduleIndex: Number(p.module_index),
      completedAt: String(p.completed_at || ""),
    }));
  } catch (err) {
    const supabase = await db();
    const { data } = await supabase.from("module_progress").select("*").eq("user_id", userId);
    return (data || []).map(mapProgress);
  }
}

export async function enroll(userId: string, materialSlug: string) {
  try {
    const { getTursoClient } = await import("@/lib/turso");
    const db = getTursoClient();
    const id = `${userId}-${materialSlug}`;
    await db.execute({
      sql: `INSERT OR REPLACE INTO enrollments (id, user_id, material_slug, created_at)
            VALUES (?, ?, ?, CURRENT_TIMESTAMP);`,
      args: [id, userId, materialSlug],
    });
  } catch (err) {
    const supabase = await db();
    await supabase
      .from("enrollments")
      .upsert({ user_id: userId, material_slug: materialSlug }, { onConflict: "user_id,material_slug" });
  }
}

export async function unenroll(userId: string, materialSlug: string) {
  try {
    const { getTursoClient } = await import("@/lib/turso");
    const db = getTursoClient();
    await db.execute({
      sql: "DELETE FROM enrollments WHERE user_id = ? AND material_slug = ?;",
      args: [userId, materialSlug],
    });
  } catch (err) {
    const supabase = await db();
    await supabase
      .from("enrollments")
      .delete()
      .eq("user_id", userId)
      .eq("material_slug", materialSlug);
  }
}

export async function toggleModule(
  userId: string,
  materialSlug: string,
  moduleIndex: number,
  done: boolean,
) {
  try {
    const { getTursoClient } = await import("@/lib/turso");
    const db = getTursoClient();
    const id = `${userId}-${materialSlug}-${moduleIndex}`;
    if (done) {
      await db.execute({
        sql: `INSERT OR REPLACE INTO module_progress (id, user_id, material_slug, module_index, completed_at)
              VALUES (?, ?, ?, ?, CURRENT_TIMESTAMP);`,
        args: [id, userId, materialSlug, moduleIndex],
      });
    } else {
      await db.execute({
        sql: "DELETE FROM module_progress WHERE user_id = ? AND material_slug = ? AND module_index = ?;",
        args: [userId, materialSlug, moduleIndex],
      });
    }
  } catch (err) {
    const supabase = await db();
    if (done) {
      await supabase
        .from("module_progress")
        .upsert(
          { user_id: userId, material_slug: materialSlug, module_index: moduleIndex },
          { onConflict: "user_id,material_slug,module_index" },
        );
    } else {
      await supabase
        .from("module_progress")
        .delete()
        .eq("user_id", userId)
        .eq("material_slug", materialSlug)
        .eq("module_index", moduleIndex);
    }
  }
}

export async function fetchAnnouncements(limit = 20): Promise<Announcement[]> {
  try {
    const { getTursoClient } = await import("@/lib/turso");
    const db = getTursoClient();
    const res = await db.execute({
      sql: "SELECT * FROM announcements ORDER BY created_at DESC LIMIT ?;",
      args: [limit],
    });
    return (res.rows || []).map((a) => ({
      id: String(a.id),
      title: String(a.title),
      body: String(a.body),
      level: String(a.level || "info"),
      createdAt: String(a.created_at || ""),
    }));
  } catch {
    const supabase = await db();
    const { data } = await supabase
      .from("announcements")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(limit);
    return (data || []).map(mapAnnouncement);
  }
}

export async function createAnnouncement(input: {
  title: string;
  body: string;
  level: string;
  userId: string;
}) {
  const id = `ann_${Date.now()}`;
  try {
    const { getTursoClient } = await import("@/lib/turso");
    const db = getTursoClient();
    await db.execute({
      sql: "INSERT INTO announcements (id, title, body, level, created_by, created_at) VALUES (?, ?, ?, ?, ?, CURRENT_TIMESTAMP);",
      args: [id, input.title, input.body, input.level, input.userId],
    });
  } catch {
    const supabase = await db();
    await supabase.from("announcements").insert({
      title: input.title,
      body: input.body,
      level: input.level,
      created_by: input.userId,
    });
  }
}

export async function deleteAnnouncement(id: string) {
  try {
    const { getTursoClient } = await import("@/lib/turso");
    const db = getTursoClient();
    await db.execute({
      sql: "DELETE FROM announcements WHERE id = ?;",
      args: [id],
    });
  } catch {
    const supabase = await db();
    await supabase.from("announcements").delete().eq("id", id);
  }
}

export async function updateAnnouncement(
  id: string,
  patch: { title: string; body: string; level: string },
) {
  try {
    const { getTursoClient } = await import("@/lib/turso");
    const db = getTursoClient();
    await db.execute({
      sql: "UPDATE announcements SET title = ?, body = ?, level = ? WHERE id = ?;",
      args: [patch.title, patch.body, patch.level, id],
    });
  } catch {
    const supabase = await db();
    await supabase.from("announcements").update(patch).eq("id", id);
  }
}

export async function fetchEnrollmentsFor(userId: string) {
  return fetchEnrollments(userId);
}

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
  try {
    const { tursoAdminUpdateUser } = await import("@/lib/turso-auth");
    await tursoAdminUpdateUser(userId, {
      fullName: patch.display_name ?? undefined,
      grade: patch.grade,
      phone: patch.phone,
      school: patch.school,
      notes: patch.notes,
      status: patch.status,
    });
  } catch (err) {
    const supabase = await db();
    await supabase.from("profiles").update(patch).eq("id", userId);
  }
}

export async function setUserRole(userId: string, role: "admin" | "guru" | "student") {
  try {
    const { getTursoClient } = await import("@/lib/turso");
    const db = getTursoClient();
    await db.batch([
      { sql: "DELETE FROM user_roles WHERE user_id = ?;", args: [userId] },
      { sql: "INSERT INTO user_roles (user_id, role) VALUES (?, ?);", args: [userId, role] },
      { sql: "UPDATE users SET role = ? WHERE id = ?;", args: [role, userId] },
      { sql: "UPDATE profiles SET role = ? WHERE id = ?;", args: [role, userId] },
    ], "write");
  } catch (err) {
    const supabase = await db();
    await supabase.from("user_roles").delete().eq("user_id", userId);
    await supabase.from("user_roles").insert({ user_id: userId, role });
  }
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
