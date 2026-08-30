import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { z } from "zod";
import { achievementScore, type PublicStudent } from "./achievements";

const leaderboardSchema = z.object({
  grade: z.number().int().min(7).max(9).nullable().optional(),
  range: z.enum(["all", "week"]).default("all"),
});

/** Leaderboard visible to every signed-in student (safe columns only). */
export const listLeaderboard = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) => leaderboardSchema.parse(data ?? {}))
  .handler(async ({ data, context }) => {
    const sb = context.supabase as any;
    let query = sb.from("student_public_stats").select("*").eq("leaderboard_opt_out", false);
    if (data.grade) query = query.eq("grade", data.grade);
    const { data: rows, error } = await query;
    if (error) throw error;

    const weekly: Record<string, number> = {};
    if (data.range === "week") {
      const since = new Date(Date.now() - 7 * 86400000).toISOString().slice(0, 10);
      const { data: acts } = await sb
        .from("student_public_activity")
        .select("user_id, day, modules")
        .gte("day", since);
      for (const a of acts || []) weekly[a.user_id] = (weekly[a.user_id] || 0) + a.modules;
    }

    const students: PublicStudent[] = (rows || []).map((r: any) => ({
      ...r,
      avg_quiz_score: Number(r.avg_quiz_score || 0),
      score:
        data.range === "week"
          ? (weekly[r.id] || 0) * 10
          : achievementScore({
              completed_modules: r.completed_modules,
              avg_quiz_score: Number(r.avg_quiz_score || 0),
              certificates: r.certificates,
            }),
    }));

    students.sort((a, b) => b.score - a.score || b.completed_modules - a.completed_modules);
    return { students, viewerId: context.userId };
  });

/** Public-between-students achievement profile. */
export const getStudentProfile = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) => z.object({ id: z.string().uuid() }).parse(data))
  .handler(async ({ data, context }) => {
    const sb = context.supabase as any;
    const { data: row, error } = await sb
      .from("student_public_stats")
      .select("*")
      .eq("id", data.id)
      .maybeSingle();
    if (error) throw error;
    if (!row) {
      return { student: null, activity: [], certificates: [], rank: null, viewerId: context.userId };
    }

    const since = new Date(Date.now() - 13 * 86400000).toISOString().slice(0, 10);
    const { data: acts } = await sb
      .from("student_public_activity")
      .select("day, modules")
      .eq("user_id", data.id)
      .gte("day", since);

    const { data: peers } = await sb
      .from("student_public_stats")
      .select("id, completed_modules, avg_quiz_score, certificates")
      .eq("grade", row.grade)
      .eq("leaderboard_opt_out", false);

    const scored = ((peers || []) as any[])
      .map((p) => ({
        id: p.id,
        score: achievementScore({
          completed_modules: p.completed_modules,
          avg_quiz_score: Number(p.avg_quiz_score || 0),
          certificates: p.certificates,
        }),
      }))
      .sort((a, b) => b.score - a.score);
    const idx = scored.findIndex((p) => p.id === data.id);

    const { data: certs } = await sb
      .from("certificates")
      .select("id, certificate_number, material_slug, issued_at")
      .eq("user_id", data.id)
      .order("issued_at", { ascending: false });

    return {
      student: { ...row, avg_quiz_score: Number(row.avg_quiz_score || 0), score: 0 } as PublicStudent,
      activity: (acts || []) as Array<{ day: string; modules: number }>,
      certificates: (certs || []) as Array<{
        id: string;
        certificate_number: string;
        material_slug: string;
        issued_at: string;
      }>,
      rank: idx >= 0 ? { position: idx + 1, total: scored.length } : null,
      viewerId: context.userId,
    };
  });
