import { createFileRoute, Link, useLocation, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import {
  BookOpen,
  CheckCircle2,
  Circle,
  Flame,
  Trophy,
  ChevronDown,
  Plus,
  Megaphone,
  Clock,
  ArrowRight,
  Loader2,
  HelpCircle,
  FileText,
  Award,
  GraduationCap,
  CalendarDays,
  Sparkles,
  TrendingUp,
  Search,
  CheckCircle,
  AlertCircle,
  BookMarked,
  UserCheck,
  MessageSquare,
} from "lucide-react";
import { toast } from "sonner";
import { DashboardShell, StatCard } from "@/components/DashboardShell";
import { StudentSchedulePanel } from "@/components/StudentSchedulePanel";
import { RequireRole } from "@/components/RequireRole";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ProgressPanel } from "@/components/student/ProgressPanel";
import { LeaderboardPanel } from "@/components/student/LeaderboardPanel";
import { ProfilePanel } from "@/components/student/ProfilePanel";
import { StudentChatHub } from "@/components/student/StudentChatHub";
import { DailyCodingTrackerCard } from "@/components/lms/DailyCodingTrackerCard";
import { Badge } from "@/components/ui/badge";
import { useTerms, termLabel } from "@/lib/terms";
import { useCatalog } from "@/lib/materials-db";
import {
  fetchEnrollments,
  fetchModuleProgress,
  fetchAnnouncements,
  enroll,
  unenroll,
  toggleModule,
  findMaterial,
  materialProgress,
  formatDate,
  levelLabel,
  type Enrollment,
  type ModuleProgress,
  type Announcement,
} from "@/lib/lms";
import {
  listPublishedQuizzesForStudent,
  listMyQuizAttempts,
  listPublishedAssignmentsForStudent,
  listMyCertificates,
  issueCertificateIfEligible,
} from "@/lib/lms.functions";
import { useServerFn } from "@tanstack/react-start";
import { ResumeLearningHero } from "@/components/lms/ResumeLearningHero";
import { LearningStreakHeatmap } from "@/components/lms/LearningStreakHeatmap";
import { CourseSearchBar } from "@/components/lms/CourseSearchBar";
import { CertificateModal } from "@/components/lms/CertificateModal";
import { CourseCard } from "@/components/hallmark/CourseCard";
import { GamificationLeagueCard } from "@/components/lms/GamificationLeagueCard";
import { ERaporModal } from "@/components/lms/ERaporModal";
import { pushNotification } from "@/lib/notifications";

