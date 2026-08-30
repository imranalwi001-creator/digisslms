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
} from "lucide-react";
import { toast } from "sonner";
import { DashboardShell, StatCard } from "@/components/DashboardShell";
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
      { title: "Profil Prestasi Santri — Digisschool" },
      {
        name: "description",
        content:
          "Profil prestasi santri: level belajar, modul selesai, nilai kuis, lencana, dan sertifikat resmi Digisschool.",
      },
      { property: "og:title", content: "Profil Prestasi Santri — Digisschool" },
      {
        property: "og:description",
        content: "Level belajar, lencana, dan sertifikat santri Digisschool.",
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

  return (
    <DashboardShell
      role={role}
      title={isMe ? "Profil prestasi saya" : "Profil prestasi siswa"}
      subtitle="Capaian akademik yang bisa dilihat sesama siswa"
      actions={
        <Button size="sm" variant="outline" asChild>
          <Link to="/dashboard">
            <ArrowLeft className="mr-1.5 h-4 w-4" /> Papan peringkat
          </Link>
        </Button>
      }
    >
      {loading ? (
        <div className="flex h-64 items-center justify-center">
          <Loader2 className="h-6 w-6 animate-spin text-primary" />
        </div>
      ) : !derived ? (
        <div className="flex flex-col items-center gap-3 rounded-2xl border border-dashed border-border bg-background p-12 text-center">
          <Lock className="h-8 w-8 text-muted-foreground" />
          <p className="text-sm text-muted-foreground">
            Profil ini tidak tersedia atau siswa memilih untuk tidak ditampilkan.
          </p>
        </div>
      ) : (
        <div className="space-y-8">
          {/* header */}
          <section className="overflow-hidden rounded-3xl border border-border/60 bg-background">
            <ProfileBanner value={derived.s.banner_url} className="h-40 sm:h-52" />
            <div className="px-6 pb-6 sm:px-8 sm:pb-8">
            <div className="-mt-12 flex flex-wrap items-end gap-5">
              <ProfileAvatar value={derived.s.avatar_url} name={derived.s.display_name} className="h-24 w-24" />
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <h1 className="text-2xl font-semibold tracking-tight">{derived.s.display_name || "Siswa"}</h1>
                  {isMe && <Badge variant="secondary">Kamu</Badge>}
                </div>
                {derived.s.headline && (
                  <p className="mt-1 text-sm font-medium text-primary">{derived.s.headline}</p>
                )}
                <p className="mt-1 text-sm text-muted-foreground">
                  Kelas {derived.s.grade ?? "-"} · Bergabung {formatDate(derived.s.created_at)}
                </p>
                <div className="mt-3 flex flex-wrap items-center gap-2">
                  <Badge className="gap-1">
                    <Trophy className="h-3.5 w-3.5" /> Level {derived.level.label}
                  </Badge>
                  <Badge variant="outline" className="gap-1">
                    <Flame className="h-3.5 w-3.5" /> Streak {derived.streak} hari
                  </Badge>
                  {data.rank && (
                    <Badge variant="outline" className="gap-1">
                      <Medal className="h-3.5 w-3.5" /> Peringkat #{data.rank.position} dari {data.rank.total} di kelas{" "}
                      {derived.s.grade}
                    </Badge>
                  )}
                </div>
              </div>
              <div className="text-right">
                <p className="text-4xl font-bold tracking-tight">{derived.score}</p>
                <p className="text-xs text-muted-foreground">skor prestasi</p>
                {isMe ? (
                  <Button
                    size="sm"
                    variant="outline"
                    className="mt-2 text-xs font-bold gap-1.5 rounded-xl border-primary/30 hover:bg-primary hover:text-primary-foreground transition-all cursor-pointer shadow-xs"
                    onClick={() => setEditModalOpen(true)}
                  >
                    <Pencil className="w-3.5 h-3.5" /> Edit Profil
                  </Button>
                ) : (
                  <Button
                    size="sm"
                    variant="default"
                    className="mt-2 text-xs font-bold gap-1.5 rounded-xl shadow-xs cursor-pointer"
                    asChild
                  >
                    <Link to="/dashboard" search={{ tab: "chat" }}>
                      <MessageSquare className="w-3.5 h-3.5" /> Kirim Pesan Chat
                    </Link>
                  </Button>
                )}
              </div>
            </div>

            {/* Bio & Multi-Links */}
            {(() => {
              const links = parseProfileLinks(derived.s.social_link);
              if (!derived.s.bio && links.length === 0) return null;
              return (
                <div className="mt-5 space-y-4 pt-4 border-t border-border/60">
                  {derived.s.bio && (
                    <div className="space-y-1">
                      <p className="text-[11px] font-mono font-bold text-muted-foreground uppercase tracking-wider">
                        Tentang Saya & Target Belajar
                      </p>
                      <p className="max-w-3xl whitespace-pre-line text-sm text-foreground/90 leading-relaxed font-sans">
                        {derived.s.bio}
                      </p>
                    </div>
                  )}

                  {links.length > 0 && (
                    <div className="space-y-2">
                      <p className="text-[11px] font-mono font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
                        <Link2 className="w-3.5 h-3.5 text-primary" />
                        <span>Portofolio Proyek & Media Sosial ({links.length})</span>
                      </p>
                      <div className="flex flex-wrap gap-2.5">
                        {links.map((link) => (
                          <a
                            key={link.id}
                            href={link.url}
                            target="_blank"
                            rel="noopener noreferrer nofollow"
                            className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl border border-border/80 bg-muted/40 hover:bg-primary/10 hover:border-primary/40 hover:text-primary transition-all text-xs font-medium group shadow-xs cursor-pointer"
                          >
                            <span className="text-primary">{getCategoryIcon(link.category, "w-3.5 h-3.5")}</span>
                            <span className="font-bold text-foreground group-hover:text-primary">{link.title}</span>
                            <ExternalLink className="w-3 h-3 text-muted-foreground group-hover:text-primary opacity-70 ml-0.5" />
                          </a>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              );
            })()}

            <div className="mt-6">
              <div className="mb-1.5 flex items-center justify-between text-xs text-muted-foreground">
                <span>Menuju level berikutnya</span>
                <span>{Math.min(100, Math.round(derived.score / 10))}%</span>
              </div>
              <Progress value={Math.min(100, Math.round(derived.score / 10))} className="h-2" />
            </div>
            </div>
          </section>

          {/* stats */}
          <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <StatCard label="Modul selesai" value={derived.s.completed_modules} hint={`${derived.s.enrollments} kelas diikuti`} icon={BookOpen} />
            <StatCard label="Rata-rata kuis" value={derived.s.avg_quiz_score} hint={`${derived.s.passed_quizzes} kuis lulus`} icon={HelpCircle} />
            <StatCard label="Tugas dikumpulkan" value={derived.s.submissions} hint="Total pengumpulan" icon={FileText} />
            <StatCard label="Sertifikat" value={derived.s.certificates} hint="Materi tuntas" icon={Award} />
          </section>

          {/* momentum */}
          <section className="rounded-2xl border border-border/60 bg-background p-5">
            <h2 className="text-base font-semibold tracking-tight">Momentum belajar 14 hari</h2>
            <p className="mt-1 text-sm text-muted-foreground">Jumlah modul yang diselesaikan setiap hari.</p>
            <div className="mt-5 flex h-32 items-end gap-1.5">
              {derived.days.map((d) => (
                <div key={d.day} className="flex flex-1 flex-col items-center gap-1.5">
                  <div
                    title={`${d.day}: ${d.modules} modul`}
                    className={`w-full rounded-t-md transition-all ${d.modules ? "bg-primary" : "bg-muted"}`}
                    style={{ height: `${Math.max(6, (d.modules / derived.max) * 100)}%` }}
                  />
                  <span className="text-[10px] text-muted-foreground">{d.day.slice(8)}</span>
                </div>
              ))}
            </div>
          </section>

          {/* badges */}
          <section className="rounded-2xl border border-border/60 bg-background p-5">
            <h2 className="text-base font-semibold tracking-tight">Lencana prestasi</h2>
            <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              {derived.badges.map((b) => (
                <div
                  key={b.key}
                  className={`rounded-xl border p-4 transition-all ${
                    b.earned ? "border-primary/40 bg-primary/5" : "border-border/60 opacity-60"
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <Award className={`h-4 w-4 ${b.earned ? "text-primary" : "text-muted-foreground"}`} />
                    <p className="text-sm font-semibold">{b.label}</p>
                  </div>
                  <p className="mt-1 text-xs text-muted-foreground">{b.description}</p>
                </div>
              ))}
            </div>
          </section>

          {/* certificates */}
          {data.certificates?.length > 0 && (
            <section className="rounded-2xl border border-border/60 bg-background p-5">
              <h2 className="text-base font-semibold tracking-tight">Sertifikat diraih</h2>
              <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {data.certificates.map((c: any) => (
                  <Link
                    key={c.id}
                    to="/sertifikat/$number"
                    params={{ number: c.certificate_number }}
                    className="rounded-xl border border-border/60 p-4 transition-all hover:border-primary/40"
                  >
                    <p className="truncate font-medium">{findMaterial(c.material_slug)?.title || c.material_slug}</p>
                    <p className="mt-1 text-xs text-muted-foreground">{c.certificate_number}</p>
                    <p className="text-xs text-muted-foreground">{formatDate(c.issued_at)}</p>
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
