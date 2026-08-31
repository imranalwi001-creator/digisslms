import { useEffect, useState } from "react";
import { getTursoCurrentSession } from "@/lib/turso-auth";
import { getTursoClient } from "@/lib/turso";

export type AppRole = "admin" | "guru" | "student";

/** Reads the current user's role from Turso session or database. */
export function useRole(userId: string | undefined) {
  const [role, setRole] = useState<AppRole | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let active = true;
    if (!userId) {
      setRole(null);
      setIsLoading(false);
      return;
    }

    // 1. First check Turso current session
    const tursoUser = getTursoCurrentSession();
    if (tursoUser && tursoUser.id === userId) {
      setRole(tursoUser.role);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);

    // 2. Query Turso database directly
    const loadRole = async () => {
      try {
        const db = getTursoClient();
        const res = await db.execute({
          sql: `SELECT role FROM users WHERE id = ? 
                UNION 
                SELECT role FROM user_roles WHERE user_id = ? 
                LIMIT 1;`,
          args: [userId, userId],
        });

        if (!active) return;
        if (res.rows.length > 0) {
          const rawRole = String(res.rows[0].role || "").toLowerCase();
          setRole(rawRole === "admin" ? "admin" : rawRole === "guru" || rawRole === "instructor" ? "guru" : "student");
        } else {
          setRole("student");
        }
      } catch (err) {
        if (active) setRole("student");
      } finally {
        if (active) setIsLoading(false);
      }
    };

    loadRole();

    return () => {
      active = false;
    };
  }, [userId]);

  return {
    role,
    isAdmin: role === "admin",
    isStaff: role === "admin" || role === "guru",
    isLoading,
  };
}

export const roleLabel = (role: AppRole | null) =>
  role === "admin" ? "Administrator" : role === "guru" ? "Guru" : "Siswa";