export const Route = createFileRoute("/dashboard")({
  head: () => ({
    meta: [
      { title: "Dashboard Siswa — Digisschool" },
      {
        name: "description",
        content:
          "Pantau kelas yang diikuti, selesaikan modul satu per satu, dan lihat capaian belajarmu dalam satu dashboard santri Digisschool.",
      },
      { property: "og:title", content: "Dashboard Siswa — Digisschool" },
      {
        property: "og:description",
        content: "Kelas yang diikuti, progres modul, dan capaian belajar dalam satu tempat.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: DashboardRoute,
});

function DashboardRoute() {
  return (
    <RequireRole role="student">
      {({ userId, role, grade }) => <StudentDashboard userId={userId} role={role} grade={grade} />}
    </RequireRole>
  );
}

function StudentDashboard({
  userId,
  role,
  grade,
}: {
  userId: string;
  role: "admin" | "guru" | "student";
  grade: number | null;
}) {
  const { list: materials } = useCatalog();
  const { active: activeTerm } = useTerms();
  const [catalogSemester, setCatalogSemester] = useState<1 | 2 | "all">("all");
  useEffect(() => {
    if (activeTerm) setCatalogSemester(activeTerm.semester);
  }, [activeTerm]);
  // Students only see materials for their own class; admins see everything.
  const allowedMaterials = useMemo(
    () => (role !== "student" || !grade ? materials : materials.filter((m) => m.grade === grade)),
    [materials, role, grade],
  );
  const [enrollments, setEnrollments] = useState<Enrollment[]>([]);
  const [progress, setProgress] = useState<ModuleProgress[]>([]);
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [quizzes, setQuizzes] = useState<any[]>([]);
  const [quizAttempts, setQuizAttempts] = useState<any[]>([]);
  const [assignments, setAssignments] = useState<any[]>([]);
  const [certificates, setCertificates] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const [issuing, setIssuing] = useState<string | null>(null);

  const fetchQuizzes = useServerFn(listPublishedQuizzesForStudent);
  const fetchAttempts = useServerFn(listMyQuizAttempts);
  const fetchAssignments = useServerFn(listPublishedAssignmentsForStudent);
  const fetchCertificates = useServerFn(listMyCertificates);
  const claimCertificate = useServerFn(issueCertificateIfEligible);

  const load = async () => {
    try {
      const [e, p, a, qData, attempts, asg, certs] = await Promise.all([
        fetchEnrollments(userId).catch(() => []),
        fetchModuleProgress(userId).catch(() => []),
        fetchAnnouncements(5).catch(() => []),
        fetchQuizzes().catch(() => ({ quizzes: [] })),
        fetchAttempts().catch(() => ({ attempts: [] })),
        fetchAssignments().catch(() => ({ assignments: [] })),
        fetchCertificates().catch(() => ({ certificates: [] })),
      ]);
      setEnrollments(e || []);
      setProgress(p || []);
      setAnnouncements(a || []);
      setQuizzes(qData?.quizzes || []);
      setQuizAttempts(attempts?.attempts || []);
      setAssignments(asg?.assignments || []);
      setCertificates(certs?.certificates || []);
    } catch (err: any) {
      console.warn("Dashboard initial load fallback:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId]);

  const stats = useMemo(() => {
    const totalModules = enrollments.reduce((s, e) => s + (findMaterial(e.materialSlug)?.modules ?? 0), 0);
    const done = progress.length;
    const percent = totalModules ? Math.round((done / totalModules) * 100) : 0;
    const completedCourses = enrollments.filter((e) => materialProgress(e.materialSlug, progress).percent === 100).length;
    const passedQuizzes = quizAttempts.filter((a) => a.is_passed).length;
    const pendingAssignments = assignments.filter((a) => !a.submission?.submitted_at).length;
    return { totalModules, done, percent, completedCourses, level: levelLabel(percent), passedQuizzes, pendingAssignments, certificates: certificates.length };
  }, [enrollments, progress, quizAttempts, assignments, certificates]);

  const [searchQuery, setSearchQuery] = useState("");
  const [selectedGradeFilter, setSelectedGradeFilter] = useState<"all" | 7 | 8 | 9>("all");
  const [selectedSubjectFilter, setSelectedSubjectFilter] = useState<string>("all");
  const [selectedCert, setSelectedCert] = useState<any>(null);
  const [raporOpen, setRaporOpen] = useState(false);

  const materialProgressMap = useMemo(() => {
    const map: Record<string, { done: number; total: number; percent: number }> = {};
    for (const e of enrollments) {
      map[e.materialSlug] = materialProgress(e.materialSlug, progress);
    }
    return map;
  }, [enrollments, progress]);

  const filteredEnrolled = useMemo(() => {
    return enrollments.filter((e) => {
      const m = findMaterial(e.materialSlug);
      if (!m) return false;
      const matchQuery =
        !searchQuery ||
        m.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        m.subject.toLowerCase().includes(searchQuery.toLowerCase());
      const matchGrade = selectedGradeFilter === "all" || m.grade === selectedGradeFilter;
      const matchSubject = selectedSubjectFilter === "all" || m.subject === selectedSubjectFilter;
      return matchQuery && matchGrade && matchSubject;
    });
  }, [enrollments, searchQuery, selectedGradeFilter, selectedSubjectFilter]);

  const notEnrolled = allowedMaterials.filter((m) => !enrollments.some((e) => e.materialSlug === m.slug));
  const catalogList = notEnrolled.filter((m) => catalogSemester === "all" || m.semester === catalogSemester);

  const filteredCatalog = useMemo(() => {
    return catalogList.filter((m) => {
      const matchQuery =
        !searchQuery ||
        m.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        m.subject.toLowerCase().includes(searchQuery.toLowerCase());
      const matchGrade = selectedGradeFilter === "all" || m.grade === selectedGradeFilter;
      const matchSubject = selectedSubjectFilter === "all" || m.subject === selectedSubjectFilter;
      return matchQuery && matchGrade && matchSubject;
    });
  }, [catalogList, searchQuery, selectedGradeFilter, selectedSubjectFilter]);


  const handleEnroll = async (slug: string) => {
    const targetMat = allowedMaterials.find((m) => m.slug === slug);
    if (grade && targetMat && targetMat.grade !== grade && role !== "admin" && role !== "guru") {
      toast.error(`Materi ini untuk Kelas ${targetMat.grade} SMP. Akun Anda terdaftar di Kelas ${grade} SMP.`);
      return;
    }
    setBusy(slug);
    try {
      await enroll(userId, slug);
      toast.success("Kelas ditambahkan ke daftar belajarmu");
      pushNotification({
        category: "academic",
        type: "material_enrolled",
        title: `Kelas Ditambahkan: ${targetMat?.title || slug}`,
        message: `Anda berhasil mendaftar kelas ${targetMat?.title || slug}. Mulai pelajari modul sekarang!`,
        link: `/materi/${slug}`,
      });
      await load();
    } catch (err: any) {
      toast.error(err.message || "Gagal mendaftar kelas");
    } finally {
      setBusy(null);
    }
  };

  const location = useLocation();
  const navigate = useNavigate();

  const queryTab = useMemo(() => {
    if (typeof window === "undefined") return "belajar";
    const params = new URLSearchParams(location.search);
    return params.get("tab") || "belajar";
  }, [location.search]);

  const [currentTab, setCurrentTab] = useState<string>("belajar");

  useEffect(() => {
    if (queryTab) {
      setCurrentTab(queryTab);
    }
  }, [queryTab]);

  const handleTabChange = (val: string) => {
    setCurrentTab(val);
    navigate({
      to: "/dashboard",
      search: val === "belajar" ? {} : ({ tab: val } as any),
    });
  };

  const handleUnenroll = async (slug: string) => {
    setBusy(slug);
    try {
      await unenroll(userId, slug);
      await load();
    } catch (err: any) {
      toast.error(err.message || "Gagal menghapus kelas");
    } finally {
      setBusy(null);
    }
  };

  const handleToggleModule = async (slug: string, index: number, done: boolean) => {
    setProgress((prev) =>
      done
        ? [
            ...prev,
            { id: `tmp-${slug}-${index}`, userId, materialSlug: slug, moduleIndex: index, completedAt: new Date().toISOString() },
          ]
        : prev.filter((p) => !(p.materialSlug === slug && p.moduleIndex === index)),
    );
    try {
      await toggleModule(userId, slug, index, done);
      const fresh = await fetchModuleProgress(userId);
      setProgress(fresh);
      if (done) {
        const targetMat = catalogList.find((m) => m.slug === slug);
        pushNotification({
          category: "academic",
          type: "module_completed",
          title: `Modul #${index + 1} Selesai 🎉`,
          message: `Progres materi ${targetMat?.title || slug} bertambah! Terus tingkatkan streak belajarmu.`,
          link: `/materi/${slug}`,
        });
      }
    } catch (err: any) {
      toast.error(err.message || "Gagal menyimpan progres");
      const fresh = await fetchModuleProgress(userId);
      setProgress(fresh);
    }
  };

  const handleClaimCertificate = async (slug: string) => {
    setIssuing(slug);
    try {
      const { certificate, issued, reason } = await claimCertificate({ data: { materialSlug: slug } });
      if (issued) {
        toast.success("Sertifikat diterbitkan!");
        const targetMat = catalogList.find((m) => m.slug === slug);
        pushNotification({
          category: "academic",
          type: "certificate_issued",
          title: `Sertifikat Resmi Terbit! 🏆`,
          message: `Selamat! Anda berhasil menuntaskan 100% kelas ${targetMat?.title || slug}.`,
          link: "/dashboard",
        });
      } else if (certificate) {
        toast.info("Sertifikat sudah pernah diterbitkan");
      } else {
        toast.warning(reason || "Belum memenuhi syarat");
      }
      await load();
    } catch (err: any) {
      toast.error(err.message || "Gagal menerbitkan sertifikat");
    } finally {
      setIssuing(null);
    }
  };

  const enrolledSlugs = new Set(enrollments.map((e) => e.materialSlug));

  return (
    <DashboardShell
      role={role}
      title="Dashboard Santri"
      subtitle="Pusat aktivitas pembelajaran digital, jadwal kelas, tugas, kuis, peringkat, dan E-Rapor akademik."
      actions={
        <div className="flex items-center gap-2.5">
          <Button
            size="sm"
            variant="outline"
            onClick={() => setRaporOpen(true)}
            className="hidden sm:inline-flex gap-1.5 text-xs font-bold rounded-xl border-primary/30 text-primary hover:bg-primary/10"
          >
            <GraduationCap className="h-4 w-4" />
            E-Rapor Digital
          </Button>

          <Button asChild size="sm" variant="default" className="text-xs font-bold rounded-xl shadow-xs">
            <Link to="/siswa/$id" params={{ id: userId }}>
              Profil Prestasi <ArrowRight className="ml-1.5 h-3.5 w-3.5" />
            </Link>
          </Button>
        </div>
      }
    >
      {loading ? (
        <div className="flex h-64 items-center justify-center">
          <Loader2 className="h-6 w-6 animate-spin text-primary" />
        </div>
      ) : (
        <div className="space-y-6">
          {/* Top Hero Student Greeting Card */}
          <div className="relative overflow-hidden rounded-3xl border border-primary/20 bg-gradient-to-br from-primary/15 via-background to-secondary/30 p-6 shadow-sm">
            <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-5">
              <div className="space-y-1.5">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-mono text-xs font-bold px-2.5 py-0.5 rounded-full bg-primary/20 text-primary border border-primary/30">
                    Jenjang Kelas {grade || 7} SMP
                  </span>
                  <span className="font-mono text-xs px-2.5 py-0.5 rounded-full bg-secondary text-secondary-foreground font-semibold">
                    {termLabel(activeTerm)}
                  </span>
                </div>
                <h2 className="text-xl sm:text-2xl font-extrabold text-foreground tracking-tight">
                  Ahlan wa Sahlan, Santri Digisschool! 🚀
                </h2>
                <p className="text-xs sm:text-sm text-muted-foreground max-w-xl leading-relaxed">
                  Tingkatkan capaian kompetensi Kurikulum Merdeka Informatika dan raih peringkat terbaik di kelasmu.
                </p>
              </div>

              {/* Quick Highlight Badges */}
              <div className="flex flex-wrap items-center gap-2.5 shrink-0">
                <div className="flex items-center gap-2 px-3 py-2 rounded-2xl bg-background/80 border border-border/70 shadow-xs">
                  <Flame className="w-4 h-4 text-amber-500 animate-pulse" />
                  <div className="text-left">
                    <p className="text-[10px] font-mono text-muted-foreground uppercase">Streak</p>
                    <p className="text-xs font-extrabold text-foreground">5 Hari</p>
                  </div>
                </div>

                <div className="flex items-center gap-2 px-3 py-2 rounded-2xl bg-background/80 border border-border/70 shadow-xs">
                  <Sparkles className="w-4 h-4 text-primary" />
                  <div className="text-left">
                    <p className="text-[10px] font-mono text-muted-foreground uppercase">Total Skor</p>
                    <p className="text-xs font-extrabold text-foreground">1.450 XP</p>
                  </div>
                </div>

                <div className="flex items-center gap-2 px-3 py-2 rounded-2xl bg-background/80 border border-border/70 shadow-xs">
                  <Trophy className="w-4 h-4 text-amber-400" />
                  <div className="text-left">
                    <p className="text-[10px] font-mono text-muted-foreground uppercase">Peringkat</p>
                    <p className="text-xs font-extrabold text-foreground">#3 di Kelas</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Unified Navigation Tabs */}
          <Tabs value={currentTab} onValueChange={handleTabChange} className="space-y-6">
            <TabsList className="w-full justify-start overflow-x-auto p-1.5 rounded-2xl bg-muted/50 border border-border/60 no-scrollbar">
              <TabsTrigger value="belajar" className="rounded-xl text-xs font-bold gap-1.5">
                <BookOpen className="w-3.5 h-3.5" />
                Ikhtisar
              </TabsTrigger>
              <TabsTrigger value="chat" className="rounded-xl text-xs font-bold gap-1.5 bg-primary/10 text-primary hover:bg-primary/20">
                <MessageSquare className="w-3.5 h-3.5" />
                Ruang Chat Santri
              </TabsTrigger>
              <TabsTrigger value="kelas" className="rounded-xl text-xs font-bold gap-1.5">
                <BookMarked className="w-3.5 h-3.5" />
                Kelas Saya ({enrollments.length})
              </TabsTrigger>
              <TabsTrigger value="tugas" className="rounded-xl text-xs font-bold gap-1.5">
                <FileText className="w-3.5 h-3.5" />
                Tugas ({assignments.length})
              </TabsTrigger>
              <TabsTrigger value="kuis" className="rounded-xl text-xs font-bold gap-1.5">
                <HelpCircle className="w-3.5 h-3.5" />
                Kuis ({quizzes.length})
              </TabsTrigger>
              <TabsTrigger value="jadwal" className="rounded-xl text-xs font-bold gap-1.5">
                <CalendarDays className="w-3.5 h-3.5" />
                Jadwal & Presensi
              </TabsTrigger>
              <TabsTrigger value="peringkat" className="rounded-xl text-xs font-bold gap-1.5">
                <Trophy className="w-3.5 h-3.5" />
                Peringkat & Liga
              </TabsTrigger>
              <TabsTrigger value="sertifikat" className="rounded-xl text-xs font-bold gap-1.5">
                <Award className="w-3.5 h-3.5" />
                Sertifikat ({certificates.length})
              </TabsTrigger>
              <TabsTrigger value="rapor" className="rounded-xl text-xs font-bold gap-1.5">
                <GraduationCap className="w-3.5 h-3.5" />
                E-Rapor
              </TabsTrigger>
              <TabsTrigger value="progres" className="rounded-xl text-xs font-bold gap-1.5">
                <TrendingUp className="w-3.5 h-3.5" />
                Statistik
              </TabsTrigger>
              <TabsTrigger value="profil" className="rounded-xl text-xs font-bold gap-1.5">
                <UserCheck className="w-3.5 h-3.5" />
                Profil Saya
              </TabsTrigger>
            </TabsList>

            {/* TAB 1: IKHTISAR & DASHBOARD UTAMA */}
            <TabsContent value="belajar" className="space-y-8">
              {/* 1-Click Resume Learning Hero */}
              <ResumeLearningHero
                enrollments={enrollments}
                materials={allowedMaterials}
                materialProgressMap={materialProgressMap}
              />

              {/* Target Coding & Praktik Harian Santri (Tersinkron Database habits & habit_logs) */}
              <DailyCodingTrackerCard userId={userId} />

              <StudentSchedulePanel userId={userId} grade={grade} />

              <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <StatCard label="Kelas diikuti" value={enrollments.length} hint={`${stats.completedCourses} kelas tuntas`} icon={BookOpen} />
                <StatCard label="Kuis lulus" value={stats.passedQuizzes} hint={`dari ${quizzes.length} kuis`} icon={HelpCircle} />
                <StatCard label="Tugas pending" value={stats.pendingAssignments} hint={stats.pendingAssignments === 0 ? "Semua tugas dikumpulkan" : "Perlu dikerjakan"} icon={FileText} />
                <StatCard label="Sertifikat" value={stats.certificates} hint={`Level ${stats.level.label}`} icon={Award} />
              </section>

              {/* Learning Streak & Momentum Heatmap */}
              <LearningStreakHeatmap />

              <section className="grid gap-4 lg:grid-cols-3">
                <div className="lg:col-span-2 rounded-2xl border border-border/60 bg-card p-5 shadow-xs">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <h2 className="text-base font-semibold tracking-tight">Perjalanan level</h2>
                      <p className="text-sm text-muted-foreground">
                        Level saat ini: <span className="font-medium text-foreground">{stats.level.label}</span>
                      </p>
                    </div>
                    <Badge variant="secondary">{stats.percent}%</Badge>
                  </div>
                  <Progress value={stats.percent} className="mt-4 h-2" />
                  <div className="mt-3 flex flex-wrap gap-2">
                    {["Pemula", "Berkembang", "Mahir", "Ahli", "Teladan"].map((lvl) => (
                      <Badge key={lvl} variant={lvl === stats.level.label ? "default" : "outline"}>
                        {lvl}
                      </Badge>
                    ))}
                  </div>
                </div>
                <div className="rounded-2xl border border-border/60 bg-card p-5 shadow-xs">
                  <h2 className="text-base font-semibold tracking-tight">Progres modul</h2>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {stats.done} dari {stats.totalModules} modul selesai
                  </p>
                  <div className="mt-4">
                    <Progress value={stats.totalModules ? (stats.done / stats.totalModules) * 100 : 0} className="h-3" />
                  </div>
                  <p className="mt-3 text-sm font-medium text-primary">{stats.percent}% total</p>
                </div>
              </section>

              {/* Weekly XP League & Gamification Tier */}
              <GamificationLeagueCard />

              {/* Quick E-Rapor Action Banner */}
              <div className="p-6 rounded-3xl border border-primary/20 bg-gradient-to-r from-primary/10 via-background to-secondary/30 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-sm">
                <div className="flex items-center gap-3.5">
                  <div className="w-12 h-12 rounded-2xl bg-primary/15 text-primary flex items-center justify-center font-bold text-xl shrink-0">
                    📋
                  </div>
                  <div>
                    <h3 className="font-bold text-foreground text-sm sm:text-base">E-Rapor Capaian Pembelajaran Resmi</h3>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      Lihat rekapitulasi nilai formatif, sumatif, dan deskripsi capaian kompetensi Kurikulum Merdeka.
                    </p>
                  </div>
                </div>
                <Button onClick={() => setRaporOpen(true)} className="gap-2 text-xs font-bold shrink-0 shadow-sm rounded-xl">
                  <GraduationCap className="w-4 h-4" />
                  Buka E-Rapor Siswa
                </Button>
              </div>

              {/* Course Search & Filter Bar */}
              <CourseSearchBar
                query={searchQuery}
                onQueryChange={setSearchQuery}
                selectedGrade={selectedGradeFilter}
                onGradeChange={setSelectedGradeFilter}
                selectedSubject={selectedSubjectFilter}
                onSubjectChange={setSelectedSubjectFilter}
              />

              {/* Course Catalog Grid */}
              <section>
                <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <h2 className="text-lg font-bold tracking-tight text-foreground">Katalog Kelas Tambahan</h2>
                    <p className="text-xs text-muted-foreground font-mono">{termLabel(activeTerm)}</p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {(["all", 1, 2] as const).map((sem) => (
                      <Button
                        key={`cat-sem-${sem}`}
                        size="sm"
                        variant={catalogSemester === sem ? "default" : "outline"}
                        onClick={() => setCatalogSemester(sem)}
                        className="text-xs rounded-xl"
                      >
                        {sem === "all" ? "Semua semester" : `Semester ${sem}`}
                      </Button>
                    ))}
                  </div>
                </div>
                {filteredCatalog.length === 0 ? (
                  <p className="text-sm text-muted-foreground p-8 rounded-3xl border border-dashed border-border text-center">
                    {notEnrolled.length === 0
                      ? "Semua kelas sudah kamu ikuti. Hebat!"
                      : "Tidak ada materi yang sesuai dengan filter pencarian."}
                  </p>
                ) : (
                  <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
                    {filteredCatalog.map((m) => (
                      <CourseCard
                        key={m.slug}
                        material={m}
                        onEnroll={() => handleEnroll(m.slug)}
                        isLoading={busy === m.slug}
                      />
                    ))}
                  </div>
                )}
              </section>

              {/* Announcements Section */}
              <section>
                <h2 className="mb-3 flex items-center gap-2 text-base font-bold tracking-tight">
                  <Megaphone className="h-4 w-4 text-primary" /> Pengumuman Terbaru
                </h2>
                <div className="space-y-3">
                  {announcements.length === 0 && (
                    <p className="text-sm text-muted-foreground">Belum ada pengumuman.</p>
                  )}
                  {announcements.map((a) => (
                    <article key={a.id} className="rounded-2xl border border-border/70 bg-card p-4 shadow-xs">
                      <div className="flex items-center justify-between gap-3">
                        <h3 className="font-semibold text-foreground text-sm">{a.title}</h3>
                        <span className="text-xs font-mono text-muted-foreground">{formatDate(a.createdAt)}</span>
                      </div>
                      <p className="mt-1.5 text-xs text-muted-foreground leading-relaxed">{a.body}</p>
                    </article>
                  ))}
                </div>
              </section>
            </TabsContent>

            {/* TAB: RUANG CHAT & KOMUNITAS SANTRI */}
            <TabsContent value="chat" className="space-y-6">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <h3 className="text-lg font-bold text-foreground">Ruang Chat & Komunitas Diskusi Santri</h3>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Berdiskusi materi Informatika, kirim cuplikan kode, bagikan tautan proyek aplikasi, dan tanya jawab dengan sesama santri.
                  </p>
                </div>
              </div>
              <StudentChatHub userId={userId} userGrade={grade} />
            </TabsContent>

            {/* TAB 2: KELAS & MATERI SAYA */}
            <TabsContent value="kelas" className="space-y-6">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <h3 className="text-lg font-bold text-foreground">Daftar Kelas & Materi yang Diikuti</h3>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Lanjutkan modul belajar yang sedang berjalan dan selesaikan seluruh capaian pembelajaran.
                  </p>
                </div>
                <Badge variant="secondary" className="font-mono text-xs">
                  {enrollments.length} Kelas Aktif
                </Badge>
              </div>

              {enrollments.length === 0 ? (
                <div className="p-12 text-center rounded-3xl border border-dashed border-border bg-card">
                  <BookOpen className="w-12 h-12 mx-auto text-muted-foreground/40 mb-3" />
                  <h4 className="text-base font-bold text-foreground">Belum Ada Kelas yang Diikuti</h4>
                  <p className="text-xs text-muted-foreground max-w-sm mx-auto mt-1 mb-5">
                    Silakan buka tab "Ikhtisar" atau katalog di bawah untuk mendaftar materi kelas pertama Anda.
                  </p>
                  <Button size="sm" onClick={() => handleTabChange("belajar")} className="rounded-xl font-bold">
                    Pilih Materi Pembelajaran
                  </Button>
                </div>
              ) : (
                <div className="space-y-4">
                  {filteredEnrolled.map((e) => {
                    const material = findMaterial(e.materialSlug);
                    if (!material) return null;
                    const mp = materialProgress(e.materialSlug, progress);
                    const isOpen = expanded === e.materialSlug;
                    return (
                      <div key={e.id} className="overflow-hidden rounded-3xl border border-border/80 bg-card shadow-xs transition-all hover:border-primary/40">
                        <div className="flex flex-col sm:flex-row gap-4 p-5">
                          <img
                            src={material.image}
                            alt={material.title}
                            className="h-32 sm:h-28 sm:w-40 w-full flex-shrink-0 rounded-2xl object-cover border border-border/60"
                            loading="lazy"
                          />
                          <div className="min-w-0 flex-1 flex flex-col justify-between">
                            <div>
                              <div className="flex flex-wrap items-center gap-2 mb-1.5">
                                <Badge variant="secondary" className="font-bold">Kelas {material.grade}</Badge>
                                <span className="text-xs text-muted-foreground font-mono">{material.subject}</span>
                                {mp.percent === 100 && (
                                  <Badge variant="default" className="bg-success text-success-foreground gap-1">
                                    <CheckCircle2 className="w-3 h-3" /> Tuntas
                                  </Badge>
                                )}
                              </div>
                              <h3 className="font-bold text-base text-foreground truncate">{material.title}</h3>
                              <p className="text-xs text-muted-foreground line-clamp-1 mt-0.5">{(material as any).description || `${material.modules} Modul Pembelajaran · ${material.duration}`}</p>
                            </div>

                            <div className="mt-4 space-y-2">
                              <div className="flex items-center justify-between text-xs font-mono">
                                <span className="text-muted-foreground">Progres Modul:</span>
                                <span className="font-bold text-foreground">{mp.done}/{mp.total} Selesai ({mp.percent}%)</span>
                              </div>
                              <Progress value={mp.percent} className="h-2 rounded-full" />
                            </div>

                            <div className="mt-4 flex flex-wrap items-center gap-2">
                              <Button size="sm" variant="default" asChild className="rounded-xl font-bold gap-1.5 shadow-xs">
                                <Link to="/materi/$slug" params={{ slug: material.slug }}>
                                  Lanjutkan Belajar <ArrowRight className="w-3.5 h-3.5" />
                                </Link>
                              </Button>

                              <Button size="sm" variant="secondary" onClick={() => setExpanded(isOpen ? null : e.materialSlug)} className="rounded-xl text-xs">
                                {isOpen ? "Tutup Modul" : "Lihat Silabus"}
                                <ChevronDown className={`ml-1 h-3.5 w-3.5 transition-transform ${isOpen ? "rotate-180" : ""}`} />
                              </Button>

                              {mp.percent === 100 && (
                                <Button
                                  size="sm"
                                  variant="outline"
                                  className="rounded-xl border-primary/30 text-primary font-bold gap-1.5"
                                  disabled={issuing === material.slug}
                                  onClick={() => handleClaimCertificate(material.slug)}
                                >
                                  <Award className="h-4 w-4" />
                                  {issuing === material.slug ? "Menerbitkan..." : "Klaim Sertifikat"}
                                </Button>
                              )}

                              <Button
                                size="sm"
                                variant="ghost"
                                className="rounded-xl text-xs text-muted-foreground hover:text-destructive"
                                disabled={busy === material.slug}
                                onClick={() => handleUnenroll(material.slug)}
                              >
                                Keluar Kelas
                              </Button>
                            </div>
                          </div>
                        </div>

                        {isOpen && (
                          <div className="border-t border-border/60 bg-muted/20 p-4">
                            <h4 className="text-xs font-bold text-foreground uppercase tracking-wider mb-2 font-mono">
                              Daftar Modul Pembelajaran:
                            </h4>
                            <div className="space-y-1.5">
                              {material.moduleList.map((mod, i) => {
                                const done = progress.some((p) => p.materialSlug === material.slug && p.moduleIndex === i);
                                return (
                                  <button
                                    key={mod}
                                    className="flex w-full items-center justify-between p-2.5 rounded-xl text-left text-xs transition-colors hover:bg-background/80 border border-transparent hover:border-border/60"
                                    onClick={() => handleToggleModule(material.slug, i, !done)}
                                  >
                                    <div className="flex items-center gap-2.5 min-w-0">
                                      {done ? (
                                        <CheckCircle2 className="h-4 w-4 flex-shrink-0 text-success" />
                                      ) : (
                                        <Circle className="h-4 w-4 flex-shrink-0 text-muted-foreground" />
                                      )}
                                      <span className={done ? "text-muted-foreground line-through font-normal truncate" : "font-semibold text-foreground truncate"}>
                                        {i + 1}. {mod}
                                      </span>
                                    </div>
                                    <span className="text-[10px] font-mono text-muted-foreground shrink-0 ml-2">
                                      {done ? "Selesai" : "Tandai Selesai"}
                                    </span>
                                  </button>
                                );
                              })}
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </TabsContent>

            {/* TAB 3: TUGAS & PROYEK */}
            <TabsContent value="tugas" className="space-y-6">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <h3 className="text-lg font-bold text-foreground">Tugas & Proyek Siswa</h3>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Daftar penugasan terstruktur dengan panduan rubrik penilaian guru.
                  </p>
                </div>
                <Badge variant="secondary" className="font-mono text-xs">
                  {assignments.length} Tugas Terbit
                </Badge>
              </div>

              {assignments.length === 0 ? (
                <div className="p-12 text-center rounded-3xl border border-dashed border-border bg-card">
                  <FileText className="w-12 h-12 mx-auto text-muted-foreground/40 mb-3" />
                  <h4 className="text-base font-bold text-foreground">Belum Ada Tugas Aktif</h4>
                  <p className="text-xs text-muted-foreground mt-1">
                    Guru belum memberikan penugasan baru pada kelas yang Anda ikuti.
                  </p>
                </div>
              ) : (
                <div className="grid gap-4 sm:grid-cols-2">
                  {assignments.map((a) => {
                    const material = findMaterial(a.material_slug);
                    const submitted = a.submission?.submitted_at;
                    const isLate = a.due_date && !submitted && new Date(a.due_date) < new Date();
                    return (
                      <div key={a.id} className="p-5 rounded-3xl border border-border/80 bg-card shadow-xs flex flex-col justify-between transition-all hover:border-primary/40">
                        <div>
                          <div className="flex items-center justify-between gap-2 mb-2">
                            <Badge variant={submitted ? "default" : isLate ? "destructive" : "secondary"} className="text-[11px] font-bold">
                              {submitted ? "Sudah Dikumpulkan" : isLate ? "Melewati Batas" : "Perlu Dikerjakan"}
                            </Badge>
                            <span className="font-mono text-xs font-bold text-primary px-2 py-0.5 rounded-md bg-primary/10">
                              Maks {a.max_score} Poin
                            </span>
                          </div>

                          <h4 className="font-bold text-base text-foreground">{a.title}</h4>
                          <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{a.description || "Kerjakan instruksi tugas sesuai modul pembelajaran."}</p>

                          <div className="mt-3 pt-3 border-t border-border/50 text-xs font-mono space-y-1 text-muted-foreground">
                            <p>Materi: <span className="text-foreground font-medium">{material?.title || a.material_slug}</span></p>
                            {a.due_date && (
                              <p className={isLate ? "text-destructive font-bold" : ""}>
                                Tenggat: {new Date(a.due_date).toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric", hour: "2-digit", minute: "2-digit" })}
                              </p>
                            )}
                          </div>
                        </div>

                        <div className="mt-5 pt-3 border-t border-border/60 flex items-center justify-between gap-2">
                          {submitted ? (
                            <span className="text-xs font-semibold text-success flex items-center gap-1.5">
                              <CheckCircle2 className="w-4 h-4" /> Dikumpulkan {new Date(a.submission.submitted_at).toLocaleDateString("id-ID")}
                            </span>
                          ) : (
                            <span className="text-xs text-amber-500 font-semibold flex items-center gap-1.5">
                              <Clock className="w-4 h-4" /> Menunggu Pengumpulan
                            </span>
                          )}

                          <Button size="sm" asChild className="rounded-xl font-bold text-xs">
                            <Link to="/materi/$slug" params={{ slug: a.material_slug }}>
                              {submitted ? "Lihat Jawaban" : "Kerjakan Tugas"}
                            </Link>
                          </Button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </TabsContent>

            {/* TAB 4: KUIS & EVALUASI */}
            <TabsContent value="kuis" className="space-y-6">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <h3 className="text-lg font-bold text-foreground">Kuis & Evaluasi Pemahaman</h3>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Uji pemahaman materi secara mandiri dengan penilaian otomatis instan.
                  </p>
                </div>
                <Badge variant="secondary" className="font-mono text-xs">
                  {quizzes.length} Kuis Tersedia
                </Badge>
              </div>

              {quizzes.length === 0 ? (
                <div className="p-12 text-center rounded-3xl border border-dashed border-border bg-card">
                  <HelpCircle className="w-12 h-12 mx-auto text-muted-foreground/40 mb-3" />
                  <h4 className="text-base font-bold text-foreground">Belum Ada Kuis</h4>
                  <p className="text-xs text-muted-foreground mt-1">
                    Kuis akan muncul otomatis saat guru menerbitkan asesmen baru.
                  </p>
                </div>
              ) : (
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {quizzes.map((q) => {
                    const material = findMaterial(q.material_slug);
                    const attempt = quizAttempts.find((a) => a.quiz_id === q.id);
                    return (
                      <div key={q.id} className="p-5 rounded-3xl border border-border/80 bg-card shadow-xs flex flex-col justify-between transition-all hover:border-primary/40">
                        <div>
                          <div className="flex items-center justify-between gap-2 mb-2">
                            <Badge variant={attempt?.is_passed ? "default" : attempt ? "destructive" : "secondary"}>
                              {attempt?.is_passed ? "Lulus" : attempt ? "Belum Lulus" : "Belum Dikerjakan"}
                            </Badge>
                            <span className="font-mono text-xs text-muted-foreground">
                              KKM: {q.passing_score}%
                            </span>
                          </div>

                          <h4 className="font-bold text-base text-foreground mt-1">{q.title}</h4>
                          <p className="text-xs text-muted-foreground mt-1">{material?.title || q.material_slug}</p>

                          {attempt && (
                            <div className="mt-4 p-3 rounded-2xl bg-secondary/50 border border-border/60 text-xs">
                              <div className="flex justify-between items-center font-mono">
                                <span>Skor Terbaik:</span>
                                <span className="font-extrabold text-foreground text-sm">{attempt.score}%</span>
                              </div>
                            </div>
                          )}
                        </div>

                        <div className="mt-5 pt-3 border-t border-border/60 flex items-center justify-between">
                          <span className="text-[11px] font-mono text-muted-foreground">
                            {attempt ? "Boleh Ulang" : "10 Soal Pilihan Ganda"}
                          </span>
                          <Button size="sm" asChild className="rounded-xl font-bold text-xs">
                            <Link to="/materi/$slug" params={{ slug: q.material_slug }}>
                              {attempt ? "Ulangi Kuis" : "Mulai Kuis"}
                            </Link>
                          </Button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </TabsContent>

            {/* TAB 5: JADWAL & PRESENSI */}
            <TabsContent value="jadwal" className="space-y-6">
              <StudentSchedulePanel userId={userId} grade={grade} />
            </TabsContent>

            {/* TAB 6: PERINGKAT & LIGA XP */}
            <TabsContent value="peringkat" className="space-y-6">
              <GamificationLeagueCard />
              <LeaderboardPanel userId={userId} grade={grade} />
              <LearningStreakHeatmap />
            </TabsContent>

            {/* TAB 7: PRESTASI & SERTIFIKAT */}
            <TabsContent value="sertifikat" className="space-y-6">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <h3 className="text-lg font-bold text-foreground">Sertifikat Kelulusan Resmi Digital</h3>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Sertifikat resmi terverifikasi dengan nomor seri dan kode verifikasi digital.
                  </p>
                </div>
                <Badge variant="secondary" className="font-mono text-xs">
                  {certificates.length} Sertifikat Diraih
                </Badge>
              </div>

              {certificates.length === 0 ? (
                <div className="p-12 text-center rounded-3xl border border-dashed border-border bg-card">
                  <Award className="w-12 h-12 mx-auto text-muted-foreground/40 mb-3" />
                  <h4 className="text-base font-bold text-foreground">Belum Ada Sertifikat</h4>
                  <p className="text-xs text-muted-foreground max-w-sm mx-auto mt-1 mb-5">
                    Selesaikan 100% modul dan lulus kuis untuk mengklaim sertifikat digital Anda.
                  </p>
                  <Button size="sm" onClick={() => handleTabChange("kelas")} className="rounded-xl font-bold">
                    Buka Kelas Belajar
                  </Button>
                </div>
              ) : (
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {certificates.map((c) => {
                    const meta = c.metadata || c;
                    const material = findMaterial(c.material_slug) || { title: meta.material_title || c.material_slug };
                    return (
                      <div key={c.id} className="p-5 rounded-3xl border border-border/80 bg-card shadow-xs flex flex-col justify-between transition-all hover:border-primary/40">
                        <div>
                          <div className="w-12 h-12 rounded-2xl bg-primary/10 text-primary flex items-center justify-center mb-3">
                            <Award className="w-6 h-6" />
                          </div>
                          <h4 className="font-bold text-base text-foreground">{material.title}</h4>
                          <p className="font-mono text-xs text-muted-foreground mt-1">No: {c.certificate_number}</p>
                          <p className="text-xs text-muted-foreground mt-0.5 font-mono">
                            Diterbitkan: {new Date(c.created_at || Date.now()).toLocaleDateString("id-ID")}
                          </p>
                        </div>

                        <Button
                          className="mt-5 w-full font-bold rounded-xl text-xs gap-1.5 shadow-xs"
                          size="sm"
                          variant="default"
                          onClick={() =>
                            setSelectedCert({
                              number: c.certificate_number,
                              courseTitle: material.title,
                              studentName: "Santri Digisschool",
                              issueDate: new Date(c.created_at || Date.now()).toLocaleDateString("id-ID"),
                            })
                          }
                        >
                          <Award className="w-3.5 h-3.5" />
                          Lihat & Unduh Sertifikat
                        </Button>
                      </div>
                    );
                  })}
                </div>
              )}
            </TabsContent>

            {/* TAB 8: E-RAPOR AKADEMIK */}
            <TabsContent value="rapor" className="space-y-6">
              <div className="p-8 rounded-3xl border border-primary/20 bg-gradient-to-br from-primary/10 via-background to-secondary/30 text-center max-w-2xl mx-auto shadow-md">
                <div className="w-16 h-16 rounded-3xl bg-primary/15 text-primary flex items-center justify-center mx-auto mb-4">
                  <GraduationCap className="w-8 h-8" />
                </div>
                <h3 className="text-2xl font-extrabold text-foreground">E-Rapor Digital Kurikulum Merdeka</h3>
                <p className="text-xs sm:text-sm text-muted-foreground mt-2 max-w-lg mx-auto leading-relaxed">
                  Laporan hasil belajar resmi jenjang SMP Fase D (Kelas 7, 8, 9) lengkap dengan deskripsi Capaian Pembelajaran (CP) dan catatan wali kelas.
                </p>
                <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
                  <Button size="lg" onClick={() => setRaporOpen(true)} className="rounded-2xl font-bold gap-2 shadow-lg shadow-primary/20">
                    <GraduationCap className="w-5 h-5" />
                    Buka E-Rapor Lengkap
                  </Button>
                  <Button size="lg" variant="outline" asChild className="rounded-2xl font-semibold">
                    <Link to="/siswa/$id" params={{ id: userId }}>
                      Lihat Portofolio Prestasi
                    </Link>
                  </Button>
                </div>
              </div>
            </TabsContent>

            {/* TAB 9: STATISTIK BELAJAR */}
            <TabsContent value="progres" className="space-y-6">
              <ProgressPanel
                enrollments={enrollments}
                progress={progress}
                quizAttempts={quizAttempts}
                certificates={certificates}
              />
            </TabsContent>

            {/* TAB 10: PROFIL SANTRI */}
            <TabsContent value="profil" className="space-y-6">
              <ProfilePanel userId={userId} />
            </TabsContent>
          </Tabs>
        </div>
      )}

      {/* Verified Certificate Modal */}
      <CertificateModal
        open={!!selectedCert}
        onOpenChange={(open) => !open && setSelectedCert(null)}
        certificate={selectedCert}
      />

      {/* Official Kurikulum Merdeka E-Rapor Modal */}
      <ERaporModal
        open={raporOpen}
        onOpenChange={setRaporOpen}
        grade={grade || undefined}
      />
    </DashboardShell>
  );
}
