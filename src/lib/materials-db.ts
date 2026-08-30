import { useCallback, useEffect, useState } from "react";
import { materials as builtinMaterials, type Materi } from "./materials";
import fallbackImage from "@/assets/course-1.jpg";

export type CatalogMaterial = Materi & {
  id: string | null;
  description: string;
  isPublished: boolean;
  isCustom: boolean;
  semester: 1 | 2;
  element: string | null;
};

export type MaterialInput = {
  slug: string;
  title: string;
  subject: string;
  grade: 7 | 8 | 9;
  semester: 1 | 2;
  element: string | null;
  description: string;
  imageUrl: string | null;
  duration: string;
  moduleList: string[];
  isPublished: boolean;
};

async function db() {
  const { supabase } = await import("@/integrations/supabase/client");
  return supabase as any;
}

export function slugify(value: string): string {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .slice(0, 60);
}

function fromBuiltin(m: Materi): CatalogMaterial {
  return {
    ...m,
    id: null,
    description: m.description || "",
    isPublished: true,
    isCustom: false,
    semester: m.semester ?? 1,
    element: m.element ?? null,
  };
}

function fromRow(row: any): CatalogMaterial {
  const moduleList: string[] = Array.isArray(row.module_list) ? row.module_list.map(String) : [];
  return {
    id: row.id,
    slug: row.slug,
    title: row.title,
    subject: row.subject,
    grade: (row.grade ?? 7) as 7 | 8 | 9,
    semester: ((row.semester ?? 1) === 2 ? 2 : 1) as 1 | 2,
    element: row.element ?? null,
    description: row.description ?? "",
    image: row.image_url || fallbackImage,
    duration: row.duration || "—",
    modules: moduleList.length,
    moduleList,
    isPublished: !!row.is_published,
    isCustom: true,
  };
}


/** Built-in curriculum merged with admin-managed materials (DB wins on slug clash). */
export async function fetchCatalog(includeUnpublished = false): Promise<CatalogMaterial[]> {
  let rows: any[] = [];
  try {
    const supabase = await db();
    let query = supabase.from("materials").select("*").order("created_at", { ascending: true });
    if (!includeUnpublished) query = query.eq("is_published", true);
    const { data, error } = await query;
    if (error) throw error;
    rows = data || [];
  } catch {
    rows = [];
  }
  const custom = rows.map(fromRow);
  const overridden = new Set(custom.map((m) => m.slug));
  const base = builtinMaterials.filter((m) => !overridden.has(m.slug)).map(fromBuiltin);
  return [...base, ...custom].sort(
    (a, b) => a.grade - b.grade || a.semester - b.semester || a.title.localeCompare(b.title),
  );
}

export function useCatalog(includeUnpublished = false) {
  const [list, setList] = useState<CatalogMaterial[]>(() => builtinMaterials.map(fromBuiltin));
  const [loading, setLoading] = useState(true);

  const reload = useCallback(async () => {
    setLoading(true);
    try {
      setList(await fetchCatalog(includeUnpublished));
    } finally {
      setLoading(false);
    }
  }, [includeUnpublished]);

  useEffect(() => {
    let active = true;
    fetchCatalog(includeUnpublished)
      .then((data) => {
        if (active) setList(data);
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [includeUnpublished]);

  return { list, loading, reload };
}

function toRow(input: MaterialInput) {
  return {
    slug: input.slug,
    title: input.title,
    subject: input.subject,
    grade: input.grade,
    semester: input.semester,
    element: input.element,
    description: input.description,
    image_url: input.imageUrl,
    duration: input.duration,
    module_list: input.moduleList,
    is_published: input.isPublished,
  };
}

export async function createMaterial(input: MaterialInput) {
  const supabase = await db();
  const { data: auth } = await supabase.auth.getUser();
  const { error } = await supabase
    .from("materials")
    .insert({ ...toRow(input), created_by: auth?.user?.id ?? null });
  if (error) throw error;
}

export async function updateMaterial(id: string, input: MaterialInput) {
  const supabase = await db();
  const { error } = await supabase.from("materials").update(toRow(input)).eq("id", id);
  if (error) throw error;
}

export async function deleteMaterial(id: string) {
  const supabase = await db();
  const { error } = await supabase.from("materials").delete().eq("id", id);
  if (error) throw error;
}
