/**
 * Academic year + semester periods.
 * Exactly one term is active; the rest are archives used for later reports.
 */
import { useCallback, useEffect, useState } from "react";

async function db() {
  const { supabase } = await import("@/integrations/supabase/client");
  return supabase as any;
}

export type Term = {
  id: string;
  yearLabel: string;
  semester: 1 | 2;
  startDate: string | null;
  endDate: string | null;
  isActive: boolean;
  isArchived: boolean;
  notes: string;
};

export const semesterLabel = (s: number) => (s === 1 ? "Ganjil" : "Genap");

export const termLabel = (t: Term | null | undefined) =>
  t ? `${t.yearLabel} — Semester ${semesterLabel(t.semester)}` : "Belum ada periode aktif";

function map(row: any): Term {
  return {
    id: row.id,
    yearLabel: row.year_label,
    semester: row.semester,
    startDate: row.start_date,
    endDate: row.end_date,
    isActive: row.is_active,
    isArchived: row.is_archived,
    notes: row.notes ?? "",
  };
}

export async function fetchTerms(): Promise<Term[]> {
  const supabase = await db();
  const { data, error } = await supabase
    .from("academic_terms")
    .select("*")
    .order("year_label", { ascending: false })
    .order("semester", { ascending: false });
  if (error) throw error;
  return (data || []).map(map);
}

export async function fetchActiveTerm(): Promise<Term | null> {
  const supabase = await db();
  const { data, error } = await supabase
    .from("academic_terms")
    .select("*")
    .eq("is_active", true)
    .maybeSingle();
  if (error) throw error;
  return data ? map(data) : null;
}

export type TermInput = {
  yearLabel: string;
  semester: 1 | 2;
  startDate: string | null;
  endDate: string | null;
  notes: string;
};

export async function createTerm(input: TermInput, userId: string) {
  const supabase = await db();
  const { error } = await supabase.from("academic_terms").insert({
    year_label: input.yearLabel,
    semester: input.semester,
    start_date: input.startDate || null,
    end_date: input.endDate || null,
    notes: input.notes,
    created_by: userId,
  });
  if (error) throw error;
}

export async function updateTerm(id: string, input: TermInput) {
  const supabase = await db();
  const { error } = await supabase
    .from("academic_terms")
    .update({
      year_label: input.yearLabel,
      semester: input.semester,
      start_date: input.startDate || null,
      end_date: input.endDate || null,
      notes: input.notes,
    })
    .eq("id", id);
  if (error) throw error;
}

/** Activating a term archives the previously active one (database trigger). */
export async function activateTerm(id: string) {
  const supabase = await db();
  const { error } = await supabase.from("academic_terms").update({ is_active: true }).eq("id", id);
  if (error) throw error;
}

export async function setArchived(id: string, archived: boolean) {
  const supabase = await db();
  const { error } = await supabase
    .from("academic_terms")
    .update({ is_archived: archived, ...(archived ? { is_active: false } : {}) })
    .eq("id", id);
  if (error) throw error;
}

export async function deleteTerm(id: string) {
  const supabase = await db();
  const { error } = await supabase.from("academic_terms").delete().eq("id", id);
  if (error) throw error;
}

/** All terms plus the active one, with a reload helper. */
export function useTerms() {
  const [terms, setTerms] = useState<Term[]>([]);
  const [loading, setLoading] = useState(true);

  const reload = useCallback(async () => {
    try {
      setTerms(await fetchTerms());
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    reload();
  }, [reload]);

  return { terms, active: terms.find((t) => t.isActive) ?? null, loading, reload };
}
