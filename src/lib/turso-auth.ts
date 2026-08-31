import { getTursoClient } from "./turso";

export interface TursoUser {
  id: string;
  email: string;
  full_name: string;
  role: "admin" | "guru" | "student";
  status: "active" | "suspended" | "pending";
  grade?: number | null;
  phone_number?: string | null;
  school_name?: string | null;
  avatar_url?: string | null;
  notes?: string | null;
  created_at?: string;
  updated_at?: string;
}

export const ADMIN_EMAIL = "admin@continuum.lms";

const AUTH_STORAGE_KEY = "turso_lms_user";
const AUTH_SESSION_KEY = "turso_lms_session";

// SHA-256 hash helper using Web Crypto API (browser & Node compatible)
export async function hashPassword(password: string): Promise<string> {
  try {
    if (typeof crypto !== "undefined" && crypto.subtle) {
      const msgBuffer = new TextEncoder().encode(password);
      const hashBuffer = await crypto.subtle.digest("SHA-256", msgBuffer);
      const hashArray = Array.from(new Uint8Array(hashBuffer));
      return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
    }
  } catch {
    // fallback
  }
  return password;
}

export async function verifyPassword(inputPassword: string, storedHash: string): Promise<boolean> {
  if (!storedHash) return false;
  if (inputPassword === storedHash) return true;
  const hashedInput = await hashPassword(inputPassword);
  return hashedInput === storedHash;
}

/**
 * Ensures admin account exists in Turso
 */
export async function tursoBootstrapAdmin() {
  const db = getTursoClient();
  try {
    const res = await db.execute({
      sql: "SELECT id FROM users WHERE LOWER(email) = LOWER(?) LIMIT 1;",
      args: [ADMIN_EMAIL],
    });

    if (res.rows.length === 0) {
      const adminId = "admin-root-001";
      const hashedPassword = await hashPassword("bissmillah");

      await db.execute({
        sql: `INSERT OR REPLACE INTO users (id, email, password_hash, full_name, role, status)
              VALUES (?, ?, ?, ?, 'admin', 'active');`,
        args: [adminId, ADMIN_EMAIL, hashedPassword, "Administrator"],
      });

      await db.execute({
        sql: `INSERT OR REPLACE INTO profiles (id, display_name, email, status)
              VALUES (?, ?, ?, 'active');`,
        args: [adminId, "Administrator", ADMIN_EMAIL],
      });
    }
  } catch (e) {
    console.warn("[Turso Auth] Bootstrap admin non-fatal:", e);
  }
}

/**
 * Authenticate user directly against Turso Database
 */
export async function tursoLogin(
  emailOrUsername: string,
  password: string
): Promise<{ success: boolean; user?: TursoUser; error?: string }> {
  const db = getTursoClient();
  const raw = emailOrUsername.trim();
  const isSpecialAdmin = raw.toLowerCase() === "admin";
  const targetEmail = isSpecialAdmin ? ADMIN_EMAIL : raw.toLowerCase();

  try {
    await tursoBootstrapAdmin();

    const res = await db.execute({
      sql: `SELECT id, email, password_hash, full_name, role, status, phone_number, avatar_url
            FROM users 
            WHERE LOWER(email) = LOWER(?) OR id = ?
            LIMIT 1;`,
      args: [targetEmail, raw],
    });

    if (res.rows.length === 0) {
      // Also check profiles table if user was created earlier
      const profRes = await db.execute({
        sql: `SELECT id, email, display_name, status, phone, grade, school, notes
              FROM profiles
              WHERE LOWER(email) = LOWER(?)
              LIMIT 1;`,
        args: [targetEmail],
      });

      if (profRes.rows.length > 0) {
        const prof = profRes.rows[0];
        const hashedPassword = await hashPassword(password);
        await db.execute({
          sql: `INSERT OR REPLACE INTO users (id, email, password_hash, full_name, role, status)
                VALUES (?, ?, ?, ?, 'student', 'active');`,
          args: [
            String(prof.id),
            String(prof.email || targetEmail),
            hashedPassword,
            String(prof.display_name || "Siswa"),
          ],
        });

        const user: TursoUser = {
          id: String(prof.id),
          email: String(prof.email || targetEmail),
          full_name: String(prof.display_name || "Siswa"),
          role: "student",
          status: "active",
          grade: prof.grade ? Number(prof.grade) : null,
          phone_number: prof.phone ? String(prof.phone) : null,
          school_name: prof.school ? String(prof.school) : null,
          notes: prof.notes ? String(prof.notes) : null,
        };

        saveTursoSession(user);
        return { success: true, user };
      }

      return { success: false, error: "Email atau kata sandi salah" };
    }

    const row = res.rows[0];
    const storedHash = String(row.password_hash || "");
    const isValid = await verifyPassword(password, storedHash);

    if (!isValid) {
      return { success: false, error: "Email atau kata sandi salah" };
    }

    // Get additional profile details
    const profRes = await db.execute({
      sql: "SELECT grade, school, notes FROM profiles WHERE id = ? LIMIT 1;",
      args: [String(row.id)],
    });
    const prof = profRes.rows[0];

    const user: TursoUser = {
      id: String(row.id),
      email: String(row.email),
      full_name: String(row.full_name),
      role: (String(row.role) as any) || "student",
      status: (String(row.status) as any) || "active",
      grade: prof?.grade ? Number(prof.grade) : null,
      phone_number: row.phone_number ? String(row.phone_number) : null,
      avatar_url: row.avatar_url ? String(row.avatar_url) : null,
      school_name: prof?.school ? String(prof.school) : null,
      notes: prof?.notes ? String(prof.notes) : null,
    };

    saveTursoSession(user);
    return { success: true, user };
  } catch (error: any) {
    console.error("[Turso Auth] Login error:", error);
    return { success: false, error: error.message || "Gagal masuk ke sistem database" };
  }
}

