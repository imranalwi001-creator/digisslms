ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS leaderboard_opt_out boolean NOT NULL DEFAULT false;

-- Prevent students from changing their own grade once set (admins bypass)
CREATE OR REPLACE FUNCTION public.protect_profile_grade()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF OLD.grade IS NOT NULL
     AND NEW.grade IS DISTINCT FROM OLD.grade
     AND NOT public.has_role(auth.uid(), 'admin'::public.app_role) THEN
    NEW.grade := OLD.grade;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS profiles_protect_grade ON public.profiles;
CREATE TRIGGER profiles_protect_grade
BEFORE UPDATE ON public.profiles
FOR EACH ROW EXECUTE FUNCTION public.protect_profile_grade();

-- Public (student-to-student) achievement stats. Security definer view: safe columns only.
CREATE OR REPLACE VIEW public.student_public_stats
WITH (security_invoker = false) AS
SELECT
  p.id,
  p.display_name,
  p.avatar_url,
  p.grade,
  p.created_at,
  p.leaderboard_opt_out,
  COALESCE(mp.completed_modules, 0)::int AS completed_modules,
  COALESCE(mp.last_activity, NULL)       AS last_activity,
  COALESCE(en.enrollments, 0)::int       AS enrollments,
  COALESCE(qa.quiz_attempts, 0)::int     AS quiz_attempts,
  COALESCE(qa.avg_quiz_score, 0)::numeric AS avg_quiz_score,
  COALESCE(qa.passed_quizzes, 0)::int    AS passed_quizzes,
  COALESCE(sub.submissions, 0)::int      AS submissions,
  COALESCE(ce.certificates, 0)::int      AS certificates
FROM public.profiles p
LEFT JOIN (
  SELECT user_id, count(*) AS completed_modules, max(completed_at) AS last_activity
  FROM public.module_progress GROUP BY user_id
) mp ON mp.user_id = p.id
LEFT JOIN (
  SELECT user_id, count(*) AS enrollments FROM public.enrollments GROUP BY user_id
) en ON en.user_id = p.id
LEFT JOIN (
  SELECT user_id,
         count(*) AS quiz_attempts,
         round(avg(CASE WHEN max_score > 0 THEN score::numeric * 100 / max_score ELSE 0 END), 1) AS avg_quiz_score,
         count(*) FILTER (WHERE is_passed) AS passed_quizzes
  FROM public.quiz_attempts WHERE completed_at IS NOT NULL GROUP BY user_id
) qa ON qa.user_id = p.id
LEFT JOIN (
  SELECT user_id, count(*) AS submissions FROM public.assignment_submissions GROUP BY user_id
) sub ON sub.user_id = p.id
LEFT JOIN (
  SELECT user_id, count(*) AS certificates FROM public.certificates GROUP BY user_id
) ce ON ce.user_id = p.id
WHERE p.status = 'active';

GRANT SELECT ON public.student_public_stats TO authenticated;

-- Per-day activity for momentum charts, shared between students
CREATE OR REPLACE VIEW public.student_public_activity
WITH (security_invoker = false) AS
SELECT user_id, (completed_at AT TIME ZONE 'UTC')::date AS day, count(*)::int AS modules
FROM public.module_progress
GROUP BY user_id, (completed_at AT TIME ZONE 'UTC')::date;

GRANT SELECT ON public.student_public_activity TO authenticated;