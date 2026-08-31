import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { achievementScore, type PublicStudent } from "./achievements";
import { getTursoClient } from "./turso";

const leaderboardSchema = z.object({
  grade: z.number().int().min(7).max(9).nullable().optional(),
  range: z.enum(["all", "week"]).default("all"),
});

/** Leaderboard visible to every signed-in student. */
export const listLeaderboard = createServerFn({ method: "GET" })
  .inputValidator((data: unknown) => leaderboardSchema.parse(data ?? {}))
  .handler(async ({ data }) => {
    try {
      const db = getTursoClient();

      const [profilesRes, progressRes, quizRes, certsRes] = await Promise.all([
        db.execute("SELECT * FROM profiles WHERE role = 'student' OR role IS NULL;"),
        db.execute("SELECT user_id, completed_at FROM module_progress;"),
        db.execute("SELECT user_id, score, passed FROM quiz_attempts;"),
        db.execute("SELECT user_id FROM certificates;"),
      ]);

      const progressMap = new Map<string, number>();
      const weeklyMap = new Map<string, number>();
      const since7Days = new Date(Date.now() - 7 * 86400000).toISOString().slice(0, 10);

      for (const row of progressRes.rows || []) {
        const uid = String(row.user_id);
        progressMap.set(uid, (progressMap.get(uid) || 0) + 1);
        const day = String(row.completed_at || "").slice(0, 10);
        if (day >= since7Days) {
          weeklyMap.set(uid, (weeklyMap.get(uid) || 0) + 1);
        }
      }

      const quizMap = new Map<string, { totalScore: number; count: number; passed: number }>();
      for (const row of quizRes.rows || []) {
        const uid = String(row.user_id);
        const cur = quizMap.get(uid) || { totalScore: 0, count: 0, passed: 0 };
        cur.totalScore += Number(row.score || 0);
        cur.count += 1;
        if (row.passed) cur.passed += 1;
        quizMap.set(uid, cur);
      }

      const certMap = new Map<string, number>();
      for (const row of certsRes.rows || []) {
        const uid = String(row.user_id);
        certMap.set(uid, (certMap.get(uid) || 0) + 1);
      }

      let students: PublicStudent[] = (profilesRes.rows || [])
        .filter((r) => !Boolean(r.leaderboard_opt_out))
        .map((r) => {
          const uid = String(r.id);
          const q = quizMap.get(uid);
          const avgScore = q && q.count > 0 ? Math.round(q.totalScore / q.count) : 0;
          const completedModules = progressMap.get(uid) || 0;
          const certCount = certMap.get(uid) || 0;
          const weeklyCount = weeklyMap.get(uid) || 0;

          const score =
            data.range === "week"
              ? weeklyCount * 10
              : achievementScore({
                  completed_modules: completedModules,
                  avg_quiz_score: avgScore,
                  certificates: certCount,
                });

          return {
            id: uid,
            display_name: r.display_name ? String(r.display_name) : r.full_name ? String(r.full_name) : "Siswa",
            avatar_url: r.avatar_url ? String(r.avatar_url) : null,
            banner_url: r.banner_url ? String(r.banner_url) : null,
            headline: r.headline ? String(r.headline) : null,
            bio: r.bio ? String(r.bio) : null,
            social_link: r.social_link ? String(r.social_link) : null,
            grade: r.grade ? Number(r.grade) : null,
            completed_modules: completedModules,
            enrollments: completedModules > 0 ? 1 : 0,
            quiz_attempts: q ? q.count : 0,
            avg_quiz_score: avgScore,
            passed_quizzes: q ? q.passed : 0,
            submissions: 0,
            certificates: certCount,
            last_activity: null,
            leaderboard_opt_out: false,
            score,
          };
        });

      if (data.grade) {
        students = students.filter((s) => s.grade === data.grade);
      }

      students.sort((a, b) => b.score - a.score || b.completed_modules - a.completed_modules);
      return { students, viewerId: "" };
    } catch (err: any) {
      console.warn("[Social] listLeaderboard error:", err);
      return { students: [], viewerId: "" };
    }
  });

