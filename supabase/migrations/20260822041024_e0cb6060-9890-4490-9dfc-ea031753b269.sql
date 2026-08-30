CREATE TABLE public.schedule_materials (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  schedule_id uuid NOT NULL REFERENCES public.class_schedules(id) ON DELETE CASCADE,
  version integer NOT NULL DEFAULT 1,
  title text NOT NULL DEFAULT '',
  kind text NOT NULL DEFAULT 'url',
  value text NOT NULL,
  note text NOT NULL DEFAULT '',
  is_active boolean NOT NULL DEFAULT true,
  created_by uuid REFERENCES auth.users(id),
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT schedule_materials_kind_check CHECK (kind IN ('catalog','url','file')),
  CONSTRAINT schedule_materials_version_unique UNIQUE (schedule_id, version)
);

GRANT SELECT ON public.schedule_materials TO authenticated;
GRANT INSERT, UPDATE, DELETE ON public.schedule_materials TO authenticated;
GRANT ALL ON public.schedule_materials TO service_role;

ALTER TABLE public.schedule_materials ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated can view schedule materials"
  ON public.schedule_materials FOR SELECT TO authenticated USING (true);

CREATE POLICY "Staff can insert schedule materials"
  ON public.schedule_materials FOR INSERT TO authenticated
  WITH CHECK (public.is_staff(auth.uid()));

CREATE POLICY "Staff can update schedule materials"
  ON public.schedule_materials FOR UPDATE TO authenticated
  USING (public.is_staff(auth.uid())) WITH CHECK (public.is_staff(auth.uid()));

CREATE POLICY "Staff can delete schedule materials"
  ON public.schedule_materials FOR DELETE TO authenticated
  USING (public.is_staff(auth.uid()));

CREATE TRIGGER schedule_materials_set_updated_at
  BEFORE UPDATE ON public.schedule_materials
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE INDEX schedule_materials_schedule_idx ON public.schedule_materials(schedule_id, version DESC);