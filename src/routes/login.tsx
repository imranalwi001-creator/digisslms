import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { Infinity as InfinityIcon, Mail, Lock, Eye, EyeOff, User } from "lucide-react";
import digisschoolLogo from "@/assets/digisschool-logo.png";
import { z } from "zod";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import shadowBg from "@/assets/shadow-bg.jpg";

const ADMIN_EMAIL = "admin@continuum.lms";

const inputClass =
  "w-full rounded-xl border border-input bg-background pl-11 pr-4 py-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent transition-all duration-200";
const errClass = "mt-1.5 text-xs text-destructive";

const signUpSchema = z
  .object({
    fullName: z.string().trim().min(3, "Nama lengkap minimal 3 karakter").max(100, "Nama terlalu panjang"),
    email: z.string().trim().email("Format email tidak valid").max(255),
    password: z.string().min(6, "Kata sandi minimal 6 karakter").max(72),
    confirmPassword: z.string(),
  })
  .refine((v) => v.password === v.confirmPassword, {
    message: "Konfirmasi kata sandi tidak sama",
    path: ["confirmPassword"],
  });


async function getSupabase() {
  const { supabase } = await import("@/integrations/supabase/client");
  return supabase;
}

export const Route = createFileRoute("/login")({
  head: () => ({
    meta: [
      { title: "Masuk & Daftar Kelas Digital — Continuum LMS" },
      {
        name: "description",
        content:
          "Masuk atau daftar akun Continuum LMS untuk siswa SMP kelas 7-9: akses materi Kelas Digital, kuis, tugas, dan sertifikat.",
      },
      { property: "og:title", content: "Masuk & Daftar Kelas Digital — Continuum LMS" },
      {
        property: "og:description",
        content: "Buat akun siswa dan mulai belajar Kelas Digital SMP kelas 7-9 di Continuum LMS.",
      },
      { property: "og:type", content: "website" },
      { property: "og:url", content: "https://ruangblajar.lovable.app/login" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
    links: [{ rel: "canonical", href: "https://ruangblajar.lovable.app/login" }],
  }),
  component: LoginPage,
});

function LoginPage() {
  const navigate = useNavigate();
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [fullName, setFullName] = useState("");
  const [grade, setGrade] = useState<string>("7");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleGoogleSignIn = async () => {
    setGoogleLoading(true);
    try {
      const { lovable } = await import("@/integrations/lovable/index");
      const result = await lovable.auth.signInWithOAuth("google", {
        redirect_uri: `${window.location.origin}/dashboard`,
      });
      if (result.error) {
        toast.error(result.error instanceof Error ? result.error.message : "Gagal masuk dengan Google");
      } else if (!result.redirected) {
        navigate({ to: "/dashboard" });
      }
    } catch (err: any) {
      toast.error(err.message || "Gagal masuk dengan Google");
    } finally {
      setGoogleLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});

    const raw = email.trim();
    const isAdminLogin = raw.toLowerCase() === "admin";
    const identifier = isAdminLogin ? ADMIN_EMAIL : raw;

    if (isSignUp) {
      const result = signUpSchema.safeParse({
        fullName: fullName.trim(),
        email: raw,
        password,
        confirmPassword,
      });
      if (!result.success) {
        const fieldErrors: Record<string, string> = {};
        for (const issue of result.error.issues) {
          const key = String(issue.path[0] ?? "form");
          if (!fieldErrors[key]) fieldErrors[key] = issue.message;
        }
        setErrors(fieldErrors);
        return;
      }
    } else if (!raw || !password.trim()) {
      setErrors({ form: "Isi email/username dan kata sandi" });
      return;
    }

    setLoading(true);
    try {
      const { tursoLogin, tursoRegister } = await import("@/lib/turso-auth");

      if (isSignUp) {
        const res = await tursoRegister(fullName.trim(), identifier, password, Number(grade));
        if (!res.success || !res.user) {
          throw new Error(res.error || "Gagal membuat akun");
        }
        toast.success("Akun berhasil dibuat. Selamat datang di Digisschool LMS!");
        navigate({ to: "/dashboard" });
      } else {
        const res = await tursoLogin(identifier, password);
        if (!res.success || !res.user) {
          throw new Error(res.error || "Email atau kata sandi salah");
        }
        toast.success(`Selamat datang kembali, ${res.user.full_name}!`);
        const isStaff = res.user.role === "admin" || res.user.role === "guru" || isAdminLogin;
        navigate({ to: isStaff ? "/admin" : "/dashboard" });
      }
    } catch (err: any) {
      toast.error(err.message || "Gagal masuk");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-5 relative bg-white">
      {/* Shadow background */}
      <div className="absolute inset-0 pointer-events-none" style={{ backgroundImage: `url(${shadowBg})`, backgroundSize: 'cover', backgroundPosition: 'center', backgroundAttachment: 'fixed', opacity: 0.75 }} />

      <div className="max-w-sm w-full animate-fade-up-blur relative z-10">
        {/* Logo — links home */}
        <Link to="/" className="flex items-center justify-center gap-3 mb-8 hover:opacity-85 transition-opacity">
          <img src={digisschoolLogo} alt="Digisschool Logo" className="w-10 h-10 object-contain shrink-0 drop-shadow-xs" />
          <div className="text-left">
            <span className="text-xl font-bold text-foreground tracking-tight block">Digisschool</span>
            <span className="text-[10px] font-mono text-muted-foreground uppercase tracking-widest block -mt-1">Digital Islamic School</span>
          </div>
        </Link>

        {/* Card */}
        <div className="bg-white rounded-2xl shadow-xl shadow-black/[0.06] border border-border/50 p-8">
          <div className="text-center mb-8">
            <h1 className="text-2xl font-semibold text-foreground tracking-tight" style={{ lineHeight: "1.2" }}>
              {isSignUp ? "Buat akun Anda" : "Selamat datang kembali"}
            </h1>
            <p className="text-sm text-muted-foreground mt-1.5">
              {isSignUp ? "Mulai perjalanan belajar Anda" : "Lanjutkan belajar hari ini"}
            </p>
          </div>

        {/* Google OAuth */}
        <button
          onClick={handleGoogleSignIn}
          disabled={googleLoading}
          className="w-full flex items-center justify-center gap-3 rounded-xl border border-input bg-background py-3.5 text-sm font-medium text-foreground hover:bg-accent transition-all duration-200 active:scale-[0.98] disabled:opacity-40 disabled:pointer-events-none"
        >
          <svg className="w-4 h-4" viewBox="0 0 24 24">
            <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4" />
            <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
            <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
            <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
          </svg>
          {googleLoading ? "Mohon tunggu..." : "Lanjutkan dengan Google"}
        </button>

        {/* Divider */}
        <div className="flex items-center gap-3 my-5">
          <div className="flex-1 h-px bg-border" />
          <span className="text-xs text-muted-foreground">atau</span>
          <div className="flex-1 h-px bg-border" />
        </div>

        <form onSubmit={handleSubmit} className="space-y-3">
          {isSignUp && (
            <>
              <div>
                <div className="relative">
                  <User className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <input
                    type="text"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="Nama lengkap"
                    className={inputClass}
                  />
                </div>
                {errors["fullName"] && <p className={errClass}>{errors["fullName"]}</p>}
              </div>

              <Select value={grade} onValueChange={setGrade}>
                <SelectTrigger className="rounded-xl py-6 text-sm">
                  <SelectValue placeholder="Kelas" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="7">Kelas 7</SelectItem>
                  <SelectItem value="8">Kelas 8</SelectItem>
                  <SelectItem value="9">Kelas 9</SelectItem>
                </SelectContent>
              </Select>

            </>
          )}

          <div>
            <div className="relative">
              <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <input
                type="text"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder={isSignUp ? "Email aktif" : "Email atau username"}
                className={inputClass}
              />
            </div>
            {errors["email"] && <p className={errClass}>{errors["email"]}</p>}
          </div>

          <div>
            <div className="relative">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <input
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Kata sandi"
                className={`${inputClass} pr-11`}
                minLength={6}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            {errors["password"] && <p className={errClass}>{errors["password"]}</p>}
          </div>

          {isSignUp && (
            <div>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <input
                  type={showPassword ? "text" : "password"}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Ulangi kata sandi"
                  className={inputClass}
                />
              </div>
              {errors["confirmPassword"] && <p className={errClass}>{errors["confirmPassword"]}</p>}
            </div>
          )}

          {errors["form"] && <p className={errClass}>{errors["form"]}</p>}

          {isSignUp && (
            <>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Dengan mendaftar, Anda setuju data belajar disimpan untuk memantau progres di Continuum LMS.
              </p>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Pendaftaran ini khusus siswa. <span className="font-medium text-foreground">Guru</span> tidak
                mendaftar sendiri — akun guru dibuat oleh administrator sekolah. Silakan hubungi admin untuk
                mendapatkan email dan kata sandi.
              </p>
            </>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-xl bg-[#FDAA3E] text-[#1a1a1a] py-3.5 text-sm font-bold hover:bg-[#fdb95e] transition-all duration-200 active:scale-[0.98] disabled:opacity-40 disabled:pointer-events-none shadow-lg shadow-[#FDAA3E]/20"
          >
            {loading ? "Mohon tunggu..." : isSignUp ? "Daftar sekarang" : "Masuk"}
          </button>
        </form>


        </div>

        <p className="text-center text-sm text-muted-foreground mt-6">
          {isSignUp ? "Sudah punya akun?" : "Belum punya akun?"}{" "}
          <button
            onClick={() => setIsSignUp(!isSignUp)}
            className="text-primary font-medium hover:underline"
          >
            {isSignUp ? "Masuk" : "Daftar"}
          </button>
        </p>
      </div>
    </div>
  );
}
