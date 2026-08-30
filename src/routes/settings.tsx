import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useState, useRef, useEffect } from "react";
import {
  Sun,
  Moon,
  Monitor,
  Trash2,
  Download,
  Upload,
  ChevronRight,
  Bell,
  BellOff,
  LogIn,
  LogOut,
  Trophy,
  EyeOff,
  ShieldCheck,
  User,
  Sliders,
  Sparkles,
} from "lucide-react";
import { useTheme } from "@/hooks/use-theme";
import { getHabits, getLogs, saveHabits, saveLogs } from "@/lib/habits";
import { DashboardShell } from "@/components/DashboardShell";
import { RequireRole } from "@/components/RequireRole";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import {
  isNotificationSupported,
  getNotificationPermission,
  requestNotificationPermission,
  rescheduleAllReminders,
} from "@/lib/notifications";
import { useAuth } from "@/hooks/use-auth";
import { fetchMyProfile, setLeaderboardOptOut } from "@/lib/profile";

export const Route = createFileRoute("/settings")({
  component: () => (
    <RequireRole role="student">
      {() => <SettingsPage />}
    </RequireRole>
  ),
  head: () => ({
    meta: [
      { title: "Pengaturan Akun — Digisschool" },
      { name: "description", content: "Sesuaikan pengalaman belajar dan preferensi akun Anda di Digisschool." },
    ],
  }),
});

