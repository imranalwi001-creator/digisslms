export type PublicStudent = {
  id: string;
  display_name: string | null;
  avatar_url: string | null;
  banner_url?: string | null;
  headline?: string | null;
  bio?: string | null;
  social_link?: string | null;
  grade: number | null;
  completed_modules: number;
  enrollments: number;
  quiz_attempts: number;
  avg_quiz_score: number;
  passed_quizzes: number;
  submissions: number;
  certificates: number;
  last_activity: string | null;
  leaderboard_opt_out: boolean;
  score: number;
};

/** Achievement score: modules x10 + average quiz score + certificates x50. */
export function achievementScore(row: {
  completed_modules: number;
  avg_quiz_score: number;
  certificates: number;
}) {
  return Math.round(row.completed_modules * 10 + Number(row.avg_quiz_score || 0) + row.certificates * 50);
}

export type Badge = { key: string; label: string; description: string; earned: boolean };

export function computeBadges(s: {
  completed_modules: number;
  avg_quiz_score: number;
  passed_quizzes: number;
  certificates: number;
  submissions: number;
  streak: number;
}): Badge[] {
  return [
    { key: "first-step", label: "Langkah Pertama", description: "Menyelesaikan modul pertama", earned: s.completed_modules >= 1 },
    { key: "ten-modules", label: "Rajin Belajar", description: "10 modul selesai", earned: s.completed_modules >= 10 },
    { key: "fifty-modules", label: "Maraton Belajar", description: "50 modul selesai", earned: s.completed_modules >= 50 },
    { key: "quiz-master", label: "Jago Kuis", description: "Rata-rata kuis di atas 85", earned: s.avg_quiz_score >= 85 },
    { key: "quiz-passer", label: "Lulus 5 Kuis", description: "Lulus minimal 5 kuis", earned: s.passed_quizzes >= 5 },
    { key: "streak-7", label: "Streak 7 Hari", description: "Belajar 7 hari berturut-turut", earned: s.streak >= 7 },
    { key: "certified", label: "Bersertifikat", description: "Meraih sertifikat pertama", earned: s.certificates >= 1 },
    { key: "diligent", label: "Tugas Tuntas", description: "Mengumpulkan 5 tugas", earned: s.submissions >= 5 },
  ];
}

export function computeStreak(days: string[]): number {
  const set = new Set(days);
  let streak = 0;
  const cursor = new Date();
  // allow today to be empty without breaking the streak
  if (!set.has(cursor.toISOString().slice(0, 10))) cursor.setDate(cursor.getDate() - 1);
  for (;;) {
    const key = cursor.toISOString().slice(0, 10);
    if (!set.has(key)) break;
    streak += 1;
    cursor.setDate(cursor.getDate() - 1);
  }
  return streak;
}

export function levelFor(percentOrScore: number): { label: string; next: number } {
  if (percentOrScore >= 90) return { label: "Teladan", next: 100 };
  if (percentOrScore >= 70) return { label: "Ahli", next: 90 };
  if (percentOrScore >= 45) return { label: "Mahir", next: 70 };
  if (percentOrScore >= 20) return { label: "Berkembang", next: 45 };
  return { label: "Pemula", next: 20 };
}
