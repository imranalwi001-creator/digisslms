import { useState, useEffect, useCallback } from "react";
import { getTursoCurrentSession, tursoLogout, type TursoUser } from "@/lib/turso-auth";

export interface AuthState {
  user: any | null;
  session: any | null;
  isLoading: boolean;
  signOut: () => Promise<void>;
}

export function useAuth(): AuthState {
  const [user, setUser] = useState<any | null>(null);
  const [session, setSession] = useState<any | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const checkAuth = useCallback(() => {
    const tursoUser = getTursoCurrentSession();
    if (tursoUser) {
      const authUser = {
        id: tursoUser.id,
        email: tursoUser.email,
        user_metadata: {
          full_name: tursoUser.full_name,
          grade: tursoUser.grade ?? null,
          phone: tursoUser.phone_number ?? null,
          school: tursoUser.school_name ?? null,
        },
      };
      setUser(authUser);
      setSession({
        user: authUser,
        access_token: `turso_${tursoUser.id}`,
      });
      setIsLoading(false);
      return true;
    }
    return false;
  }, []);

  useEffect(() => {
    // 1. First check Turso native session
    const hasTurso = checkAuth();

    // 2. Listen to custom auth events
    const handleAuthChange = () => {
      const found = checkAuth();
      if (!found) {
        setUser(null);
        setSession(null);
        setIsLoading(false);
      }
    };

    if (typeof window !== "undefined") {
      window.addEventListener("turso-auth-change", handleAuthChange);
      window.addEventListener("storage", handleAuthChange);
    }

    // 3. Fallback: Supabase check if Turso session wasn't found
    if (!hasTurso) {
      import("@/integrations/supabase/client")
        .then(({ supabase }) => {
          supabase.auth.getSession().then(({ data: { session } }) => {
            if (session?.user && !getTursoCurrentSession()) {
              setSession(session);
              setUser(session.user);
            }
            setIsLoading(false);
          }).catch(() => {
            setIsLoading(false);
          });
        })
        .catch(() => {
          setIsLoading(false);
        });
    }

    return () => {
      if (typeof window !== "undefined") {
        window.removeEventListener("turso-auth-change", handleAuthChange);
        window.removeEventListener("storage", handleAuthChange);
      }
    };
  }, [checkAuth]);

  const signOut = useCallback(async () => {
    tursoLogout();
    try {
      const { supabase } = await import("@/integrations/supabase/client");
      await supabase.auth.signOut();
    } catch {
      // ignore
    }
    setUser(null);
    setSession(null);
  }, []);

  return { user, session, isLoading, signOut };
}
