/** Assessment rubrics per teaching material, plus per-student scoring. */

async function db() {
  const { supabase } = await import("@/integrations/supabase/client");
  return supabase as any;
}

export type Criterion = {
  id: string;
  rubricId: string;
  name: string;
  description: string;
  weight: number;
  maxScore: number;
  position: number;
};

export type Rubric = {
  id: string;
  materialSlug: string;
  grade: number | null;
  title: string;
  description: string;
  isPublished: boolean;
  criteria: Criterion[];
};

export type Assessment = {
  id: string;
  rubricId: string;
  studentId: string;
  termId: string | null;
  totalScore: number;
  note: string;
  assessedAt: string;
  scores: Record<string, number>;
};

function mapCriterion(row: any): Criterion {
  return {
    id: row.id,
    rubricId: row.rubric_id,
    name: row.name,
    description: row.description ?? "",
    weight: row.weight,
    maxScore: row.max_score,
    position: row.position,
  };
}

function mapRubric(row: any): Rubric {
  return {
    id: row.id,
    materialSlug: row.material_slug,
    grade: row.grade,
    title: row.title,
    description: row.description ?? "",
    isPublished: row.is_published,
    criteria: (row.rubric_criteria || []).map(mapCriterion).sort((a: Criterion, b: Criterion) => a.position - b.position),
  };
}

export async function fetchRubrics(): Promise<Rubric[]> {
  const supabase = await db();
  const { data, error } = await supabase
    .from("rubrics")
    .select("*, rubric_criteria(*)")
    .order("created_at", { ascending: false });
  if (error) throw error;
  return (data || []).map(mapRubric);
}

export type CriterionInput = { id?: string; name: string; description: string; weight: number; maxScore: number };

export type RubricInput = {
  materialSlug: string;
  grade: number | null;
  title: string;
  description: string;
  isPublished: boolean;
  criteria: CriterionInput[];
};

export async function saveRubric(input: RubricInput, userId: string, id?: string) {
  const supabase = await db();
  const payload = {
    material_slug: input.materialSlug,
    grade: input.grade,
    title: input.title,
    description: input.description,
    is_published: input.isPublished,
    created_by: userId,
  };

  let rubricId = id;
  if (rubricId) {
    const { error } = await supabase.from("rubrics").update(payload).eq("id", rubricId);
    if (error) throw error;
  } else {
    const { data, error } = await supabase.from("rubrics").insert(payload).select("id").single();
    if (error) throw error;
    rubricId = data.id as string;
  }

  const keep = input.criteria.filter((c) => c.id).map((c) => c.id as string);
  if (id) {
    let del = supabase.from("rubric_criteria").delete().eq("rubric_id", rubricId);
    if (keep.length) del = del.not("id", "in", `(${keep.join(",")})`);
    const { error } = await del;
    if (error) throw error;
  }

  const rows = input.criteria.map((c, i) => ({
    ...(c.id ? { id: c.id } : {}),
    rubric_id: rubricId,
    name: c.name,
    description: c.description,
    weight: c.weight,
    max_score: c.maxScore,
    position: i,
  }));
  if (rows.length) {
    const { error } = await supabase.from("rubric_criteria").upsert(rows);
    if (error) throw error;
  }
  return rubricId as string;
}

export async function deleteRubric(id: string) {
  const supabase = await db();
  const { error } = await supabase.from("rubrics").delete().eq("id", id);
  if (error) throw error;
}

export async function fetchAssessments(rubricId?: string): Promise<Assessment[]> {
  const supabase = await db();
  let q = supabase.from("rubric_assessments").select("*, rubric_scores(criterion_id, score)");
  if (rubricId) q = q.eq("rubric_id", rubricId);
  const { data, error } = await q;
  if (error) throw error;
  return (data || []).map((row: any) => ({
    id: row.id,
    rubricId: row.rubric_id,
    studentId: row.student_id,
    termId: row.term_id,
    totalScore: Number(row.total_score) || 0,
    note: row.note ?? "",
    assessedAt: row.assessed_at,
    scores: Object.fromEntries((row.rubric_scores || []).map((s: any) => [s.criterion_id, Number(s.score)])),
  }));
}

