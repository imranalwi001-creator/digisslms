import { useEffect, useState } from "react";

export type AppRole = "admin" | "guru" | "student";

/** Reads the current user's role from the database (RLS-protected). */
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
    setIsLoading(true);
    import("@/integrations/supabase/client").then(async ({ supabase }) => {
      const { data } = await (supabase as any)
        .from("user_roles")
        .select("role")
        .eq("user_id", userId);
      if (!active) return;
      const roles: string[] = (data || []).map((r: any) => r.role);
      setRole(roles.includes("admin") ? "admin" : roles.includes("guru") ? "guru" : "student");
      setIsLoading(false);
    });
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
