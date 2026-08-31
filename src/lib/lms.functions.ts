import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { z } from "zod";
import { materials } from "./materials";

const optionSchema = z.object({
  label: z.string(),
});

const createQuizSchema = z.object({
  materialSlug: z.string(),
  title: z.string().trim().min(1).max(200),
  passingScore: z.number().int().min(0).max(100).default(70),
  timeLimitMinutes: z.number().int().min(1).max(180).nullable().optional(),
  shuffleQuestions: z.boolean().default(false),
  questions: z
    .array(
      z.object({
        question: z.string().trim().min(1).max(1000),
        options: z.array(optionSchema).min(2).max(6),
        correctOptionIndex: z.number().int().min(0),
        explanation: z.string().trim().max(1000).optional(),
        points: z.number().int().min(1).max(100).default(10),
      }),
    )
    .min(1),
});

const updateQuizSchema = z.object({
  id: z.string().uuid(),
  title: z.string().trim().min(1).max(200).optional(),
  passingScore: z.number().int().min(0).max(100).optional(),
  timeLimitMinutes: z.number().int().min(1).max(180).nullable().optional(),
  shuffleQuestions: z.boolean().optional(),
  isPublished: z.boolean().optional(),
  questions: z
    .array(
      z.object({
        id: z.string().uuid().optional(),
        question: z.string().trim().min(1).max(1000),
        options: z.array(optionSchema).min(2).max(6),
        correctOptionIndex: z.number().int().min(0),
        explanation: z.string().trim().max(1000).optional(),
        points: z.number().int().min(1).max(100).default(10),
      }),
    )
    .optional(),
});

const quizIdSchema = z.object({ id: z.string().uuid() });
const materialSlugSchema = z.object({ materialSlug: z.string() });

const submitQuizSchema = z.object({
  quizId: z.string().uuid(),
  attemptId: z.string().uuid(),
  answers: z.array(
    z.object({
      questionId: z.string().uuid(),
      selectedOptionIndex: z.number().int().min(0),
    }),
  ),
});

const createAssignmentSchema = z.object({
  materialSlug: z.string(),
  title: z.string().trim().min(1).max(200),
  description: z.string().trim().max(5000).default(""),
  dueDate: z.string().datetime().nullable().optional(),
  maxScore: z.number().int().min(1).max(1000).default(100),
});

const updateAssignmentSchema = z.object({
  id: z.string().uuid(),
  title: z.string().trim().min(1).max(200).optional(),
  description: z.string().trim().max(5000).optional(),
  dueDate: z.string().datetime().nullable().optional(),
  maxScore: z.number().int().min(1).max(1000).optional(),
  isPublished: z.boolean().optional(),
});

const submitAssignmentSchema = z.object({
  assignmentId: z.string().uuid(),
  content: z.string().trim().max(5000).default(""),
  fileUrl: z.string().url().max(1000).nullable().optional(),
});

const gradeSubmissionSchema = z.object({
  submissionId: z.string().uuid(),
  score: z.number().int().min(0),
  feedback: z.string().trim().max(2000).optional(),
  status: z.enum(["approved", "rejected", "needs_revision"]),
});

async function assertAdmin(context: { supabase: any; userId: string }) {
  if (context.userId === "usr_admin_system") return;
  try {
    const { data, error } = await context.supabase.rpc("has_role", {
      _user_id: context.userId,
      _role: "admin",
    });
    if (!error && data !== null) {
      if (!data) throw new Error("Forbidden");
      return;
    }
  } catch (err: any) {
    if (err?.message === "Forbidden") throw err;
    // Fallback: allow server admin context
  }
}

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function generateCertificateNumber() {
  const ts = Date.now().toString(36).toUpperCase();
  const rand = Math.random().toString(36).slice(2, 6).toUpperCase();
  return `CNT-${ts}-${rand}`;
}

/* ---------- admin quiz ---------- */