function SettingsPage() {
  const { theme, setTheme } = useTheme();
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const [confirmClear, setConfirmClear] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [notifPermission, setNotifPermission] = useState(getNotificationPermission());
  const [optOut, setOptOut] = useState(false);
  const [privacyBusy, setPrivacyBusy] = useState(false);

  useEffect(() => {
    if (!user?.id) return;
    fetchMyProfile(user.id)
      .then((p) => setOptOut(!!p?.leaderboardOptOut))
      .catch(() => {});
  }, [user?.id]);

  const togglePrivacy = async () => {
    if (!user?.id) return;
    const next = !optOut;
    setPrivacyBusy(true);
    try {
      await setLeaderboardOptOut(user.id, next);
      setOptOut(next);
      toast.success(next ? "Profil disembunyikan dari papan peringkat" : "Profil tampil di papan peringkat");
    } catch (err: any) {
      toast.error(err.message || "Gagal menyimpan preferensi");
    } finally {
      setPrivacyBusy(false);
    }
  };

  const handleExport = () => {
    const data = {
      habits: getHabits(),
      logs: getLogs(),
      exportedAt: new Date().toISOString(),
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `digisschool-backup-${new Date().toISOString().split("T")[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success("Data belajar berhasil diekspor");
  };

  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      try {
        const data = JSON.parse(ev.target?.result as string);
        if (data.habits && Array.isArray(data.habits)) {
          saveHabits(data.habits);
        }
        if (data.logs && Array.isArray(data.logs)) {
          saveLogs(data.logs);
        }
        toast.success("Data belajar berhasil diimpor");
      } catch {
        toast.error("File cadangan tidak valid");
      }
    };
    reader.readAsText(file);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleClear = () => {
    if (!confirmClear) {
      setConfirmClear(true);
      toast.warning("Klik sekali lagi untuk konfirmasi reset data", { duration: 3000 });
      return;
    }
    saveHabits([]);
    saveLogs([]);
    setConfirmClear(false);
    toast.success("Semua data lokal berhasil dibersihkan");
  };

  const handleNotificationToggle = async () => {
    if (notifPermission === "granted") {
      toast("Untuk mematikan notifikasi, silakan ubah lewat pengaturan browser Anda");
      return;
    }
    const result = await requestNotificationPermission();
    setNotifPermission(result);
    if (result === "granted") {
      toast.success("Notifikasi berhasil diaktifkan");
      rescheduleAllReminders(getHabits());
    } else if (result === "denied") {
      toast.error("Notifikasi diblokir oleh browser");
    }
  };

  const handleSignOut = async () => {
    await signOut();
    navigate({ to: "/login" });
    toast.success("Berhasil keluar dari akun");
  };

  const themeOptions = [
    { value: "light" as const, icon: Sun, label: "Terang" },
    { value: "dark" as const, icon: Moon, label: "Gelap" },
    { value: "system" as const, icon: Monitor, label: "Otomatis" },
  ];

  return (
    <DashboardShell
      role="student"
      title="Pengaturan Akun"
      subtitle="Kelola preferensi akun santri, tema tampilan, notifikasi belajar, dan privasi Digisschool."
    >
      <div className="max-w-3xl space-y-6">
        {/* Account Info */}
        <section className="space-y-2">
          <h2 className="text-xs font-bold text-muted-foreground uppercase tracking-wider font-mono">
            Informasi Akun
          </h2>
          <div className="rounded-3xl border border-border/80 bg-card p-5 shadow-xs">
            {user ? (
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-center gap-3.5">
                  <div className="w-12 h-12 rounded-2xl bg-primary/10 text-primary flex items-center justify-center font-bold">
                    <User className="w-6 h-6" />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-foreground">{user.email}</p>
                    <p className="text-xs font-mono text-muted-foreground mt-0.5 flex items-center gap-1.5 text-success">
                      <span className="w-2 h-2 rounded-full bg-success inline-block" />
                      Tersinkronisasi ke Cloud Digisschool
                    </p>
                  </div>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleSignOut}
                  className="rounded-xl text-xs gap-1.5 font-bold hover:bg-destructive/10 hover:text-destructive hover:border-destructive/30"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  Keluar Akun
                </Button>
              </div>
            ) : (
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-bold text-foreground">Belum Masuk</p>
                  <p className="text-xs text-muted-foreground">Masuk untuk menyinkronkan progres belajar Anda.</p>
                </div>
                <Button size="sm" onClick={() => navigate({ to: "/login" })} className="rounded-xl font-bold text-xs">
                  Masuk Sekarang
                </Button>
              </div>
            )}
          </div>
        </section>

        {/* Theme & Appearance */}
        <section className="space-y-2">
          <h2 className="text-xs font-bold text-muted-foreground uppercase tracking-wider font-mono">
            Tema & Tampilan
          </h2>
          <div className="rounded-3xl border border-border/80 bg-card p-2 shadow-xs grid grid-cols-3 gap-2">
            {themeOptions.map(({ value, icon: Icon, label }) => (
              <button
                key={value}
                onClick={() => setTheme(value)}
                className={`flex items-center justify-center gap-2 py-3 rounded-2xl text-xs font-bold transition-all cursor-pointer ${
                  theme === value
                    ? "bg-primary text-primary-foreground shadow-sm"
                    : "bg-transparent text-muted-foreground hover:text-foreground hover:bg-secondary/60"
                }`}
              >
                <Icon className="w-4 h-4" />
                <span>{label}</span>
              </button>
            ))}
          </div>
        </section>

        {/* Notifications */}
        <section className="space-y-2">
          <h2 className="text-xs font-bold text-muted-foreground uppercase tracking-wider font-mono">
            Pusat Notifikasi Belajar
          </h2>
          <div className="rounded-3xl border border-border/80 bg-card p-5 shadow-xs flex items-center justify-between gap-4">
            <div className="flex items-center gap-3.5">
              <div className="w-10 h-10 rounded-2xl bg-amber-500/10 text-amber-500 flex items-center justify-center">
                {notifPermission === "granted" ? <Bell className="w-5 h-5" /> : <BellOff className="w-5 h-5" />}
              </div>
              <div>
                <p className="text-sm font-bold text-foreground">Pengingat Jadwal & Tugas</p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {notifPermission === "granted"
                    ? "Notifikasi aktif: Anda akan menerima pemberitahuan jadwal & pengumuman"
                    : "Aktifkan notifikasi peramban agar tidak melewatkan jadwal kelas"}
                </p>
              </div>
            </div>
            <Button
              size="sm"
              variant={notifPermission === "granted" ? "secondary" : "default"}
              onClick={handleNotificationToggle}
              className="rounded-xl text-xs font-bold shrink-0"
            >
              {notifPermission === "granted" ? "Aktif" : "Aktifkan"}
            </Button>
          </div>
        </section>

        {/* Privacy & Leaderboard */}
        {user && (
          <section className="space-y-2">
            <h2 className="text-xs font-bold text-muted-foreground uppercase tracking-wider font-mono">
              Privasi & Papan Peringkat
            </h2>
            <div className="rounded-3xl border border-border/80 bg-card p-5 shadow-xs space-y-4">
              <div className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-3.5">
                  <div className="w-10 h-10 rounded-2xl bg-primary/10 text-primary flex items-center justify-center">
                    <Trophy className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-foreground">Tampilkan di Papan Skor Liga</p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {optOut
                        ? "Profil disembunyikan dari papan peringkat santri"
                        : "Profil dan skor XP Anda tampil di leaderboard kelas"}
                    </p>
                  </div>
                </div>
                <Button
                  size="sm"
                  variant={optOut ? "outline" : "secondary"}
                  disabled={privacyBusy}
                  onClick={togglePrivacy}
                  className="rounded-xl text-xs font-bold shrink-0"
                >
                  {optOut ? "Sembunyi" : "Publik"}
                </Button>
              </div>

              <div className="pt-3 border-t border-border/60 flex items-center justify-between">
                <Link
                  to="/siswa/$id"
                  params={{ id: user.id }}
                  className="inline-flex items-center gap-2 text-xs font-bold text-primary hover:underline"
                >
                  <span>Lihat Tampilan Profil Prestasi Publik Saya</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            </div>
          </section>
        )}

        {/* Data & Backup */}
        <section className="space-y-2">
          <h2 className="text-xs font-bold text-muted-foreground uppercase tracking-wider font-mono">
            Cadangan & Sinkronisasi
          </h2>
          <div className="rounded-3xl border border-border/80 bg-card p-5 shadow-xs space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="text-sm font-bold text-foreground">Ekspor & Impor Data Pembelajaran</p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Unduh riwayat progres belajar dalam format JSON untuk cadangan offline.
                </p>
              </div>
              <div className="flex items-center gap-2">
                <Button size="sm" variant="outline" onClick={handleExport} className="rounded-xl text-xs font-bold gap-1.5">
                  <Download className="w-3.5 h-3.5" />
                  Ekspor JSON
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => fileInputRef.current?.click()}
                  className="rounded-xl text-xs font-bold gap-1.5"
                >
                  <Upload className="w-3.5 h-3.5" />
                  Impor
                </Button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".json"
                  className="hidden"
                  onChange={handleImport}
                />
              </div>
            </div>

            <div className="pt-3 border-t border-border/60 flex items-center justify-between">
              <div>
                <p className="text-xs font-bold text-destructive">Bersihkan Cache & Data Lokal</p>
                <p className="text-[11px] text-muted-foreground">Reset cache aplikasi di perangkat ini.</p>
              </div>
              <Button
                size="sm"
                variant="ghost"
                onClick={handleClear}
                className="rounded-xl text-xs font-bold text-destructive hover:bg-destructive/10"
              >
                <Trash2 className="w-3.5 h-3.5 mr-1" />
                {confirmClear ? "Yakin Reset?" : "Bersihkan Cache"}
              </Button>
            </div>
          </div>
        </section>

        {/* About App */}
        <section className="space-y-2">
          <div className="rounded-3xl border border-border/80 bg-card p-5 shadow-xs flex items-center justify-between">
            <div>
              <p className="text-sm font-bold text-foreground">Digisschool LMS Platform</p>
              <p className="text-xs text-muted-foreground mt-0.5 font-mono">
                Digital Islamic Boarding School · Versi 2.0.0 (Enterprise)
              </p>
            </div>
            <span className="font-mono text-xs font-bold px-3 py-1 rounded-full bg-primary/10 text-primary border border-primary/20">
              Fase D Kurikulum Merdeka
            </span>
          </div>
        </section>
      </div>
    </DashboardShell>
  );
}
