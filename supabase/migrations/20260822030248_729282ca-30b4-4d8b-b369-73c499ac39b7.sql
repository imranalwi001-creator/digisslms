CREATE TABLE public.class_schedules (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  grade smallint NOT NULL,
  subject text NOT NULL DEFAULT 'Digital Class',
  title text NOT NULL,
  day_of_week smallint NOT NULL,
  start_time time NOT NULL,
  end_time time NOT NULL,
  room text,
  material_slug text,
  created_by uuid REFERENCES auth.users(id),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.class_schedules TO authenticated;
GRANT ALL ON public.class_schedules TO service_role;
ALTER TABLE public.class_schedules ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Staff manage schedules" ON public.class_schedules FOR ALL TO authenticated USING (public.is_staff(auth.uid())) WITH CHECK (public.is_staff(auth.uid()));
CREATE POLICY "Students view own grade schedule" ON public.class_schedules FOR SELECT TO authenticated USING (EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.grade = class_schedules.grade));
CREATE TRIGGER class_schedules_set_updated_at BEFORE UPDATE ON public.class_schedules FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TABLE public.attendance_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  grade smallint NOT NULL,
  session_date date NOT NULL DEFAULT current_date,
  meeting_number integer,
  topic text NOT NULL DEFAULT '',
  material_slug text,
  created_by uuid REFERENCES auth.users(id),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.attendance_sessions TO authenticated;
GRANT ALL ON public.attendance_sessions TO service_role;
ALTER TABLE public.attendance_sessions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Staff manage attendance sessions" ON public.attendance_sessions FOR ALL TO authenticated USING (public.is_staff(auth.uid())) WITH CHECK (public.is_staff(auth.uid()));
CREATE POLICY "Students view own grade sessions" ON public.attendance_sessions FOR SELECT TO authenticated USING (EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.grade = attendance_sessions.grade));
CREATE TRIGGER attendance_sessions_set_updated_at BEFORE UPDATE ON public.attendance_sessions FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TABLE public.attendance_records (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id uuid NOT NULL REFERENCES public.attendance_sessions(id) ON DELETE CASCADE,
  student_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  status text NOT NULL DEFAULT 'hadir',
  note text NOT NULL DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (session_id, student_id)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.attendance_records TO authenticated;
GRANT ALL ON public.attendance_records TO service_role;
ALTER TABLE public.attendance_records ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Staff manage attendance records" ON public.attendance_records FOR ALL TO authenticated USING (public.is_staff(auth.uid())) WITH CHECK (public.is_staff(auth.uid()));
CREATE POLICY "Students view own attendance" ON public.attendance_records FOR SELECT TO authenticated USING (student_id = auth.uid());
CREATE TRIGGER attendance_records_set_updated_at BEFORE UPDATE ON public.attendance_records FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TABLE public.teaching_journals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  journal_date date NOT NULL DEFAULT current_date,
  grade smallint NOT NULL,
  topic text NOT NULL,
  activities text NOT NULL DEFAULT '',
  obstacles text NOT NULL DEFAULT '',
  reflection text NOT NULL DEFAULT '',
  material_slug text,
  session_id uuid REFERENCES public.attendance_sessions(id) ON DELETE SET NULL,
  created_by uuid REFERENCES auth.users(id),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.teaching_journals TO authenticated;
GRANT ALL ON public.teaching_journals TO service_role;
ALTER TABLE public.teaching_journals ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Staff manage journals" ON public.teaching_journals FOR ALL TO authenticated USING (public.is_staff(auth.uid())) WITH CHECK (public.is_staff(auth.uid()));
CREATE TRIGGER teaching_journals_set_updated_at BEFORE UPDATE ON public.teaching_journals FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE INDEX idx_attendance_records_session ON public.attendance_records(session_id);
CREATE INDEX idx_attendance_sessions_grade_date ON public.attendance_sessions(grade, session_date DESC);
CREATE INDEX idx_journals_date ON public.teaching_journals(journal_date DESC);
CREATE INDEX idx_schedules_grade_day ON public.class_schedules(grade, day_of_week);