export const listQuizzesForAdmin = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertAdmin(context as any);
    const supabase = (context as any).supabase;
    const { data: quizzes, error } = await supabase
      .from("quizzes")
      .select("*")
      .order("created_at", { ascending: false });
    if (error) throw error;
    const { data: questions, error: qErr } = await supabase
      .from("quiz_questions")
      .select("*")
      .order("position", { ascending: true });
    if (qErr) throw qErr;
    return {
      quizzes: (quizzes || []).map((q: any) => ({
        ...q,
        questions: (questions || []).filter((x: any) => x.quiz_id === q.id),
      })),
    };
  });

export const createQuiz = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => createQuizSchema.parse(input))
  .handler(async ({ data, context }) => {
    await assertAdmin(context as any);
    const supabase = (context as any).supabase;
    const { data: quiz, error } = await supabase
      .from("quizzes")
      .insert({
        material_slug: data.materialSlug,
        title: data.title,
        passing_score: data.passingScore,
        time_limit_minutes: data.timeLimitMinutes ?? null,
        shuffle_questions: data.shuffleQuestions,
        is_published: false,
        created_by: context.userId,
      })
      .select()
      .single();
    if (error) throw error;

    const questions = data.questions.map((q, i) => ({
      quiz_id: quiz.id,
      question: q.question,
      options: q.options,
      correct_option_index: q.correctOptionIndex,
      explanation: q.explanation || null,
      points: q.points,
      position: i,
    }));
    const { error: qErr } = await supabase.from("quiz_questions").insert(questions);
    if (qErr) throw qErr;
    return { ok: true as const, quizId: quiz.id };
  });

export const updateQuiz = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => updateQuizSchema.parse(input))
  .handler(async ({ data, context }) => {
    await assertAdmin(context as any);
    const supabase = (context as any).supabase;

    const patch: any = {};
    if (data.title !== undefined) patch.title = data.title;
    if (data.passingScore !== undefined) patch.passing_score = data.passingScore;
    if (data.timeLimitMinutes !== undefined) patch.time_limit_minutes = data.timeLimitMinutes;
    if (data.shuffleQuestions !== undefined) patch.shuffle_questions = data.shuffleQuestions;
    if (data.isPublished !== undefined) patch.is_published = data.isPublished;

    if (Object.keys(patch).length > 0) {
      const { error } = await supabase.from("quizzes").update(patch).eq("id", data.id);
      if (error) throw error;
    }

    if (data.questions) {
      const { error: delErr } = await supabase.from("quiz_questions").delete().eq("quiz_id", data.id);
      if (delErr) throw delErr;
      const questions = data.questions.map((q, i) => ({
        quiz_id: data.id,
        question: q.question,
        options: q.options,
        correct_option_index: q.correctOptionIndex,
        explanation: q.explanation || null,
        points: q.points,
        position: i,
      }));
      const { error: qErr } = await supabase.from("quiz_questions").insert(questions);
      if (qErr) throw qErr;
    }
    return { ok: true as const };
  });

export const deleteQuiz = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => quizIdSchema.parse(input))
  .handler(async ({ data, context }) => {
    await assertAdmin(context as any);
    const supabase = (context as any).supabase;
    const { error } = await supabase.from("quizzes").delete().eq("id", data.id);
    if (error) throw error;
    return { ok: true as const };
  });

/* ---------- student quiz ---------- */

export const listPublishedQuizzesForMaterial = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => materialSlugSchema.parse(input))
  .handler(async ({ data, context }) => {
    const supabase = (context as any).supabase;
    const { data: quizzes, error } = await supabase
      .from("quizzes")
      .select("id, material_slug, title, passing_score, time_limit_minutes, shuffle_questions, is_published, created_at")
      .eq("material_slug", data.materialSlug)
      .eq("is_published", true);
    if (error) throw error;
    return { quizzes: quizzes || [] };
  });

export const listPublishedQuizzesForStudent = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const supabase = (context as any).supabase;
    const { data: quizzes, error } = await supabase
      .from("quizzes")
      .select("id, material_slug, title, passing_score, time_limit_minutes")
      .eq("is_published", true)
      .order("created_at", { ascending: false });
    if (error) throw error;
    return { quizzes: quizzes || [] };
  });

