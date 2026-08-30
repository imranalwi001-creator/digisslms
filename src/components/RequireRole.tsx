import { useCallback, useEffect, useState, type ReactNode } from "react";
import { useNavigate, Link } from "@tanstack/react-router";
import { Loader2, ShieldAlert, GraduationCap } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/hooks/use-auth";
import { useRole } from "@/hooks/use-role";
import { ensureProfile } from "@/lib/lms";
import { fetchMyProfile, setMyGrade, type StudentProfile } from "@/lib/profile";
import { Button } from "@/components/ui/button";

export function RequireRole({
  role,
  children,
}: {
  /** "staff" allows both admin and guru. */
  role: "admin" | "guru" | "staff" | "student";
  children: (ctx: {
    userId: string;
    role: "admin" | "guru" | "student";
    grade: number | null;
    profile: StudentProfile | null;
    reloadProfile: () => Promise<void>;
  }) => ReactNode;
}) {
  const { user, isLoading: authLoading } = useAuth();
  const { role: userRole, isLoading: roleLoading } = useRole(user?.id);
  const navigate = useNavigate();
  const [profile, setProfile] = useState<StudentProfile | null>(null);
  const [profileLoading, setProfileLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const loadProfile = useCallback(async () => {
    if (!user) return;
    try {
      await ensureProfile();
      setProfile(await fetchMyProfile(user.id));
    } catch {
      /* ignore */
    } finally {
      setProfileLoading(false);
    }
  }, [user]);

  useEffect(() => {
    if (user) loadProfile();
  }, [user, loadProfile]);

  useEffect(() => {
    if (!authLoading && !user) navigate({ to: "/login" });
  }, [authLoading, user, navigate]);

  if (authLoading || roleLoading || profileLoading || !user) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-muted/30">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }

  const isStaff = userRole === "admin" || userRole === "guru";
  const denied =
    (role === "admin" && userRole !== "admin") ||
    (role === "guru" && userRole !== "guru" && userRole !== "admin") ||
    (role === "staff" && !isStaff);

  if (denied) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-muted/30 px-6 text-center">
        <ShieldAlert className="h-10 w-10 text-primary" />
        <div>
          <h1 className="text-xl font-semibold tracking-tight">
            {role === "admin" ? "Akses khusus admin" : "Akses khusus pengajar"}
          </h1>
          <p className="mt-1 max-w-sm text-sm text-muted-foreground">
            {role === "admin"
              ? "Akun ini belum memiliki peran administrator. Hubungi pengelola untuk mendapatkan akses."
              : "Akun ini belum memiliki peran guru atau admin. Hubungi pengelola untuk mendapatkan akses."}
          </p>
        </div>
        <Button asChild>
          <Link to="/dashboard">Ke dashboard siswa</Link>
        </Button>
      </div>
    );
  }

  const needsGrade = !isStaff && !profile?.grade;

  if (needsGrade) {
    const choose = async (grade: 7 | 8 | 9) => {
      setSaving(true);
      try {
        await setMyGrade(user.id, grade);
        await loadProfile();
        toast.success(`Kelas ${grade} tersimpan. Selamat belajar!`);
      } catch (err: any) {
        toast.error(err.message || "Gagal menyimpan kelas");
      } finally {
        setSaving(false);
      }
    };

    return (
      <div className="flex min-h-screen items-center justify-center bg-muted/30 px-5">
        <div className="w-full max-w-md rounded-2xl border border-border/60 bg-background p-8 text-center shadow-sm">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
            <GraduationCap className="h-6 w-6 text-primary" />
          </div>
          <h1 className="mt-4 text-xl font-semibold tracking-tight">Pilih kelasmu</h1>
          <p className="mt-1.5 text-sm text-muted-foreground">
            Materi belajar disesuaikan dengan tingkat kelas. Pilihan ini hanya bisa diubah oleh guru/admin.
          </p>
          <div className="mt-6 grid grid-cols-3 gap-3">
            {[7, 8, 9].map((g) => (
              <button
                key={g}
                disabled={saving}
                onClick={() => choose(g as 7 | 8 | 9)}
                className="rounded-xl border border-border bg-background py-6 text-lg font-semibold transition-all hover:border-primary hover:bg-primary/5 active:scale-[0.98] disabled:opacity-50"
              >
                Kelas {g}
              </button>
            ))}
          </div>
          {saving && <Loader2 className="mx-auto mt-5 h-5 w-5 animate-spin text-primary" />}
        </div>
      </div>
    );
  }

  return (
    <>
      {children({
        userId: user.id,
        role: userRole ?? "student",
        grade: profile?.grade ?? null,
        profile,
        reloadProfile: loadProfile,
      })}
    </>
  );
}
