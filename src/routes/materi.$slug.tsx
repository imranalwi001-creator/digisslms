import { createFileRoute, notFound, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { BookOpen, Clock, Layers, PlayCircle, ArrowLeft, GraduationCap, ChevronRight, HelpCircle, FileText, Award, CheckCircle2, XCircle, Loader2, Lock } from "lucide-react";
import { getMaterialBySlug } from "@/lib/materials";
import { useCatalog, type CatalogMaterial } from "@/lib/materials-db";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { CoursePlayerTabs } from "@/components/lms/CoursePlayerTabs";
import { FocusedLMSVideoPlayer } from "@/components/lms/FocusedLMSVideoPlayer";
import { getStoredContents } from "@/lib/course-content";
import {
  listPublishedQuizzesForMaterial,
  getQuizForStudent,
  submitQuizAttempt,
  listMyQuizAttempts,
  listPublishedAssignmentsForMaterial,
  getMyAssignmentSubmission,
  submitAssignment,
  getEnrollmentForMaterial,
} from "@/lib/lms.functions";

const SITE_URL = "https://ruangblajar.lovable.app";

export const Route = createFileRoute("/materi/$slug")({
  head: ({ params }) => {
    const material = getMaterialBySlug(params.slug);
    const title = material ? `${material.title} — Kelas ${material.grade}` : "Materi tidak ditemukan";
    const description = material
      ? `Materi ${material.subject} kelas ${material.grade}: ${material.title}. ${material.modules} modul, ${material.duration}. Kurikulum SMP.`
      : "Halaman materi tidak ditemukan.";
    const url = `${SITE_URL}/materi/${params.slug}`;
    const image = material
      ? material.image.startsWith("http")
        ? material.image
        : `${SITE_URL}${material.image}`
      : null;

    return {
      meta: [
        { title },
        { name: "description", content: description },
        { property: "og:title", content: title },
        { property: "og:description", content: description },
        { property: "og:type", content: "article" },
        { property: "og:url", content: url },
        ...(image
          ? [
              { property: "og:image", content: image },
              { name: "twitter:image", content: image },
            ]
          : []),
        { name: "twitter:card", content: "summary_large_image" },
        ...(material ? [] : [{ name: "robots", content: "noindex" }]),
      ],
      links: [{ rel: "canonical", href: url }],
      scripts: material
        ? [
            {
              type: "application/ld+json",
              children: JSON.stringify({
                "@context": "https://schema.org",
                "@type": "Course",
                name: material.title,
                description,
                url,
                image,
                inLanguage: "id-ID",
                educationalLevel: `SMP Kelas ${material.grade}`,
                about: material.subject,
                timeRequired: material.duration,
                provider: {
                  "@type": "Organization",
                  name: "Continuum LMS",
                  url: SITE_URL,
                },
                hasPart: material.moduleList.map((name, i) => ({
                  "@type": "LearningResource",
                  position: i + 1,
                  name,
                })),
              }),
            },
          ]
        : undefined,
    };
  },
  component: MaterialDetailPage,
});

function MaterialDetailPage() {
  const { slug } = Route.useParams();
  const { list: materials, loading: catalogLoading } = useCatalog();
  const material = materials.find((m) => m.slug === slug);

  const [loading, setLoading] = useState(true);
  const [selectedModuleIndex, setSelectedModuleIndex] = useState(0);
  const [enrolled, setEnrolled] = useState(false);
  const [myGrade, setMyGrade] = useState<number | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [quizzes, setQuizzes] = useState<any[]>([]);
  const [assignments, setAssignments] = useState<any[]>([]);
  const [attempts, setAttempts] = useState<any[]>([]);
  const [submissions, setSubmissions] = useState<Record<string, any>>({});

  const [activeQuiz, setActiveQuiz] = useState<any>(null);
  const [quizQuestions, setQuizQuestions] = useState<any[]>([]);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [quizBusy, setQuizBusy] = useState(false);
  const [quizResult, setQuizResult] = useState<any>(null);

  const [activeAssignment, setActiveAssignment] = useState<any>(null);
  const [assignmentAnswer, setAssignmentAnswer] = useState("");
  const [assignmentBusy, setAssignmentBusy] = useState(false);

  const fetchQuizzes = useServerFn(listPublishedQuizzesForMaterial);
  const fetchAssignments = useServerFn(listPublishedAssignmentsForMaterial);
  const fetchAttempts = useServerFn(listMyQuizAttempts);
  const fetchEnrollment = useServerFn(getEnrollmentForMaterial);
  const fetchQuiz = useServerFn(getQuizForStudent);
  const submitQuiz = useServerFn(submitQuizAttempt);
  const fetchSubmission = useServerFn(getMyAssignmentSubmission);
  const submitAsg = useServerFn(submitAssignment);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true);
      try {
        const [qData, aData, atData, en] = await Promise.all([
          fetchQuizzes({ data: { materialSlug: slug } }),
          fetchAssignments({ data: { materialSlug: slug } }),
          fetchAttempts().catch(() => ({ attempts: [] })),
          fetchEnrollment({ data: { materialSlug: slug } }).catch(() => ({ enrolled: false })),
        ]);
        if (cancelled) return;
        setQuizzes(qData.quizzes || []);
        setAssignments(aData.assignments || []);
        setAttempts(atData.attempts || []);
        setEnrolled(en.enrolled);

        // Determine the viewer's class so we can lock materials from other grades.
        const { supabase } = await import("@/integrations/supabase/client");
        const { data: auth } = await supabase.auth.getUser();
        if (auth?.user) {
          const [{ data: prof }, { data: roles }] = await Promise.all([
            (supabase as any).from("profiles").select("grade").eq("id", auth.user.id).maybeSingle(),
            (supabase as any).from("user_roles").select("role").eq("user_id", auth.user.id),
          ]);
          if (!cancelled) {
            setMyGrade(prof?.grade ?? null);
            setIsAdmin((roles || []).some((r: any) => r.role === "admin" || r.role === "guru"));
          }
        }

        const subMap: Record<string, any> = {};
        await Promise.all(
          (aData.assignments || []).map(async (a: any) => {
            const { submission } = await fetchSubmission({ data: { id: a.id } }).catch(() => ({ submission: null }));
            subMap[a.id] = submission;
          }),
        );
        if (!cancelled) setSubmissions(subMap);
      } catch (err) {
        // Public page: ignore auth failures for quizzes/assignments
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, [slug]);

  const attemptMap = useMemo(() => {
    const map: Record<string, any> = {};
    for (const a of attempts) {
      if (!map[a.quiz_id] || new Date(a.created_at) > new Date(map[a.quiz_id].created_at)) {
        map[a.quiz_id] = a;
      }
    }
    return map;
  }, [attempts]);

  if (!material) {
    if (catalogLoading) {
      return (
        <div className="flex min-h-screen items-center justify-center">
          <Loader2 className="h-6 w-6 animate-spin text-primary" />
        </div>
      );
    }
    throw notFound();
  }

  const currentModuleTitle = material.moduleList?.[selectedModuleIndex] || material.title;
  const gradeLocked = !isAdmin && myGrade !== null && myGrade !== material.grade;

  if (gradeLocked) {
    return (
      <div className="min-h-screen bg-background text-foreground flex flex-col">
        <SiteHeader />
        <main className="flex-1 flex items-center justify-center px-5 pt-28 pb-16">
          <div className="max-w-md w-full text-center p-8 rounded-3xl border border-border/80 bg-card shadow-2xl animate-fade-up-blur">
            <div className="w-16 h-16 rounded-3xl bg-amber-500/10 text-amber-500 border border-amber-500/20 flex items-center justify-center mx-auto mb-5 shadow-inner">
              <Lock className="w-8 h-8" />
            </div>
            <span className="font-mono text-xs font-bold uppercase tracking-widest text-amber-500 bg-amber-500/10 px-3 py-1 rounded-full border border-amber-500/20 mb-3 inline-block">
              Akses Dibatasi Berdasarkan Jenjang
            </span>
            <h2 className="text-2xl font-extrabold text-foreground tracking-tight">
              Khusus Siswa Kelas {material.grade} SMP
            </h2>
            <p className="text-sm text-muted-foreground mt-2 leading-relaxed">
              Materi <strong>"{material.title}"</strong> dikhususkan untuk jenjang <strong>Kelas {material.grade} SMP</strong>. Akun Anda saat ini terdaftar pada jenjang <strong>Kelas {myGrade} SMP</strong>.
            </p>

            <div className="mt-6 space-y-2.5">
              <Link
                to="/dashboard"
                className="w-full inline-flex items-center justify-center gap-2 rounded-2xl bg-primary px-5 py-3 text-sm font-bold text-primary-foreground shadow-lg shadow-primary/25 transition-all hover:bg-primary/90"
              >
                Buka Materi Kelas {myGrade} Saya
              </Link>
              <Link
                to="/"
                className="w-full inline-flex items-center justify-center gap-2 rounded-2xl border border-border bg-background px-5 py-3 text-sm font-semibold text-muted-foreground hover:text-foreground transition-all"
              >
                Kembali ke Beranda
              </Link>
            </div>
          </div>
        </main>
        <SiteFooter />
      </div>
    );
  }

  const sameGrade = materials.filter((m) => m.grade === material.grade && m.slug !== material.slug);
  const others = materials.filter((m) => m.grade !== material.grade).slice(0, 3);

  const startQuiz = async (quiz: any) => {
    if (gradeLocked) {
      toast.info(`Materi ini untuk kelas ${material.grade}. Kamu terdaftar di kelas ${myGrade}.`);
      return;
    }
    if (!enrolled) {
      toast.info("Ikuti kelas ini terlebih dahulu untuk mengerjakan kuis");
      return;
    }
    setQuizResult(null);
    setAnswers({});
    setQuizBusy(true);
    try {
      const { quiz: fullQuiz, questions } = await fetchQuiz({ data: { id: quiz.id } });
      setActiveQuiz(fullQuiz);
      setQuizQuestions(questions || []);
    } catch (err: any) {
      toast.error(err.message || "Gagal memuat kuis");
    } finally {
      setQuizBusy(false);
    }
  };

  const handleSubmitQuiz = async () => {
    if (!activeQuiz) return;
    const answered = quizQuestions.filter((q) => answers[q.id]).length;
    if (answered < quizQuestions.length) {
      toast.warning("Jawab semua soal terlebih dahulu");
      return;
    }
    setQuizBusy(true);
    try {
      const result = await submitQuiz({ data: { quizId: activeQuiz.id, answers } });
      setQuizResult(result);
      const fresh = await fetchAttempts();
      setAttempts(fresh.attempts || []);
    } catch (err: any) {
      toast.error(err.message || "Gagal mengirim jawaban");
    } finally {
      setQuizBusy(false);
    }
  };

  const closeQuiz = () => {
    setActiveQuiz(null);
    setQuizQuestions([]);
    setAnswers({});
    setQuizResult(null);
  };

  const handleSubmitAssignment = async () => {
    if (!activeAssignment || !assignmentAnswer.trim()) {
      toast.warning("Tulis jawaban tugas terlebih dahulu");
      return;
    }
    setAssignmentBusy(true);
    try {
      await submitAsg({ data: { assignmentId: activeAssignment.id, answerText: assignmentAnswer.trim() } });
      toast.success("Tugas berhasil dikumpulkan");
      const { submission } = await fetchSubmission({ data: { id: activeAssignment.id } });
      setSubmissions((prev) => ({ ...prev, [activeAssignment.id]: submission }));
      setActiveAssignment(null);
      setAssignmentAnswer("");
    } catch (err: any) {
      toast.error(err.message || "Gagal mengumpulkan tugas");
    } finally {
      setAssignmentBusy(false);
    }
  };

  const activeModuleVideoUrl = useMemo(() => {
    if (!material) return "";
    const contents = getStoredContents(slug, selectedModuleIndex);
    const videoItem = contents.find((c) => c.type === "video");
    if (videoItem?.url) return videoItem.url;
    const fallbackUrls = [
      "https://www.youtube.com/watch?v=mUXo-S8gkds",
      "https://www.youtube.com/watch?v=kM9ASKAni_s",
      "https://www.youtube.com/watch?v=f9wVvR99q6s",
      "https://www.youtube.com/watch?v=8popR3x-VMY",
    ];
    return fallbackUrls[selectedModuleIndex % fallbackUrls.length];
  }, [slug, selectedModuleIndex, material]);

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      <SiteHeader />

      <main className="flex-1 pt-24 sm:pt-28 pb-20">
        {/* Interactive Course Player & Theater Mode */}
        <div className="max-w-6xl mx-auto px-5">
          {/* Back link & breadcrumb */}
          <div className="flex flex-wrap items-center justify-between gap-4 mb-6 pb-4 border-b border-border/50">
            <div className="flex items-center gap-2 text-xs sm:text-sm font-medium text-muted-foreground flex-wrap">
              <Link
                to="/"
                className="hover:text-foreground transition-colors"
              >
                Beranda
              </Link>
              <ChevronRight className="w-3.5 h-3.5 opacity-50" />
              <Link
                to="/dashboard"
                className="hover:text-foreground transition-colors"
              >
                Dashboard
              </Link>
              <ChevronRight className="w-3.5 h-3.5 opacity-50" />
              <span className="text-foreground font-semibold truncate max-w-[200px] sm:max-w-none">
                {material.title}
              </span>
            </div>

            <div className="flex items-center gap-2">
              <span className="font-mono text-xs px-3 py-1 rounded-full bg-secondary text-secondary-foreground font-bold border border-border/60">
                Kelas {material.grade} {material.semester ? `· Sem ${material.semester}` : ""}
              </span>
              <span className="font-mono text-xs px-3 py-1 rounded-full bg-primary/15 text-primary font-bold border border-primary/20">
                {material.element || material.subject}
              </span>
            </div>
          </div>

          {/* Player Grid: Theater on Left, Module Syllabus on Right */}
          <div className="grid lg:grid-cols-[1fr_360px] xl:grid-cols-[1fr_380px] gap-8 items-start">
            {/* Left: Main Stage & Lecture Content */}
            <div className="space-y-6 min-w-0">
              {/* Focused Clean LMS Video Player (Zero-distraction / Native controls) */}
              <FocusedLMSVideoPlayer
                videoUrl={activeModuleVideoUrl}
                title={currentModuleTitle}
                moduleName={`Modul ${selectedModuleIndex + 1}`}
                thumbnailUrl={material.image}
                durationString={material.duration}
                onCompleted={() => {
                  toast.success(`Modul ${selectedModuleIndex + 1} (${currentModuleTitle}) selesai dipelajari!`);
                }}
              />

              {/* Module Action & Progress Controller */}
              <div className="flex flex-wrap items-center justify-between gap-3 p-4 rounded-2xl border border-border/80 bg-card shadow-xs">
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={selectedModuleIndex === 0}
                    onClick={() => setSelectedModuleIndex((prev) => Math.max(0, prev - 1))}
                    className="text-xs font-semibold"
                  >
                    Modul Sebelumnya
                  </Button>
                  <Button
                    size="sm"
                    disabled={selectedModuleIndex >= material.moduleList.length - 1}
                    onClick={() => setSelectedModuleIndex((prev) => Math.min(material.moduleList.length - 1, prev + 1))}
                    className="text-xs font-bold gap-1"
                  >
                    Lanjut Modul Berikutnya
                    <ChevronRight className="w-3.5 h-3.5" />
                  </Button>
                </div>

                <div className="flex items-center gap-2">
                  <Button
                    size="sm"
                    variant="secondary"
                    className="text-xs font-bold gap-1.5 border border-success/30 hover:bg-success/10 hover:text-success transition-colors"
                    onClick={() => toast.success("Modul berhasil ditandai selesai! Progres Anda tersimpan.")}
                  >
                    <CheckCircle2 className="w-4 h-4 text-success" />
                    Tandai Selesai
                  </Button>
                </div>
              </div>

              {/* Course Player Tabs (Overview, Coding Sandbox, Notes, Q&A) */}
              <CoursePlayerTabs
                materialSlug={slug}
                currentModuleIndex={selectedModuleIndex}
                currentModuleName={currentModuleTitle}
                description={material.description || ""}
                subject={material.subject}
                grade={material.grade}
              />
            </div>

            {/* Right: Course Curriculum Syllabus */}
            <aside className="space-y-6 lg:sticky lg:top-28">
              <div className="rounded-3xl border border-border/80 bg-card p-5 sm:p-6 shadow-sm">
                <div className="flex items-center justify-between border-b border-border/60 pb-3.5 mb-4">
                  <div>
                    <h3 className="font-bold text-foreground text-base">Daftar Modul Kelas</h3>
                    <p className="text-xs text-muted-foreground font-mono mt-0.5">
                      {material.moduleList.length} Modul Pembelajaran
                    </p>
                  </div>
                  <span className="font-mono text-xs font-bold text-primary px-2.5 py-1 rounded-md bg-primary/10 border border-primary/20">
                    {material.duration}
                  </span>
                </div>

                {/* Progress Bar inside Playlist */}
                <div className="mb-4 p-3 rounded-2xl bg-secondary/50 border border-border/40">
                  <div className="flex justify-between items-center text-xs font-mono text-muted-foreground mb-1.5">
                    <span>Progres Belajar</span>
                    <span className="font-bold text-foreground">
                      {selectedModuleIndex + 1}/{material.moduleList.length} Modul
                    </span>
                  </div>
                  <div className="h-2 w-full rounded-full bg-secondary overflow-hidden">
                    <div
                      className="h-full rounded-full bg-primary transition-all duration-500"
                      style={{
                        width: `${Math.round(((selectedModuleIndex + 1) / material.moduleList.length) * 100)}%`,
                      }}
                    />
                  </div>
                </div>

                {/* Module Items Scrollable */}
                <div className="space-y-2.5 max-h-[460px] overflow-y-auto pr-1">
                  {material.moduleList.map((mod, i) => {
                    const isSelected = selectedModuleIndex === i;
                    const isPassed = i < selectedModuleIndex;
                    return (
                      <button
                        key={i}
                        onClick={() => setSelectedModuleIndex(i)}
                        className={`w-full text-left p-3.5 rounded-2xl border flex items-start gap-3 transition-all cursor-pointer ${
                          isSelected
                            ? "bg-primary/10 border-primary text-foreground shadow-xs font-medium ring-1 ring-primary/40"
                            : "bg-background/70 border-border/60 hover:bg-secondary/70 text-muted-foreground hover:text-foreground"
                        }`}
                      >
                        <span
                          className={`w-7 h-7 rounded-xl shrink-0 flex items-center justify-center text-xs font-mono font-bold transition-colors ${
                            isSelected
                              ? "bg-primary text-primary-foreground shadow-xs"
                              : isPassed
                              ? "bg-success/15 text-success border border-success/30"
                              : "bg-secondary text-secondary-foreground"
                          }`}
                        >
                          {isPassed ? <CheckCircle2 className="w-4 h-4" /> : i + 1}
                        </span>
                        <div className="min-w-0 flex-1">
                          <p className={`text-xs sm:text-sm leading-snug ${isSelected ? "font-bold text-foreground" : "font-medium"}`}>
                            {mod}
                          </p>
                          <span className="text-[10px] font-mono text-muted-foreground/80 mt-1 block">
                            20-30 menit · Video & Interaktif
                          </span>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Quizzes and Assessment Quick Access */}
              <div className="rounded-3xl border border-border/80 bg-card p-5 sm:p-6 shadow-sm">
                <div className="flex items-center justify-between mb-3.5">
                  <h3 className="font-bold text-foreground text-sm">Kuis & Penugasan</h3>
                  <span className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground">
                    Evaluasi
                  </span>
                </div>

                {quizzes.length === 0 && assignments.length === 0 ? (
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    Belum ada kuis atau tugas untuk materi ini.
                  </p>
                ) : (
                  <div className="space-y-2">
                    {quizzes.map((q) => {
                      const attempt = attemptMap[q.id];
                      return (
                        <div key={q.id} className="p-3 rounded-xl border border-border/60 bg-background flex items-center justify-between gap-2">
                          <div className="min-w-0 flex-1">
                            <p className="text-xs font-semibold text-foreground truncate">{q.title}</p>
                            <p className="text-[10px] font-mono text-muted-foreground">Lulus: {q.passing_score}%</p>
                          </div>
                          <Button size="sm" variant="outline" className="h-7 text-xs px-2.5 shrink-0" onClick={() => startQuiz(q)}>
                            {attempt ? `Skor ${attempt.score}%` : "Ikuti"}
                          </Button>
                        </div>
                      );
                    })}

                    {assignments.map((a) => {
                      const sub = submissions[a.id];
                      return (
                        <div key={a.id} className="p-3 rounded-xl border border-border/60 bg-background flex items-center justify-between gap-2">
                          <div className="min-w-0 flex-1">
                            <p className="text-xs font-semibold text-foreground truncate">{a.title}</p>
                            <p className="text-[10px] font-mono text-muted-foreground">{a.max_score} Poin</p>
                          </div>
                          <Button
                            size="sm"
                            variant={sub ? "outline" : "default"}
                            className="h-7 text-xs px-2.5 shrink-0"
                            onClick={() => {
                              setActiveAssignment(a);
                              setAssignmentAnswer(sub?.answer_text || "");
                            }}
                          >
                            {sub ? "Terkumpul" : "Kerjakan"}
                          </Button>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </aside>
          </div>
        </div>
      </main>

      <SiteFooter />

      {/* Quiz Modal */}
      <Dialog open={!!activeQuiz} onOpenChange={(open) => !open && closeQuiz()}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{quizResult ? "Hasil kuis" : activeQuiz?.title}</DialogTitle>
            <DialogDescription>
              {quizResult
                ? "Lihat hasil penilaian kuis kamu di bawah."
                : `Jawab semua soal dengan cermat. Nilai lulus ${activeQuiz?.passing_score}%.`}
            </DialogDescription>
          </DialogHeader>

          {quizResult ? (
            <div className="space-y-4">
              <div className={`rounded-xl p-4 text-center ${quizResult.isPassed ? "bg-primary/10 text-primary" : "bg-destructive/10 text-destructive"}`}>
                {quizResult.isPassed ? (
                  <CheckCircle2 className="mx-auto h-8 w-8 mb-2" />
                ) : (
                  <XCircle className="mx-auto h-8 w-8 mb-2" />
                )}
                <p className="text-2xl font-bold">{quizResult.percent}%</p>
                <p className="text-sm">{quizResult.isPassed ? "Selamat, kamu lulus!" : "Belum lulus, silakan ulangi."}</p>
              </div>
              <div className="space-y-3">
                {quizResult.results?.map((r: any, i: number) => (
                  <div key={i} className="rounded-lg border border-border/60 p-3">
                    <p className="text-sm font-medium">{i + 1}. {r.question}</p>
                    <p className="text-xs mt-1">
                      Jawaban kamu: <span className={r.isCorrect ? "text-primary" : "text-destructive"}>{r.selectedLabel}</span>
                    </p>
                    {!r.isCorrect && <p className="text-xs text-muted-foreground mt-1">Benar: {r.correctLabel}</p>}
                    {r.explanation && <p className="text-xs text-muted-foreground mt-1">{r.explanation}</p>}
                  </div>
                ))}
              </div>
              <Button className="w-full" onClick={closeQuiz}>Tutup</Button>
            </div>
          ) : (
            <div className="space-y-6">
              {quizQuestions.map((q, i) => (
                <div key={q.id} className="space-y-2">
                  <Label className="font-medium">{i + 1}. {q.question}</Label>
                  <RadioGroup
                    value={answers[q.id] || ""}
                    onValueChange={(val) => setAnswers((prev) => ({ ...prev, [q.id]: val }))}
                    className="space-y-2"
                  >
                    {q.options.map((opt: any, idx: number) => (
                      <div key={idx} className="flex items-center gap-2 rounded-lg border border-border/60 p-2 hover:bg-accent/40">
                        <RadioGroupItem value={opt.id} id={`${q.id}-${idx}`} />
                        <Label htmlFor={`${q.id}-${idx}`} className="flex-1 cursor-pointer text-sm font-normal">
                          {String.fromCharCode(65 + idx)}. {opt.label}
                        </Label>
                      </div>
                    ))}
                  </RadioGroup>
                </div>
              ))}
              <Button className="w-full" disabled={quizBusy} onClick={handleSubmitQuiz}>
                {quizBusy ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                Kirim jawaban
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Assignment Modal */}
      <Dialog open={!!activeAssignment} onOpenChange={(open) => !open && setActiveAssignment(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{activeAssignment?.title}</DialogTitle>
            <DialogDescription>
              {activeAssignment?.description || "Tulis jawaban tugas kamu di bawah."}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="answer">Jawaban</Label>
              <Textarea
                id="answer"
                rows={6}
                placeholder="Tulis jawaban tugas kamu di sini..."
                value={assignmentAnswer}
                onChange={(e) => setAssignmentAnswer(e.target.value)}
              />
            </div>
            {submissions[activeAssignment?.id]?.score !== null && submissions[activeAssignment?.id]?.score !== undefined && (
              <div className="rounded-lg bg-primary/10 p-3 text-sm">
                <Award className="inline h-4 w-4 text-primary mr-2" />
                Nilai: <span className="font-bold">{submissions[activeAssignment?.id].score}</span> / {activeAssignment?.max_score}
                {submissions[activeAssignment?.id].feedback && (
                  <p className="mt-1 text-muted-foreground">{submissions[activeAssignment?.id].feedback}</p>
                )}
              </div>
            )}
            <Button className="w-full" disabled={assignmentBusy} onClick={handleSubmitAssignment}>
              {assignmentBusy ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              {submissions[activeAssignment?.id]?.submitted_at ? "Simpan perubahan" : "Kumpulkan tugas"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-start justify-between gap-4">
      <dt className="text-muted-foreground">{label}</dt>
      <dd className="font-medium text-foreground text-right">{value}</dd>
    </div>
  );
}

function SideList({ title, items }: { title: string; items: CatalogMaterial[] }) {
  return (
    <div className="rounded-2xl border border-border/60 bg-card p-5">
      <p className="text-xs font-semibold uppercase tracking-widest text-primary mb-4">{title}</p>
      <ul className="space-y-3">
        {items.map((m) => (
          <li key={m.slug}>
            <Link
              to="/materi/$slug"
              params={{ slug: m.slug }}
              className="group flex items-center gap-3 rounded-xl p-2 -m-2 hover:bg-accent/40 transition-colors"
            >
              <img src={m.image} alt={m.title} className="w-14 h-14 rounded-lg object-cover flex-shrink-0" />
              <span className="flex-1 min-w-0">
                <span className="block text-sm font-medium text-foreground truncate">{m.title}</span>
                <span className="block text-xs text-muted-foreground">Kelas {m.grade} · {m.subject}</span>
              </span>
              <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:translate-x-0.5 transition-transform" />
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