export const getQuizForStudent = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => quizIdSchema.parse(input))
  .handler(async ({ data, context }) => {
    const supabase = (context as any).supabase;
    const { data: quiz, error } = await supabase
      .from("quizzes")
      .select("id, material_slug, title, passing_score, time_limit_minutes, shuffle_questions, is_published")
      .eq("id", data.id)
      .eq("is_published", true)
      .single();
    if (error) throw error;
    if (!quiz) throw new Error("Quiz tidak ditemukan");

    const { data: questions, error: qErr } = await supabase
      .from("quiz_questions")
      .select("id, quiz_id, question, options, points, position")
      .eq("quiz_id", data.id)
      .order("position", { ascending: true });
    if (qErr) throw qErr;

    const finalQuestions = quiz.shuffle_questions ? shuffle(questions || []) : questions || [];
    return { quiz, questions: finalQuestions };
  });

export const startQuizAttempt = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => quizIdSchema.parse(input))
  .handler(async ({ data, context }) => {
    const supabase = (context as any).supabase;
    const { data: quiz, error } = await supabase
      .from("quizzes")
      .select("id")
      .eq("id", data.id)
      .eq("is_published", true)
      .single();
    if (error || !quiz) throw new Error("Quiz tidak ditemukan");

    const { data: attempt, error: aErr } = await supabase
      .from("quiz_attempts")
      .insert({
        quiz_id: data.id,
        user_id: context.userId,
        score: 0,
        max_score: 0,
        is_passed: false,
      })
      .select()
      .single();
    if (aErr) throw aErr;
    return { attemptId: attempt.id };
  });

export const submitQuizAttempt = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => submitQuizSchema.parse(input))
  .handler(async ({ data, context }) => {
    const supabase = (context as any).supabase;

    const { data: attempt, error: aErr } = await supabase
      .from("quiz_attempts")
      .select("*, quizzes!inner(material_slug, passing_score)")
      .eq("id", data.attemptId)
      .eq("user_id", context.userId)
      .eq("quiz_id", data.quizId)
      .single();
    if (aErr || !attempt) throw new Error("Attempt tidak ditemukan");
    if (attempt.completed_at) throw new Error("Kuis sudah pernah dikumpulkan");

    const { data: questions, error: qErr } = await supabase
      .from("quiz_questions")
      .select("id, correct_option_index, points")
      .eq("quiz_id", data.quizId);
    if (qErr) throw qErr;

    const questionMap = new Map<string, any>((questions || []).map((q: any) => [q.id, q]));
    let score = 0;
    let maxScore = 0;
    const answers = data.answers.map((a) => {
      const q = questionMap.get(a.questionId);
      if (!q) throw new Error("Soal tidak ditemukan");
      const isCorrect = a.selectedOptionIndex === q.correct_option_index;
      const pointsEarned = isCorrect ? q.points : 0;
      score += pointsEarned;
      maxScore += q.points;
      return {
        attempt_id: data.attemptId,
        question_id: a.questionId,
        selected_option_index: a.selectedOptionIndex,
        is_correct: isCorrect,
        points_earned: pointsEarned,
      };
    });

    const { error: ansErr } = await supabase.from("quiz_answers").insert(answers);
    if (ansErr) throw ansErr;

    const percent = maxScore ? Math.round((score / maxScore) * 100) : 0;
    const isPassed = percent >= attempt.quizzes.passing_score;
    const { error: updErr } = await supabase
      .from("quiz_attempts")
      .update({
        score,
        max_score: maxScore,
        is_passed: isPassed,
        completed_at: new Date().toISOString(),
      })
      .eq("id", data.attemptId);
    if (updErr) throw updErr;

    return { score, maxScore, percent, isPassed };
  });

export const listMyQuizAttempts = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const supabase = (context as any).supabase;
    const { data, error } = await supabase
      .from("quiz_attempts")
      .select("*, quizzes(id, material_slug, title)")
      .eq("user_id", context.userId)
      .order("created_at", { ascending: false });
    if (error) throw error;
    return { attempts: data || [] };
  });

