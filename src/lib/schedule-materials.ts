/** Versioned lesson materials attached to a weekly schedule slot. */

async function db() {
  const { supabase } = await import("@/integrations/supabase/client");
  return supabase as any;
}

export type MaterialKind = "catalog" | "url" | "file";

export type ScheduleMaterial = {
  id: string;
  scheduleId: string;
  version: number;
  title: string;
  kind: MaterialKind;
  value: string;
  note: string;
  isActive: boolean;
  createdAt: string;
};

function map(row: any): ScheduleMaterial {
  return {
    id: row.id,
    scheduleId: row.schedule_id,
    version: row.version,
    title: row.title ?? "",
    kind: row.kind,
    value: row.value,
    note: row.note ?? "",
    isActive: row.is_active,
    createdAt: row.created_at,
  };
}

/** Infers the storage kind from a raw value (catalog slug, URL, or upload path). */
export function detectKind(value: string): MaterialKind {
  if (value.startsWith("materi-jadwal/")) return "file";
  if (/^https?:\/\//.test(value)) return "url";
  return "catalog";
}

export const kindLabel: Record<MaterialKind, string> = {
  catalog: "Materi katalog",
  url: "Tautan",
  file: "Berkas",
};

export async function fetchScheduleMaterials(scheduleIds: string[]): Promise<ScheduleMaterial[]> {
  if (!scheduleIds.length) return [];
  const supabase = await db();
  const { data, error } = await supabase
    .from("schedule_materials")
    .select("*")
    .in("schedule_id", scheduleIds)
    .order("version", { ascending: false });
  if (error) throw error;
  return (data || []).map(map);
}

/** Adds a new version, keeping older ones as history and deactivating them. */
export async function addMaterialVersion(input: {
  scheduleId: string;
  title: string;
  value: string;
  note: string;
  userId: string;
  existing: ScheduleMaterial[];
}): Promise<ScheduleMaterial> {
  const supabase = await db();
  const nextVersion = Math.max(0, ...input.existing.map((m) => m.version)) + 1;
  await supabase
    .from("schedule_materials")
    .update({ is_active: false })
    .eq("schedule_id", input.scheduleId);
  const { data, error } = await supabase
    .from("schedule_materials")
    .insert({
      schedule_id: input.scheduleId,
      version: nextVersion,
      title: input.title,
      kind: detectKind(input.value),
      value: input.value,
      note: input.note,
      is_active: true,
      created_by: input.userId,
    })
    .select()
    .single();
  if (error) throw error;
  return map(data);
}

/** Restores an older version by making it the active one again. */
export async function activateMaterialVersion(scheduleId: string, id: string) {
  const supabase = await db();
  const off = await supabase
    .from("schedule_materials")
    .update({ is_active: false })
    .eq("schedule_id", scheduleId);
  if (off.error) throw off.error;
  const { error } = await supabase.from("schedule_materials").update({ is_active: true }).eq("id", id);
  if (error) throw error;
}

export async function deleteMaterialVersion(id: string) {
  const supabase = await db();
  const { error } = await supabase.from("schedule_materials").delete().eq("id", id);
  if (error) throw error;
}

/** Best-effort preview type for the inline previewer. */
export function previewType(value: string): "image" | "pdf" | "video" | "embed" | "none" {
  const clean = value.split("?")[0]?.toLowerCase() ?? "";
  if (/\.(png|jpe?g|gif|webp|svg)$/.test(clean)) return "image";
  if (clean.endsWith(".pdf")) return "pdf";
  if (/\.(mp4|webm|ogg)$/.test(clean)) return "video";
  if (/youtube\.com|youtu\.be|drive\.google\.com|docs\.google\.com/.test(clean)) return "embed";
  return "none";
}

/** Converts common share links into embeddable URLs. */
export function toEmbedUrl(url: string): string {
  const yt = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([\w-]{6,})/);
  if (yt) return `https://www.youtube.com/embed/${yt[1]}`;
  const drive = url.match(/drive\.google\.com\/file\/d\/([\w-]+)/);
  if (drive) return `https://drive.google.com/file/d/${drive[1]}/preview`;
  if (/docs\.google\.com/.test(url)) return url.replace(/\/(edit|view).*$/, "/preview");
  return url;
}
