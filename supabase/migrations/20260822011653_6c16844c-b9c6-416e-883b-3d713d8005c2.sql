ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS bio text NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS banner_url text,
  ADD COLUMN IF NOT EXISTS headline text,
  ADD COLUMN IF NOT EXISTS social_link text;

DROP VIEW IF EXISTS public.student_public_stats;
CREATE VIEW public.student_public_stats
WITH (security_invoker = off) AS
 SELECT p.id,
    p.display_name,
    p.avatar_url,
    p.banner_url,
    p.headline,
    p.bio,
    p.social_link,
    p.grade,
    p.created_at,
    p.leaderboard_opt_out,
    COALESCE(mp.completed_modules, 0::bigint)::integer AS completed_modules,
    COALESCE(mp.last_activity, NULL::timestamp with time zone) AS last_activity,
    COALESCE(en.enrollments, 0::bigint)::integer AS enrollments,
    COALESCE(qa.quiz_attempts, 0::bigint)::integer AS quiz_attempts,
    COALESCE(qa.avg_quiz_score, 0::numeric) AS avg_quiz_score,
    COALESCE(qa.passed_quizzes, 0::bigint)::integer AS passed_quizzes,
    COALESCE(sub.submissions, 0::bigint)::integer AS submissions,
    COALESCE(ce.certificates, 0::bigint)::integer AS certificates
   FROM public.profiles p
     LEFT JOIN ( SELECT module_progress.user_id,
            count(*) AS completed_modules,
            max(module_progress.completed_at) AS last_activity
           FROM public.module_progress
          GROUP BY module_progress.user_id) mp ON mp.user_id = p.id
     LEFT JOIN ( SELECT enrollments.user_id,
            count(*) AS enrollments
           FROM public.enrollments
          GROUP BY enrollments.user_id) en ON en.user_id = p.id
     LEFT JOIN ( SELECT quiz_attempts.user_id,
            count(*) AS quiz_attempts,
            round(avg(
                CASE
                    WHEN quiz_attempts.max_score > 0 THEN quiz_attempts.score::numeric * 100::numeric / quiz_attempts.max_score::numeric
                    ELSE 0::numeric
                END), 1) AS avg_quiz_score,
            count(*) FILTER (WHERE quiz_attempts.is_passed) AS passed_quizzes
           FROM public.quiz_attempts
          WHERE quiz_attempts.completed_at IS NOT NULL
          GROUP BY quiz_attempts.user_id) qa ON qa.user_id = p.id
     LEFT JOIN ( SELECT assignment_submissions.user_id,
            count(*) AS submissions
           FROM public.assignment_submissions
          GROUP BY assignment_submissions.user_id) sub ON sub.user_id = p.id
     LEFT JOIN ( SELECT certificates.user_id,
            count(*) AS certificates
           FROM public.certificates
          GROUP BY certificates.user_id) ce ON ce.user_id = p.id
  WHERE p.status = 'active'::text;

CREATE POLICY "Public can read profile media"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'profile-media');

CREATE POLICY "Users upload their own profile media"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'profile-media' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users update their own profile media"
  ON storage.objects FOR UPDATE TO authenticated
  USING (bucket_id = 'profile-media' AND auth.uid()::text = (storage.foldername(name))[1])
  WITH CHECK (bucket_id = 'profile-media' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users delete their own profile media"
  ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'profile-media' AND auth.uid()::text = (storage.foldername(name))[1]);