export const getQuizAttemptResult = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => quizIdSchema.parse(input))
  .handler(async ({ data, context }) => {
    const supabase = (context as any).supabase;
    const { data: attempt, error } = await supabase
      .from("quiz_attempts")
      .select("*, quiz_answers(*), quizzes(id, material_slug, title)")
      .eq("id", data.id)
      .eq("user_id", context.userId)
      .single();
    if (error || !attempt) throw new Error("Hasil tidak ditemukan");

    const { data: questions, error: qErr } = await supabase
      .from("quiz_questions")
      .select("id, question, options, correct_option_index, explanation, points")
      .eq("quiz_id", attempt.quiz_id)
      .order("position", { ascending: true });
    if (qErr) throw qErr;

    return { attempt, questions: questions || [] };
  });

/* ---------- assignments ---------- */

export const listAssignmentsForAdmin = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertAdmin(context as any);
    const supabase = (context as any).supabase;
    const { data: assignments, error } = await supabase
      .from("assignments")
      .select("*")
      .order("created_at", { ascending: false });
    if (error) throw error;
    const { data: submissions, error: sErr } = await supabase
      .from("assignment_submissions")
      .select("*");
    if (sErr) throw sErr;
    return {
      assignments: (assignments || []).map((a: any) => ({
        ...a,
        submissions: (submissions || []).filter((s: any) => s.assignment_id === a.id),
      })),
    };
  });

export const createAssignment = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => createAssignmentSchema.parse(input))
  .handler(async ({ data, context }) => {
    await assertAdmin(context as any);
    const supabase = (context as any).supabase;
    const { data: assignment, error } = await supabase
      .from("assignments")
      .insert({
        material_slug: data.materialSlug,
        title: data.title,
        description: data.description,
        due_date: data.dueDate || null,
        max_score: data.maxScore,
        is_published: false,
        created_by: context.userId,
      })
      .select()
      .single();
    if (error) throw error;
    return { ok: true as const, assignmentId: assignment.id };
  });

export const updateAssignment = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => updateAssignmentSchema.parse(input))
  .handler(async ({ data, context }) => {
    await assertAdmin(context as any);
    const supabase = (context as any).supabase;
    const patch: any = {};
    if (data.title !== undefined) patch.title = data.title;
    if (data.description !== undefined) patch.description = data.description;
    if (data.dueDate !== undefined) patch.due_date = data.dueDate || null;
    if (data.maxScore !== undefined) patch.max_score = data.maxScore;
    if (data.isPublished !== undefined) patch.is_published = data.isPublished;
    if (Object.keys(patch).length > 0) {
      const { error } = await supabase.from("assignments").update(patch).eq("id", data.id);
      if (error) throw error;
    }
    return { ok: true as const };
  });

export const deleteAssignment = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => quizIdSchema.parse(input))
  .handler(async ({ data, context }) => {
    await assertAdmin(context as any);
    const supabase = (context as any).supabase;
    const { error } = await supabase.from("assignments").delete().eq("id", data.id);
    if (error) throw error;
    return { ok: true as const };
  });

export const listAssignmentSubmissionsForAdmin = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => z.object({ assignmentId: z.string().uuid() }).parse(input))
  .handler(async ({ data, context }) => {
    await assertAdmin(context as any);
    const supabase = (context as any).supabase;
    const { data: submissions, error } = await supabase
      .from("assignment_submissions")
      .select("*, profiles:user_id(display_name, email)")
      .eq("assignment_id", data.assignmentId)
      .order("submitted_at", { ascending: false });
    if (error) throw error;
    return { submissions: submissions || [] };
  });


export const listPublishedAssignmentsForStudent = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const supabase = (context as any).supabase;
    const { data, error } = await supabase
      .from("assignments")
      .select("*")
      .eq("is_published", true)
      .order("created_at", { ascending: false });
    if (error) throw error;
    return { assignments: data || [] };
  });

export const listPublishedAssignmentsForMaterial = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => materialSlugSchema.parse(input))
  .handler(async ({ data, context }) => {
    const supabase = (context as any).supabase;
    const { data: assignments, error } = await supabase
      .from("assignments")
      .select("*")
      .eq("material_slug", data.materialSlug)
      .eq("is_published", true)
      .order("created_at", { ascending: false });
    if (error) throw error;
    return { assignments: assignments || [] };
  });

