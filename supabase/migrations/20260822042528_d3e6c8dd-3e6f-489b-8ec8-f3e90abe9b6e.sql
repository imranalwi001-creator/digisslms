-- ============ ACADEMIC TERMS ============
CREATE TABLE public.academic_terms (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  year_label text NOT NULL,
  semester smallint NOT NULL CHECK (semester IN (1,2)),
  start_date date,
  end_date date,
  is_active boolean NOT NULL DEFAULT false,
  is_archived boolean NOT NULL DEFAULT false,
  notes text NOT NULL DEFAULT '',
  created_by uuid REFERENCES auth.users(id),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (year_label, semester)
);

CREATE UNIQUE INDEX academic_terms_single_active ON public.academic_terms (is_active) WHERE is_active;

GRANT SELECT ON public.academic_terms TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.academic_terms TO authenticated;
GRANT ALL ON public.academic_terms TO service_role;
ALTER TABLE public.academic_terms ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view terms" ON public.academic_terms FOR SELECT USING (true);
CREATE POLICY "Admins insert terms" ON public.academic_terms FOR INSERT TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'admin'::public.app_role));
CREATE POLICY "Admins update terms" ON public.academic_terms FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::public.app_role))
  WITH CHECK (public.has_role(auth.uid(), 'admin'::public.app_role));
CREATE POLICY "Admins delete terms" ON public.academic_terms FOR DELETE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::public.app_role));

CREATE TRIGGER academic_terms_set_updated_at BEFORE UPDATE ON public.academic_terms
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- keep exactly one active term, archive the rest
CREATE OR REPLACE FUNCTION public.sync_active_term()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NEW.is_active THEN
    UPDATE public.academic_terms
      SET is_active = false, is_archived = true
      WHERE id <> NEW.id AND is_active;
    NEW.is_archived := false;
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER academic_terms_sync_active BEFORE INSERT OR UPDATE OF is_active ON public.academic_terms
  FOR EACH ROW EXECUTE FUNCTION public.sync_active_term();

CREATE OR REPLACE FUNCTION public.active_term_id()
RETURNS uuid LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT id FROM public.academic_terms WHERE is_active LIMIT 1
$$;

-- link teaching data to a term
ALTER TABLE public.attendance_sessions ADD COLUMN term_id uuid REFERENCES public.academic_terms(id) ON DELETE SET NULL;
ALTER TABLE public.teaching_journals ADD COLUMN term_id uuid REFERENCES public.academic_terms(id) ON DELETE SET NULL;
ALTER TABLE public.class_schedules ADD COLUMN term_id uuid REFERENCES public.academic_terms(id) ON DELETE SET NULL;

ALTER TABLE public.attendance_sessions ALTER COLUMN term_id SET DEFAULT public.active_term_id();
ALTER TABLE public.teaching_journals ALTER COLUMN term_id SET DEFAULT public.active_term_id();
ALTER TABLE public.class_schedules ALTER COLUMN term_id SET DEFAULT public.active_term_id();

CREATE INDEX attendance_sessions_term_idx ON public.attendance_sessions (term_id);
CREATE INDEX teaching_journals_term_idx ON public.teaching_journals (term_id);
CREATE INDEX class_schedules_term_idx ON public.class_schedules (term_id);

-- ============ RUBRICS ============
CREATE TABLE public.rubrics (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  material_slug text NOT NULL,
  grade smallint,
  title text NOT NULL,
  description text NOT NULL DEFAULT '',
  is_published boolean NOT NULL DEFAULT true,
  created_by uuid REFERENCES auth.users(id),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.rubrics TO authenticated;
GRANT ALL ON public.rubrics TO service_role;
ALTER TABLE public.rubrics ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Staff manage rubrics" ON public.rubrics FOR ALL TO authenticated
  USING (public.is_staff(auth.uid())) WITH CHECK (public.is_staff(auth.uid()));
CREATE POLICY "Students view published rubrics" ON public.rubrics FOR SELECT TO authenticated
  USING (is_published);
CREATE TRIGGER rubrics_set_updated_at BEFORE UPDATE ON public.rubrics
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TABLE public.rubric_criteria (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  rubric_id uuid NOT NULL REFERENCES public.rubrics(id) ON DELETE CASCADE,
  name text NOT NULL,
  description text NOT NULL DEFAULT '',
  weight integer NOT NULL DEFAULT 1,
  max_score integer NOT NULL DEFAULT 4,
  position integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.rubric_criteria TO authenticated;
GRANT ALL ON public.rubric_criteria TO service_role;
ALTER TABLE public.rubric_criteria ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Staff manage criteria" ON public.rubric_criteria FOR ALL TO authenticated
  USING (public.is_staff(auth.uid())) WITH CHECK (public.is_staff(auth.uid()));
CREATE POLICY "Students view criteria of published rubrics" ON public.rubric_criteria FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM public.rubrics r WHERE r.id = rubric_id AND r.is_published));

CREATE TABLE public.rubric_assessments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  rubric_id uuid NOT NULL REFERENCES public.rubrics(id) ON DELETE CASCADE,
  student_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  term_id uuid REFERENCES public.academic_terms(id) ON DELETE SET NULL DEFAULT public.active_term_id(),
  total_score numeric NOT NULL DEFAULT 0,
  note text NOT NULL DEFAULT '',
  assessed_by uuid REFERENCES auth.users(id),
  assessed_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (rubric_id, student_id, term_id)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.rubric_assessments TO authenticated;
GRANT ALL ON public.rubric_assessments TO service_role;
ALTER TABLE public.rubric_assessments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Staff manage assessments" ON public.rubric_assessments FOR ALL TO authenticated
  USING (public.is_staff(auth.uid())) WITH CHECK (public.is_staff(auth.uid()));
CREATE POLICY "Students view own assessments" ON public.rubric_assessments FOR SELECT TO authenticated
  USING (auth.uid() = student_id);
CREATE TRIGGER rubric_assessments_set_updated_at BEFORE UPDATE ON public.rubric_assessments
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TABLE public.rubric_scores (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  assessment_id uuid NOT NULL REFERENCES public.rubric_assessments(id) ON DELETE CASCADE,
  criterion_id uuid NOT NULL REFERENCES public.rubric_criteria(id) ON DELETE CASCADE,
  score numeric NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (assessment_id, criterion_id)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.rubric_scores TO authenticated;
GRANT ALL ON public.rubric_scores TO service_role;
ALTER TABLE public.rubric_scores ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Staff manage scores" ON public.rubric_scores FOR ALL TO authenticated
  USING (public.is_staff(auth.uid())) WITH CHECK (public.is_staff(auth.uid()));
CREATE POLICY "Students view own scores" ON public.rubric_scores FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM public.rubric_assessments a WHERE a.id = assessment_id AND a.student_id = auth.uid()));

CREATE INDEX rubric_criteria_rubric_idx ON public.rubric_criteria (rubric_id, position);
CREATE INDEX rubric_assessments_student_idx ON public.rubric_assessments (student_id);
CREATE INDEX rubric_scores_assessment_idx ON public.rubric_scores (assessment_id);

-- seed the current term
INSERT INTO public.academic_terms (year_label, semester, start_date, end_date, is_active, notes)
VALUES ('2026/2027', 1, '2026-07-13', '2026-12-19', true, 'Periode berjalan');