/**
 * Register a new student account directly in Turso
 */
export async function tursoRegister(
  fullName: string,
  email: string,
  password: string,
  grade = 7
): Promise<{ success: boolean; user?: TursoUser; error?: string }> {
  const db = getTursoClient();
  const cleanEmail = email.trim().toLowerCase();
  const cleanName = fullName.trim();

  try {
    const existing = await db.execute({
      sql: "SELECT id FROM users WHERE LOWER(email) = LOWER(?) LIMIT 1;",
      args: [cleanEmail],
    });

    if (existing.rows.length > 0) {
      return { success: false, error: "Email sudah terdaftar. Silakan masuk." };
    }

    const userId = `usr_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
    const hashedPassword = await hashPassword(password);

    await db.batch([
      {
        sql: `INSERT INTO users (id, email, password_hash, full_name, role, status)
              VALUES (?, ?, ?, ?, 'student', 'active');`,
        args: [userId, cleanEmail, hashedPassword, cleanName],
      },
      {
        sql: `INSERT INTO profiles (id, display_name, email, grade, status)
              VALUES (?, ?, ?, ?, 'active');`,
        args: [userId, cleanName, cleanEmail, grade],
      },
      {
        sql: `INSERT OR REPLACE INTO user_roles (user_id, role) VALUES (?, 'student');`,
        args: [userId],
      },
    ], "write");

    const user: TursoUser = {
      id: userId,
      email: cleanEmail,
      full_name: cleanName,
      role: "student",
      status: "active",
      grade,
    };

    saveTursoSession(user);
    return { success: true, user };
  } catch (error: any) {
    console.error("[Turso Auth] Register error:", error);
    return { success: false, error: error.message || "Gagal mendaftarkan akun" };
  }
}

/**
 * Update user password in Turso
 */
export async function tursoUpdatePassword(userId: string, newPassword: string): Promise<boolean> {
  const db = getTursoClient();
  try {
    const hashedPassword = await hashPassword(newPassword);
    await db.execute({
      sql: "UPDATE users SET password_hash = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?;",
      args: [hashedPassword, userId],
    });
    return true;
  } catch (error) {
    console.error("[Turso Auth] Update password error:", error);
    return false;
  }
}

/**
 * Admin: Create student/teacher account in Turso
 */
export async function tursoAdminCreateUser(data: {
  fullName: string;
  email: string;
  password: string;
  role?: "student" | "guru" | "admin";
  grade?: number | null;
  phone?: string | null;
  school?: string | null;
  notes?: string | null;
}): Promise<{ success: boolean; userId?: string; error?: string }> {
  const db = getTursoClient();
  const cleanEmail = data.email.trim().toLowerCase();
  const role = data.role || "student";
  const userId = `usr_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;

  try {
    const hashedPassword = await hashPassword(data.password);

    await db.batch([
      {
        sql: `INSERT INTO users (id, email, password_hash, full_name, role, status, phone_number)
              VALUES (?, ?, ?, ?, ?, 'active', ?);`,
        args: [userId, cleanEmail, hashedPassword, data.fullName.trim(), role, data.phone || null],
      },
      {
        sql: `INSERT INTO profiles (id, display_name, email, grade, phone, school, notes, status)
              VALUES (?, ?, ?, ?, ?, ?, ?, 'active');`,
        args: [
          userId,
          data.fullName.trim(),
          cleanEmail,
          data.grade ?? null,
          data.phone ?? null,
          data.school ?? null,
          data.notes ?? null,
        ],
      },
      {
        sql: `INSERT OR REPLACE INTO user_roles (user_id, role) VALUES (?, ?);`,
        args: [userId, role],
      },
    ], "write");

    return { success: true, userId };
  } catch (error: any) {
    console.error("[Turso Auth] Admin create user error:", error);
    return { success: false, error: error.message || "Gagal membuat akun siswa di Turso" };
  }
}

/**
 * Admin: Update user profile, credentials, and role in Turso
 */
export async function tursoAdminUpdateUser(
  userId: string,
  data: {
    fullName?: string;
    email?: string;
    password?: string;
    role?: "student" | "guru" | "admin";
    grade?: number | null;
    phone?: string | null;
    school?: string | null;
    notes?: string | null;
    status?: string;
  }
): Promise<{ success: boolean; error?: string }> {
  const db = getTursoClient();
  try {
    const queries: Array<{ sql: string; args: any[] }> = [];

    // 1. Update profiles table
    queries.push({
      sql: `UPDATE profiles 
            SET display_name = COALESCE(?, display_name),
                email = COALESCE(?, email),
                grade = ?,
                phone = ?,
                school = ?,
                notes = ?,
                status = COALESCE(?, status)
            WHERE id = ?;`,
      args: [
        data.fullName?.trim() ?? null,
        data.email?.trim().toLowerCase() ?? null,
        data.grade ?? null,
        data.phone?.trim() ?? null,
        data.school?.trim() ?? null,
        data.notes?.trim() ?? null,
        data.status ?? null,
        userId,
      ],
    });

    // 2. Update users table
    if (data.password && data.password.trim().length >= 6) {
      const hashedPassword = await hashPassword(data.password.trim());
      queries.push({
        sql: `UPDATE users 
              SET password_hash = ?,
                  email = COALESCE(?, email),
                  full_name = COALESCE(?, full_name),
                  role = COALESCE(?, role),
                  status = COALESCE(?, status),
                  phone_number = ?,
                  updated_at = CURRENT_TIMESTAMP
              WHERE id = ?;`,
        args: [
          hashedPassword,
          data.email?.trim().toLowerCase() ?? null,
          data.fullName?.trim() ?? null,
          data.role ?? null,
          data.status ?? null,
          data.phone?.trim() ?? null,
          userId,
        ],
      });
    } else {
      queries.push({
        sql: `UPDATE users 
              SET email = COALESCE(?, email),
                  full_name = COALESCE(?, full_name),
                  role = COALESCE(?, role),
                  status = COALESCE(?, status),
                  phone_number = ?,
                  updated_at = CURRENT_TIMESTAMP
              WHERE id = ?;`,
        args: [
          data.email?.trim().toLowerCase() ?? null,
          data.fullName?.trim() ?? null,
          data.role ?? null,
          data.status ?? null,
          data.phone?.trim() ?? null,
          userId,
        ],
      });
    }

    // 3. Update user_roles
    if (data.role) {
      queries.push({
        sql: "DELETE FROM user_roles WHERE user_id = ?;",
        args: [userId],
      });
      queries.push({
        sql: "INSERT INTO user_roles (user_id, role) VALUES (?, ?);",
        args: [userId, data.role],
      });
    }

    await db.batch(queries, "write");
    return { success: true };
  } catch (error: any) {
    console.error("[Turso Auth] Admin update user error:", error);
    return { success: false, error: error.message || "Gagal memperbarui data pengguna di Turso" };
  }
}

/**
 * Admin: Delete user from Turso
 */
export async function tursoAdminDeleteUser(userId: string): Promise<{ success: boolean; error?: string }> {
  const db = getTursoClient();
  try {
    await db.batch([
      { sql: "DELETE FROM enrollments WHERE user_id = ?;", args: [userId] },
      { sql: "DELETE FROM module_progress WHERE user_id = ?;", args: [userId] },
      { sql: "DELETE FROM quiz_attempts WHERE user_id = ?;", args: [userId] },
      { sql: "DELETE FROM assignment_submissions WHERE user_id = ?;", args: [userId] },
      { sql: "DELETE FROM certificates WHERE user_id = ?;", args: [userId] },
      { sql: "DELETE FROM student_notes WHERE user_id = ?;", args: [userId] },
      { sql: "DELETE FROM user_roles WHERE user_id = ?;", args: [userId] },
      { sql: "DELETE FROM profiles WHERE id = ?;", args: [userId] },
      { sql: "DELETE FROM users WHERE id = ?;", args: [userId] },
    ], "write");
    return { success: true };
  } catch (error: any) {
    console.error("[Turso Auth] Admin delete user error:", error);
    return { success: false, error: error.message || "Gagal menghapus akun siswa dari Turso" };
  }
}

/**
 * Session Helpers (Local state synchronization)
 */
export function saveTursoSession(user: TursoUser) {
  if (typeof window !== "undefined") {
    localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(user));
    localStorage.setItem(AUTH_SESSION_KEY, `session_${user.id}_${Date.now()}`);
    window.dispatchEvent(new Event("turso-auth-change"));
  }
}

export function getTursoCurrentSession(): TursoUser | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(AUTH_STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

export function tursoLogout() {
  if (typeof window !== "undefined") {
    localStorage.removeItem(AUTH_STORAGE_KEY);
    localStorage.removeItem(AUTH_SESSION_KEY);
    window.dispatchEvent(new Event("turso-auth-change"));
  }
}