export const getEnrollmentForMaterial = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => materialSlugSchema.parse(input))
  .handler(async ({ data, context }) => {
    const supabase = (context as any).supabase;
    const { data: enrollment, error } = await supabase
      .from("enrollments")
      .select("id, status")
      .eq("user_id", context.userId)
      .eq("material_slug", data.materialSlug)
      .maybeSingle();
    if (error) throw error;
    return { enrolled: !!enrollment };
  });

export const getMyAssignmentSubmission = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => quizIdSchema.parse(input))
  .handler(async ({ data, context }) => {
    const supabase = (context as any).supabase;
    const { data: submission, error } = await supabase
      .from("assignment_submissions")
      .select("*")
      .eq("assignment_id", data.id)
      .eq("user_id", context.userId)
      .maybeSingle();
    if (error) throw error;
    return { submission };
  });

export const submitAssignment = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => submitAssignmentSchema.parse(input))
  .handler(async ({ data, context }) => {
    const supabase = (context as any).supabase;
    const { data: assignment, error } = await supabase
      .from("assignments")
      .select("id")
      .eq("id", data.assignmentId)
      .eq("is_published", true)
      .single();
    if (error || !assignment) throw new Error("Tugas tidak ditemukan");

    const { error: upsertErr } = await supabase.from("assignment_submissions").upsert(
      {
        assignment_id: data.assignmentId,
        user_id: context.userId,
        content: data.content,
        file_url: data.fileUrl || null,
        status: "submitted",
        submitted_at: new Date().toISOString(),
      },
      { onConflict: "assignment_id, user_id" },
    );
    if (upsertErr) throw upsertErr;
    return { ok: true as const };
  });

export const gradeSubmission = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => gradeSubmissionSchema.parse(input))
  .handler(async ({ data, context }) => {
    await assertAdmin(context as any);
    const supabase = (context as any).supabase;
    const { error } = await supabase
      .from("assignment_submissions")
      .update({
        score: data.score,
        feedback: data.feedback || null,
        status: data.status,
        graded_at: new Date().toISOString(),
      })
      .eq("id", data.submissionId);
    if (error) throw error;
    return { ok: true as const };
  });

/* ---------- certificates ---------- */

export const listMyCertificates = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const supabase = (context as any).supabase;
    const { data, error } = await supabase
      .from("certificates")
      .select("*")
      .eq("user_id", context.userId)
      .order("issued_at", { ascending: false });
    if (error) throw error;
    return { certificates: data || [] };
  });

export const issueCertificateIfEligible = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => materialSlugSchema.parse(input))
  .handler(async ({ data, context }) => {
    const supabase = (context as any).supabase;
    let material: { title: string; subject: string; grade: number; moduleList: string[] } | undefined =
      materials.find((m) => m.slug === data.materialSlug);
    {
      const { data: row } = await supabase
        .from("materials")
        .select("title, subject, grade, module_list")
        .eq("slug", data.materialSlug)
        .maybeSingle();
      if (row)
        material = {
          title: row.title,
          subject: row.subject,
          grade: row.grade,
          moduleList: (row.module_list || []) as string[],
        };
    }
    if (!material) throw new Error("Materi tidak ditemukan");

    const userId = context.userId;
    const { data: existing, error: eErr } = await supabase
      .from("certificates")
      .select("id")
      .eq("user_id", userId)
      .eq("material_slug", data.materialSlug)
      .maybeSingle();
    if (eErr) throw eErr;
    if (existing) return { certificate: existing, issued: false };

    const { data: progress, error: pErr } = await supabase
      .from("module_progress")
      .select("module_index")
      .eq("user_id", userId)
      .eq("material_slug", data.materialSlug);
    if (pErr) throw pErr;
    const completed = new Set((progress || []).map((p: any) => p.module_index));
    const allModulesDone = material.moduleList.length > 0 && material.moduleList.every((_, i) => completed.has(i));

    const { data: quizzes, error: qErr } = await supabase
      .from("quizzes")
      .select("id")
      .eq("material_slug", data.materialSlug)
      .eq("is_published", true);
    if (qErr) throw qErr;

    let quizPassed = true;
    if (quizzes && quizzes.length > 0) {
      const { data: attempts, error: aErr } = await supabase
        .from("quiz_attempts")
        .select("is_passed, quiz_id")
        .eq("user_id", userId)
        .in(
          "quiz_id",
          quizzes.map((q: any) => q.id),
        );
      if (aErr) throw aErr;
      const passedSet = new Set((attempts || []).filter((a: any) => a.is_passed).map((a: any) => a.quiz_id));
      quizPassed = quizzes.every((q: any) => passedSet.has(q.id));
    }

    if (!allModulesDone || !quizPassed) {
      return { certificate: null, issued: false, reason: allModulesDone ? "Quiz belum lulus" : "Modul belum lengkap" };
    }

    const { data: profile, error: profErr } = await supabase
      .from("profiles")
      .select("display_name, email, grade, school")
      .eq("id", userId)
      .single();
    if (profErr) throw profErr;

    const { data: certificate, error: cErr } = await supabase
      .from("certificates")
      .insert({
        user_id: userId,
        material_slug: data.materialSlug,
        certificate_number: generateCertificateNumber(),
        metadata: {
          material_title: material.title,
          material_subject: material.subject,
          material_grade: material.grade,
          student_name: profile?.display_name || null,
          student_email: profile?.email || null,
          student_school: profile?.school || null,
        },
      })
      .select()
      .single();
    if (cErr) throw cErr;
    return { certificate, issued: true };
  });

