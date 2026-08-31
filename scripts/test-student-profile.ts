import { getTursoClient } from "../src/lib/turso";
import { achievementScore } from "../src/lib/achievements";

async function testDirect(id: string) {
  const db = getTursoClient();
  const [profRes, usersRes] = await Promise.all([
    db.execute({ sql: "SELECT * FROM profiles WHERE id = ? LIMIT 1;", args: [id] }),
    db.execute({ sql: "SELECT * FROM users WHERE id = ? LIMIT 1;", args: [id] }),
  ]);

  const prof = profRes.rows[0] || usersRes.rows[0];
  console.log("Found profile:", prof);

  if (!prof) {
    console.log("Profile not found!");
    return;
  }

  const [progressRes, quizRes, certsRes, peersRes] = await Promise.all([
    db.execute({ sql: "SELECT completed_at FROM module_progress WHERE user_id = ?;", args: [id] }),
    db.execute({ sql: "SELECT score, COALESCE(passed, is_passed, 0) as passed FROM quiz_attempts WHERE user_id = ?;", args: [id] }),
    db.execute({ sql: "SELECT id, certificate_number, material_slug, created_at as issued_at FROM certificates WHERE user_id = ? ORDER BY created_at DESC;", args: [id] }),
    db.execute({ sql: "SELECT id, grade, leaderboard_opt_out FROM profiles WHERE role = 'student' OR role IS NULL;", args: [] }),
  ]);

  console.log("Progress count:", progressRes.rows.length);
  console.log("Quiz count:", quizRes.rows.length);
  console.log("Certificates count:", certsRes.rows.length);
  console.log("Peers count:", peersRes.rows.length);

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

  console.log("Calculated score:", score);
}

testDirect("1a2560e8-1863-4682-9718-75e94353b579").catch(console.error);