/** Weighted percentage across all criteria (0-100). */
export function computeTotal(rubric: Rubric, scores: Record<string, number>) {
  const totalWeight = rubric.criteria.reduce((sum, c) => sum + (c.weight || 1), 0);
  if (!totalWeight) return 0;
  const earned = rubric.criteria.reduce((sum, c) => {
    const raw = Math.min(scores[c.id] ?? 0, c.maxScore);
    return sum + (c.maxScore ? raw / c.maxScore : 0) * (c.weight || 1);
  }, 0);
  return Math.round((earned / totalWeight) * 100);
}

export async function saveAssessment(input: {
  rubric: Rubric;
  studentId: string;
  scores: Record<string, number>;
  note: string;
  userId: string;
  termId: string | null;
}) {
  const supabase = await db();
  const total = computeTotal(input.rubric, input.scores);
  const { data, error } = await supabase
    .from("rubric_assessments")
    .upsert(
      {
        rubric_id: input.rubric.id,
        student_id: input.studentId,
        term_id: input.termId,
        total_score: total,
        note: input.note,
        assessed_by: input.userId,
        assessed_at: new Date().toISOString(),
      },
      { onConflict: "rubric_id,student_id,term_id" },
    )
    .select("id")
    .single();
  if (error) throw error;

  const rows = input.rubric.criteria.map((c) => ({
    assessment_id: data.id,
    criterion_id: c.id,
    score: Math.min(input.scores[c.id] ?? 0, c.maxScore),
  }));
  if (rows.length) {
    const { error: e2 } = await supabase
      .from("rubric_scores")
      .upsert(rows, { onConflict: "assessment_id,criterion_id" });
    if (e2) throw e2;
  }
  return total;
}

/** Ready-made criteria sets so teachers can start fast. */
export const rubricPresets: Array<{ name: string; criteria: CriterionInput[] }> = [
  {
    name: "Praktik digital",
    criteria: [
      { name: "Ketepatan langkah kerja", description: "Mengikuti prosedur praktik dengan benar", weight: 3, maxScore: 4 },
      { name: "Kerapian hasil", description: "Format, tata letak, dan konsistensi hasil kerja", weight: 2, maxScore: 4 },
      { name: "Kemandirian", description: "Menyelesaikan tugas tanpa banyak bantuan", weight: 2, maxScore: 4 },
      { name: "Ketepatan waktu", description: "Mengumpulkan sesuai tenggat", weight: 1, maxScore: 4 },
    ],
  },
  {
    name: "Proyek kelompok",
    criteria: [
      { name: "Perencanaan", description: "Kejelasan tujuan dan pembagian tugas", weight: 2, maxScore: 4 },
      { name: "Kolaborasi", description: "Kontribusi dan kerja sama dalam kelompok", weight: 3, maxScore: 4 },
      { name: "Kualitas produk", description: "Hasil akhir sesuai kriteria materi", weight: 3, maxScore: 4 },
      { name: "Presentasi", description: "Kejelasan penyampaian hasil", weight: 2, maxScore: 4 },
    ],
  },
  {
    name: "Pemahaman konsep",
    criteria: [
      { name: "Penguasaan materi", description: "Menjelaskan konsep inti dengan tepat", weight: 3, maxScore: 4 },
      { name: "Penerapan", description: "Menggunakan konsep pada kasus baru", weight: 3, maxScore: 4 },
      { name: "Keaktifan", description: "Bertanya dan menanggapi selama pembelajaran", weight: 1, maxScore: 4 },
    ],
  },
];

export const scoreBand = (percent: number) =>
  percent >= 86 ? "Sangat baik" : percent >= 71 ? "Baik" : percent >= 56 ? "Cukup" : "Perlu bimbingan";