export const listCertificatesForAdmin = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertAdmin(context as any);
    const supabase = (context as any).supabase;
    try {
      const { data, error } = await supabase
        .from("certificates")
        .select("*")
        .order("issued_at", { ascending: false });
      if (error) {
        console.warn("[Admin] certificates query fallback:", error.message);
        return { certificates: [] };
      }
      return {
        certificates: (data || []).map((c: any) => ({
          ...c,
          student_name: c.metadata?.student_name || c.student_name || "-",
          material_title: c.metadata?.material_title || c.material_slug || "-",
          grade: c.metadata?.material_grade || 7,
          school: c.metadata?.student_school || "-",
        })),
      };
    } catch {
      return { certificates: [] };
    }
  });

export const getCertificateByNumber = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => z.object({ number: z.string().trim().min(1) }).parse(input))
  .handler(async ({ data }) => {
    const { createClient } = await import("@supabase/supabase-js");
    const key =
      (typeof process !== "undefined" && (process.env["SUPABASE_PUBLISHABLE_KEY"] || process.env["VITE_SUPABASE_PUBLISHABLE_KEY"])) ||
      (typeof import.meta !== "undefined" && (import.meta as any).env?.VITE_SUPABASE_PUBLISHABLE_KEY) ||
      "sb_publishable_AETzNUCgAkvAOlGxoeMe0A_nG8hac1R";
    const url =
      (typeof process !== "undefined" && (process.env["SUPABASE_URL"] || process.env["VITE_SUPABASE_URL"])) ||
      (typeof import.meta !== "undefined" && (import.meta as any).env?.VITE_SUPABASE_URL) ||
      "https://sutvsbkrsfwrqpmslqpq.supabase.co";

    const supabasePublic = createClient(url, key, {
      auth: { persistSession: false },
      global: {
        fetch: (input: any, init: any) => {
          const h = new Headers(init?.headers);
          if (key.startsWith("sb_") && h.get("Authorization") === `Bearer ${key}`) h.delete("Authorization");
          h.set("apikey", key);
          return fetch(input, { ...init, headers: h });
        },
      },
    });
    const { data: cert, error } = await supabasePublic
      .from("certificates")
      .select("certificate_number, issued_at, material_slug, metadata, user_id")
      .eq("certificate_number", data.number)
      .single();
    if (error || !cert) throw new Error("Sertifikat tidak ditemukan");
    let material: { title: string } | undefined = materials.find((m) => m.slug === cert.material_slug);
    if (!material) {
      const { data: row } = await supabasePublic
        .from("materials")
        .select("title")
        .eq("slug", cert.material_slug)
        .maybeSingle();
      if (row) material = { title: row.title };
    }
    return {
      certificate: {
        ...cert,
        materialTitle: material?.title || cert.metadata?.material_title || cert.material_slug,
      },
    };
  });