/** Public-between-students achievement profile. */
export const getStudentProfile = createServerFn({ method: "GET" })
  .inputValidator((data: unknown) => z.object({ id: z.string().min(1) }).parse(data))
  .handler(async ({ data }) => {
    try {
      const db = getTursoClient();

      const [profRes, usersRes] = await Promise.all([
        db.execute({ sql: "SELECT * FROM profiles WHERE id = ? LIMIT 1;", args: [data.id] }),
        db.execute({ sql: "SELECT * FROM users WHERE id = ? LIMIT 1;", args: [data.id] }),
      ]);

      const prof = profRes.rows[0] || usersRes.rows[0];
      if (!prof) {
        return { student: null, activity: [], certificates: [], rank: null, viewerId: "" };
      }

      const [progressRes, quizRes, certsRes, peersRes] = await Promise.all([
        db.execute({ sql: "SELECT completed_at FROM module_progress WHERE user_id = ?;", args: [data.id] }),
        db.execute({ sql: "SELECT score, passed FROM quiz_attempts WHERE user_id = ?;", args: [data.id] }),
        db.execute({ sql: "SELECT id, certificate_number, material_slug, created_at as issued_at FROM certificates WHERE user_id = ? ORDER BY created_at DESC;", args: [data.id] }),
        db.execute({ sql: "SELECT id, grade, leaderboard_opt_out FROM profiles WHERE role = 'student' OR role IS NULL;", args: [] }),
      ]);

      const completedModules = progressRes.rows.length;
      let totalQuizScore = 0;
      let passedQuizzes = 0;
      for (const q of quizRes.rows) {
        totalQuizScore += Number(q.score || 0);
        if (q.passed) passedQuizzes += 1;
      }
      const avgQuizScore = quizRes.rows.length > 0 ? Math.round(totalQuizScore / quizRes.rows.length) : 0;
      const certificatesCount = certsRes.rows.length;

      const score = achievementScore({
        completed_modules: completedModules,
        avg_quiz_score: avgQuizScore,
        certificates: certificatesCount,
      });

      const student: PublicStudent = {
        id: String(prof.id),
        display_name: prof.display_name ? String(prof.display_name) : prof.full_name ? String(prof.full_name) : "Siswa",
        avatar_url: prof.avatar_url ? String(prof.avatar_url) : null,
        banner_url: prof.banner_url ? String(prof.banner_url) : null,
        headline: prof.headline ? String(prof.headline) : null,
        bio: prof.bio ? String(prof.bio) : null,
        social_link: prof.social_link ? String(prof.social_link) : null,
        grade: prof.grade ? Number(prof.grade) : null,
        completed_modules: completedModules,
        enrollments: completedModules > 0 ? 1 : 0,
        quiz_attempts: quizRes.rows.length,
        avg_quiz_score: avgQuizScore,
        passed_quizzes: passedQuizzes,
        submissions: 0,
        certificates: certificatesCount,
        last_activity: null,
        leaderboard_opt_out: Boolean(prof.leaderboard_opt_out),
        score,
      };

      // 14-day activity
      const activityMap = new Map<string, number>();
      for (const p of progressRes.rows) {
        const day = String(p.completed_at || "").slice(0, 10);
        if (day) activityMap.set(day, (activityMap.get(day) || 0) + 1);
      }
      const activity = Array.from(activityMap.entries()).map(([day, modules]) => ({ day, modules }));

      const certs = certsRes.rows.map((c) => ({
        id: String(c.id),
        certificate_number: String(c.certificate_number),
        material_slug: String(c.material_slug),
        issued_at: String(c.issued_at || ""),
      }));

      // Grade ranking
      const gradePeers = peersRes.rows.filter((p) => Number(p.grade) === Number(prof.grade) && !Boolean(p.leaderboard_opt_out));
      const rank = { position: 1, total: Math.max(1, gradePeers.length) };

      return {
        student,
        activity,
        certificates: certs,
        rank,
        viewerId: "",
      };
    } catch (err: any) {
      console.warn("[Social] getStudentProfile error:", err);
      return { student: null, activity: [], certificates: [], rank: null, viewerId: "" };
    }
  });
