import { createFileRoute, Link, useParams } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import {
  Loader2,
  Trophy,
  Flame,
  BookOpen,
  HelpCircle,
  FileText,
  Award,
  Medal,
  ArrowLeft,
  Lock,
  Link2,
  Pencil,
  ExternalLink,
  MessageSquare,
  Sparkles,
  CheckCircle2,
  ShieldCheck,
  GraduationCap,
  Calendar,
  Zap,
  Share2,
  Star,
  Layers,
} from "lucide-react";
import { toast } from "sonner";
import { DashboardShell } from "@/components/DashboardShell";
import { RequireRole } from "@/components/RequireRole";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { getStudentProfile } from "@/lib/social.functions";
import { ProfileAvatar, ProfileBanner } from "@/components/ProfileMedia";
import { computeBadges, computeStreak, levelFor, achievementScore } from "@/lib/achievements";
import { findMaterial, formatDate } from "@/lib/lms";
import { parseProfileLinks } from "@/lib/profile";
import { EditProfileModal, getCategoryIcon } from "@/components/student/EditProfileModal";

export const Route = createFileRoute("/siswa/$id")({
  head: () => ({
    meta: [
      { title: "Profil Prestasi Santri — Digisschool LMS" },
      {
        name: "description",
        content:
          "Profil prestasi santri: capaian akademik, level belajar, modul selesai, nilai kuis, lencana, dan sertifikat resmi Digisschool LMS.",
      },
      { property: "og:title", content: "Profil Prestasi Santri — Digisschool LMS" },
      {
        property: "og:description",
        content: "Level belajar, lencana prestasi, dan sertifikat digital santri Digisschool LMS.",
      },
      { property: "og:type", content: "profile" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: StudentProfileRoute,
});

function StudentProfileRoute() {
  const { id } = useParams({ from: "/siswa/$id" });
  return (
    <RequireRole role="student">
      {({ userId, role }) => <StudentProfilePage id={id} viewerId={userId} role={role} />}
    </RequireRole>
  );
}

function StudentProfilePage({
  id,
  viewerId,
  role,
}: {
  id: string;
  viewerId: string;
  role: "admin" | "guru" | "student";
}) {
  const fetchProfile = useServerFn(getStudentProfile);
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [editModalOpen, setEditModalOpen] = useState(false);

  const loadProfile = () => {
    fetchProfile({ data: { id } })
      .then((res) => setData(res))
      .catch((err: any) => console.warn("Gagal memuat profil:", err));
  };

  useEffect(() => {
    let active = true;
    setLoading(true);
    fetchProfile({ data: { id } })
      .then((res) => active && setData(res))
      .catch((err: any) => console.warn("Gagal memuat profil:", err))
      .finally(() => active && setLoading(false));

    const handleUpdated = () => {
      loadProfile();
    };
    window.addEventListener("digisschool:profile_updated", handleUpdated);

    return () => {
      active = false;
      window.removeEventListener("digisschool:profile_updated", handleUpdated);
    };
  }, [id, fetchProfile]);

  const derived = useMemo(() => {
    if (!data?.student) return null;
    const s = data.student;
    const activity: Array<{ day: string; modules: number }> = data.activity || [];
    const streak = computeStreak(activity.map((a) => a.day));
    const score = achievementScore(s);
    const level = levelFor(Math.min(100, Math.round(score / 10)));
    const badges = computeBadges({
      completed_modules: s.completed_modules,
      avg_quiz_score: s.avg_quiz_score,
      passed_quizzes: s.passed_quizzes,
      certificates: s.certificates,
      submissions: s.submissions,
      streak,
    });
    const days: Array<{ day: string; modules: number }> = [];
    for (let i = 13; i >= 0; i--) {
      const d = new Date(Date.now() - i * 86400000).toISOString().slice(0, 10);
      days.push({ day: d, modules: activity.find((a) => a.day === d)?.modules ?? 0 });
    }
    const max = Math.max(1, ...days.map((d) => d.modules));
    return { s, streak, score, level, badges, days, max };
  }, [data]);

  const isMe = viewerId === id;

  const handleShare = () => {
    if (navigator.share) {
      navigator
        .share({
          title: `Profil Prestasi ${derived?.s?.display_name || "Santri"} — Digisschool LMS`,
          url: window.location.href,
        })
        .catch(() => {});
    } else {
      navigator.clipboard.writeText(window.location.href);
      toast.success("Tautan profil berhasil disalin ke clipboard!");
    }
  };

  return (
    <DashboardShell
      role={role}
      title={isMe ? "Profil Prestasi Saya" : "Profil Prestasi Santri"}
      subtitle="Portofolio akademik, capaian kompetensi, dan sertifikat resmi digital."
      actions={
        <div className="flex items-center gap-2">
          <Button size="sm" variant="outline" onClick={handleShare} className="gap-1.5 shadow-xs">
            <Share2 className="h-4 w-4" />
            <span className="hidden sm:inline">Bagikan</span>
          </Button>
          <Button size="sm" variant="outline" asChild className="gap-1.5 shadow-xs">
            <Link to="/dashboard">
              <ArrowLeft className="h-4 w-4" /> Papan Peringkat
            </Link>
          </Button>
        </div>
      }
    >
      {loading ? (
        <div className="flex h-80 flex-col items-center justify-center gap-3">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-sm font-medium text-muted-foreground animate-pulse">Memuat data profil santri...</p>
        </div>
      ) : !derived ? (
        <div className="flex flex-col items-center gap-4 rounded-3xl border border-dashed border-border/80 bg-card p-16 text-center shadow-xs">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-muted/60 text-muted-foreground">
            <Lock className="h-8 w-8" />
          </div>
          <div className="max-w-md space-y-1.5">
            <h3 className="text-lg font-bold tracking-tight">Profil Tidak Tersedia</h3>
            <p className="text-sm text-muted-foreground">
              Profil santri ini tidak ditemukan atau siswa memilih untuk tidak ditampilkan di publik.
            </p>
          </div>
          <Button variant="outline" asChild className="mt-2">
            <Link to="/dashboard">Kembali ke Dashboard</Link>
          </Button>
        </div>
      ) : (
        <div className="space-y-8">
          {/* ========================================================================= */}
          {/* 🌟 HERO PROFILE CARD */}
          {/* ========================================================================= */}
          <section className="relative overflow-hidden rounded-3xl border border-border/70 bg-card shadow-lg transition-all duration-300">
            {/* Banner with ambient lighting and badge */}
            <div className="relative">
              <ProfileBanner value={derived.s.banner_url} className="h-48 sm:h-60 md:h-64" />
              
              {/* Top Banner Badges */}
              <div className="absolute top-4 right-4 sm:top-5 sm:right-6 flex items-center gap-2">
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-black/50 text-white backdrop-blur-md border border-white/20 shadow-sm">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                  Santri Resmi
                </span>
              </div>
            </div>

            {/* Content Container */}
            <div className="px-6 pb-8 sm:px-8 sm:pb-8">
              <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 -mt-16 sm:-mt-20">
                {/* Left: Avatar & Identity */}
                <div className="flex flex-col sm:flex-row items-start sm:items-end gap-5">
                  <div className="relative group">
                    <ProfileAvatar
                      value={derived.s.avatar_url}
                      name={derived.s.display_name}
                      className="h-28 w-28 sm:h-32 sm:w-32 text-3xl sm:text-4xl"
                      ringClass="ring-4 ring-card shadow-2xl rounded-3xl"
                    />
                    <div
                      className="absolute -bottom-1 -right-1 flex h-8 w-8 items-center justify-center rounded-xl bg-emerald-500 text-white shadow-md ring-2 ring-card"
                      title="Akun Terverifikasi"
                    >
                      <CheckCircle2 className="h-4 w-4" />
                    </div>
                  </div>

                  {/* Name, Headline, and Class Info */}
                  <div className="space-y-1.5">
                    <div className="flex flex-wrap items-center gap-2.5">
                      <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground">
                        {derived.s.display_name || "Santri Digisschool"}
                      </h1>
                      {isMe && (
                        <Badge variant="secondary" className="px-2.5 py-0.5 text-[11px] font-bold tracking-wide uppercase">
                          Akun Anda
                        </Badge>
                      )}
                    </div>

                    {derived.s.headline && (
                      <p className="text-sm sm:text-base font-semibold text-primary/90 flex items-center gap-1.5">
                        <Sparkles className="w-4 h-4 text-amber-500 shrink-0" />
                        <span>{derived.s.headline}</span>
                      </p>
                    )}

                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 text-xs font-medium text-muted-foreground pt-0.5">
                      <span className="flex items-center gap-1.5">
                        <GraduationCap className="w-3.5 h-3.5 text-primary" />
                        Kelas {derived.s.grade ? `SMP ${derived.s.grade}` : "7"}
                      </span>
                      <span>•</span>
                      <span className="flex items-center gap-1.5">
                        <Calendar className="w-3.5 h-3.5 text-muted-foreground" />
                        Bergabung {formatDate(derived.s.created_at)}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Right: Score card & Primary Actions */}
                <div className="flex flex-row md:flex-col items-center md:items-end justify-between md:justify-center gap-3 pt-2 md:pt-0 border-t md:border-t-0 border-border/60">
                  <div className="flex items-center gap-3 bg-muted/40 md:bg-muted/30 px-4 py-2 rounded-2xl border border-border/60">
                    <div className="text-left md:text-right">
                      <p className="text-2xl sm:text-3xl font-black text-foreground tracking-tight leading-none">
                        {derived.score}
                        <span className="text-xs font-bold text-primary ml-1">XP</span>
                      </p>
                      <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mt-0.5">
                        Skor Prestasi
                      </p>
                    </div>
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-500/10 text-amber-500">
                      <Zap className="h-5 w-5 fill-amber-500/20" />
                    </div>
                  </div>

                  {isMe ? (
                    <Button
                      size="sm"
                      variant="default"
                      onClick={() => setEditModalOpen(true)}
                      className="gap-2 font-bold rounded-xl shadow-sm px-5 h-9"
                    >
                      <Pencil className="w-3.5 h-3.5" />
                      <span>Edit Profil</span>
                    </Button>
                  ) : (
                    <Button
                      size="sm"
                      variant="default"
                      asChild
                      className="gap-2 font-bold rounded-xl shadow-sm px-5 h-9"
                    >
                      <Link to="/dashboard" search={{ tab: "chat" }}>
                        <MessageSquare className="w-3.5 h-3.5" />
                        <span>Kirim Pesan</span>
                      </Link>
                    </Button>
                  )}
                </div>
              </div>

              {/* Badges & Ranks Pill Row */}
              <div className="mt-6 flex flex-wrap items-center gap-2.5 pt-4 border-t border-border/50">
                <Badge className="gap-1.5 px-3 py-1 bg-primary text-primary-foreground font-bold shadow-xs">
                  <Trophy className="h-3.5 w-3.5" />
                  Level {derived.level.label}
                </Badge>
                
                <Badge variant="outline" className="gap-1.5 px-3 py-1 font-semibold border-amber-500/30 text-amber-600 dark:text-amber-400 bg-amber-500/5">
                  <Flame className="h-3.5 w-3.5 fill-amber-500/30" />
                  Streak {derived.streak} Hari
                </Badge>

                {data.rank && (
                  <Badge variant="outline" className="gap-1.5 px-3 py-1 font-semibold border-indigo-500/30 text-indigo-600 dark:text-indigo-400 bg-indigo-500/5">
                    <Medal className="h-3.5 w-3.5" />
                    Peringkat #{data.rank.position} dari {data.rank.total} santri
                  </Badge>
                )}
              </div>

              {/* Level XP Progression Bar */}
              <div className="mt-6 rounded-2xl bg-muted/40 p-4 border border-border/60">
                <div className="flex items-center justify-between text-xs font-semibold mb-2">
                  <span className="flex items-center gap-1.5 text-foreground">
                    <Star className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
                    Progres Level Selanjutnya ({derived.level.label})
                  </span>
                  <span className="font-mono text-primary font-bold">
                    {Math.min(100, Math.round(derived.score / 10))}%
                  </span>
                </div>
                <Progress value={Math.min(100, Math.round(derived.score / 10))} className="h-2.5 rounded-full" />
              </div>

              {/* Bio & Social Links Section */}
              {(() => {
                const links = parseProfileLinks(derived.s.social_link);
                if (!derived.s.bio && links.length === 0) return null;
                return (
                  <div className="mt-6 space-y-4 pt-5 border-t border-border/60">
                    {derived.s.bio && (
                      <div className="space-y-1.5">
                        <p className="text-[11px] font-mono font-bold text-muted-foreground uppercase tracking-wider">
                          Tentang Saya & Target Belajar
                        </p>
                        <p className="max-w-3xl whitespace-pre-line text-sm text-foreground/90 leading-relaxed font-sans bg-muted/20 p-4 rounded-2xl border border-border/50">
                          {derived.s.bio}
                        </p>
                      </div>
                    )}

                    {links.length > 0 && (
                      <div className="space-y-2.5">
                        <p className="text-[11px] font-mono font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
                          <Link2 className="w-3.5 h-3.5 text-primary" />
                          <span>Portofolio Proyek & Tautan Sosial ({links.length})</span>
                        </p>
                        <div className="flex flex-wrap gap-2.5">
                          {links.map((link) => (
                            <a
                              key={link.id}
                              href={link.url}
                              target="_blank"
                              rel="noopener noreferrer nofollow"
                              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl border border-border/80 bg-card hover:bg-primary/10 hover:border-primary/40 hover:text-primary transition-all text-xs font-semibold group shadow-xs cursor-pointer"
                            >
                              <span className="text-primary">{getCategoryIcon(link.category, "w-4 h-4")}</span>
                              <span className="font-bold text-foreground group-hover:text-primary">{link.title}</span>
                              <ExternalLink className="w-3 h-3 text-muted-foreground group-hover:text-primary opacity-60 ml-0.5" />
                            </a>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })()}
            </div>
          </section>

          {/* ========================================================================= */}
          {/* 📊 4 KEY ACADEMIC METRICS (STAT CARDS) */}
          {/* ========================================================================= */}
          <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div className="rounded-3xl border border-border/70 bg-card p-5 shadow-xs transition-all hover:shadow-md">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Modul Selesai</span>
                <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                  <BookOpen className="h-5 w-5" />
                </div>
              </div>
              <p className="mt-3 text-3xl font-black tracking-tight text-foreground">{derived.s.completed_modules}</p>
              <p className="mt-1 text-xs text-muted-foreground font-medium">{derived.s.enrollments} kelas diikuti</p>
            </div>

            <div className="rounded-3xl border border-border/70 bg-card p-5 shadow-xs transition-all hover:shadow-md">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Rata-rata Kuis</span>
                <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400">
                  <HelpCircle className="h-5 w-5" />
                </div>
              </div>
              <p className="mt-3 text-3xl font-black tracking-tight text-foreground">
                {derived.s.avg_quiz_score}
                <span className="text-sm font-semibold text-muted-foreground ml-1">/100</span>
              </p>
              <p className="mt-1 text-xs text-muted-foreground font-medium">{derived.s.passed_quizzes} kuis lulus evaluasi</p>
            </div>

            <div className="rounded-3xl border border-border/70 bg-card p-5 shadow-xs transition-all hover:shadow-md">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Tugas & Proyek</span>
                <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-violet-500/10 text-violet-600 dark:text-violet-400">
                  <FileText className="h-5 w-5" />
                </div>
              </div>
              <p className="mt-3 text-3xl font-black tracking-tight text-foreground">{derived.s.submissions}</p>
              <p className="mt-1 text-xs text-muted-foreground font-medium">Total pengumpulan tugas</p>
            </div>

            <div className="rounded-3xl border border-border/70 bg-card p-5 shadow-xs transition-all hover:shadow-md">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Sertifikat Resmi</span>
                <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-amber-500/10 text-amber-600 dark:text-amber-400">
                  <Award className="h-5 w-5" />
                </div>
              </div>
              <p className="mt-3 text-3xl font-black tracking-tight text-foreground">{derived.s.certificates}</p>
              <p className="mt-1 text-xs text-muted-foreground font-medium">Kompetensi tuntas terverifikasi</p>
            </div>
          </section>

          {/* ========================================================================= */}
          {/* ⚡ 14-DAY LEARNING MOMENTUM */}
          {/* ========================================================================= */}
          <section className="rounded-3xl border border-border/70 bg-card p-6 shadow-xs">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <h2 className="text-base sm:text-lg font-bold tracking-tight text-foreground flex items-center gap-2">
                  <Flame className="w-5 h-5 text-amber-500" />
                  Momentum Belajar (14 Hari Terakhir)
                </h2>
                <p className="mt-0.5 text-xs sm:text-sm text-muted-foreground">
                  Aktivitas penyelesaian modul dan ketekunan belajar santri setiap hari.
                </p>
              </div>
              <span className="text-xs font-bold px-3 py-1 rounded-full bg-primary/10 text-primary border border-primary/20 w-fit">
                Total {derived.days.reduce((acc, d) => acc + d.modules, 0)} Modul Selesai
              </span>
            </div>

            <div className="mt-6 flex h-36 items-end gap-2 sm:gap-3 px-1">
              {derived.days.map((d) => {
                const heightPercent = Math.max(8, (d.modules / derived.max) * 100);
                const hasActivity = d.modules > 0;
                return (
                  <div key={d.day} className="group relative flex flex-1 flex-col items-center gap-2 h-full justify-end">
                    {/* Tooltip on hover */}
                    <div className="absolute -top-8 opacity-0 group-hover:opacity-100 transition-opacity bg-foreground text-background text-[10px] font-bold px-2 py-1 rounded-md pointer-events-none whitespace-nowrap z-10 shadow-md">
                      {d.modules} modul ({d.day})
                    </div>
                    
                    {/* Bar */}
                    <div
                      className={`w-full rounded-t-xl transition-all duration-300 ${
                        hasActivity
                          ? "bg-gradient-to-t from-primary to-emerald-400 group-hover:brightness-110 shadow-xs"
                          : "bg-muted/60"
                      }`}
                      style={{ height: `${heightPercent}%` }}
                    />
                    
                    {/* Date label */}
                    <span className="text-[10px] sm:text-xs font-mono text-muted-foreground">
                      {d.day.slice(8)}
                    </span>
                  </div>
                );
              })}
            </div>
          </section>

          {/* ========================================================================= */}
          {/* 🏅 LENCANA PRESTASI (BADGES) */}
          {/* ========================================================================= */}
          <section className="rounded-3xl border border-border/70 bg-card p-6 shadow-xs">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-base sm:text-lg font-bold tracking-tight text-foreground flex items-center gap-2">
                  <Award className="w-5 h-5 text-primary" />
                  Lencana & Penghargaan Prestasi
                </h2>
                <p className="mt-0.5 text-xs sm:text-sm text-muted-foreground">
                  Pencapaian kompetensi dan milestone belajar santri.
                </p>
              </div>
              <span className="text-xs font-bold text-muted-foreground">
                {derived.badges.filter((b) => b.earned).length} / {derived.badges.length} Terbuka
              </span>
            </div>

            <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              {derived.badges.map((b) => (
                <div
                  key={b.key}
                  className={`relative overflow-hidden rounded-2xl border p-4 transition-all duration-200 ${
                    b.earned
                      ? "border-primary/40 bg-gradient-to-br from-primary/10 via-primary/5 to-card shadow-xs hover:border-primary/60"
                      : "border-border/60 bg-muted/20 opacity-60 grayscale"
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <div
                      className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${
                        b.earned
                          ? "bg-primary text-primary-foreground shadow-sm"
                          : "bg-muted text-muted-foreground"
                      }`}
                    >
                      <Award className="h-5 w-5" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-bold text-foreground truncate">{b.label}</p>
                      <p className="mt-0.5 text-xs text-muted-foreground leading-snug">{b.description}</p>
                      <div className="mt-2">
                        {b.earned ? (
                          <span className="inline-flex items-center gap-1 text-[10px] font-bold text-primary">
                            <CheckCircle2 className="w-3 h-3" /> Diraih
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-[10px] font-medium text-muted-foreground">
                            <Lock className="w-3 h-3" /> Terkunci
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* ========================================================================= */}
          {/* 🎓 SERTIFIKAT RESMI (CERTIFICATES) */}
          {/* ========================================================================= */}
          {data.certificates?.length > 0 && (
            <section className="rounded-3xl border border-border/70 bg-card p-6 shadow-xs">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-base sm:text-lg font-bold tracking-tight text-foreground flex items-center gap-2">
                    <ShieldCheck className="w-5 h-5 text-amber-500" />
                    Sertifikat Resmi Digital ({data.certificates.length})
                  </h2>
                  <p className="mt-0.5 text-xs sm:text-sm text-muted-foreground">
                    Sertifikat resmi yang diterbitkan dan dapat diverifikasi secara publik.
                  </p>
                </div>
              </div>

              <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {data.certificates.map((c: any) => (
                  <Link
                    key={c.id}
                    to="/sertifikat/$number"
                    params={{ number: c.certificate_number }}
                    className="group relative flex flex-col justify-between overflow-hidden rounded-2xl border border-border/70 bg-card p-5 transition-all duration-200 hover:-translate-y-1 hover:border-primary/50 hover:shadow-md cursor-pointer"
                  >
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-[11px] font-mono font-bold text-primary uppercase tracking-wider">
                          Sertifikat Digital
                        </span>
                        <ExternalLink className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors" />
                      </div>
                      <h3 className="font-bold text-base text-foreground group-hover:text-primary transition-colors line-clamp-2">
                        {findMaterial(c.material_slug)?.title || c.material_slug}
                      </h3>
                      <p className="font-mono text-xs text-muted-foreground">
                        No: {c.certificate_number}
                      </p>
                    </div>

                    <div className="mt-4 pt-3 border-t border-border/60 flex items-center justify-between text-xs text-muted-foreground">
                      <span>Diterbitkan:</span>
                      <span className="font-medium text-foreground">{formatDate(c.issued_at)}</span>
                    </div>
                  </Link>
                ))}
              </div>
            </section>
          )}
        </div>
      )}

      {isMe && (
        <EditProfileModal
          open={editModalOpen}
          onOpenChange={setEditModalOpen}
          userId={viewerId}
          onSuccess={loadProfile}
        />
      )}
    </DashboardShell>
  );
}
