/** Data layer for teacher tools: schedule, attendance and daily journal. */

async function db() {
  const { supabase } = await import("@/integrations/supabase/client");
  return supabase as any;
}

export type AttendanceStatus = "hadir" | "izin" | "sakit" | "alpa";

export const attendanceStatuses: AttendanceStatus[] = ["hadir", "izin", "sakit", "alpa"];

export const statusLabel: Record<AttendanceStatus, string> = {
  hadir: "Hadir",
  izin: "Izin",
  sakit: "Sakit",
  alpa: "Alpa",
};

export const dayNames = ["Minggu", "Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu"];

export type Schedule = {
  id: string;
  grade: number;
  subject: string;
  title: string;
  dayOfWeek: number;
  startTime: string;
  endTime: string;
  room: string | null;
  materialSlug: string | null;
};

export type AttendanceSession = {
  id: string;
  grade: number;
  sessionDate: string;
  meetingNumber: number | null;
  topic: string;
  materialSlug: string | null;
  createdAt: string;
};

export type AttendanceRecord = {
  id: string;
  sessionId: string;
  studentId: string;
  status: AttendanceStatus;
  note: string;
};

export type Journal = {
  id: string;
  journalDate: string;
  grade: number;
  topic: string;
  activities: string;
  obstacles: string;
  reflection: string;
  sessionId: string | null;
};

/* ---------- schedules ---------- */

export async function fetchSchedules(grade?: number): Promise<Schedule[]> {
  const supabase = await db();
  let q = supabase.from("class_schedules").select("*").order("day_of_week").order("start_time");
  if (grade) q = q.eq("grade", grade);
  const { data, error } = await q;
  if (error) throw error;
  return (data || []).map(mapSchedule);
}

export async function saveSchedule(input: {
  id?: string;
  grade: number;
  subject: string;
  title: string;
  dayOfWeek: number;
  startTime: string;
  endTime: string;
  room: string;
  materialSlug: string | null;
  userId: string;
}) {
  const supabase = await db();
  const payload = {
    grade: input.grade,
    subject: input.subject,
    title: input.title,
    day_of_week: input.dayOfWeek,
    start_time: input.startTime,
    end_time: input.endTime,
    room: input.room || null,
    material_slug: input.materialSlug,
    created_by: input.userId,
  };
  const { error } = input.id
    ? await supabase.from("class_schedules").update(payload).eq("id", input.id)
    : await supabase.from("class_schedules").insert(payload);
  if (error) throw error;
}

export async function deleteSchedule(id: string) {
  const supabase = await db();
  const { error } = await supabase.from("class_schedules").delete().eq("id", id);
  if (error) throw error;
}

/* ---------- attendance ---------- */

export async function fetchSessions(grade?: number, termId?: string | null): Promise<AttendanceSession[]> {
  const supabase = await db();
  let q = supabase
    .from("attendance_sessions")
    .select("*")
    .order("session_date", { ascending: false })
    .limit(400);
  if (grade) q = q.eq("grade", grade);
  if (termId) q = q.eq("term_id", termId);
  const { data, error } = await q;
  if (error) throw error;
  return (data || []).map(mapSession);
}


export async function createSession(input: {
  grade: number;
  sessionDate: string;
  meetingNumber: number | null;
  topic: string;
  materialSlug: string | null;
  userId: string;
}): Promise<AttendanceSession> {
  const supabase = await db();
  const { data, error } = await supabase
    .from("attendance_sessions")
    .insert({
      grade: input.grade,
      session_date: input.sessionDate,
      meeting_number: input.meetingNumber,
      topic: input.topic,
      material_slug: input.materialSlug,
      created_by: input.userId,
    })
    .select()
    .single();
  if (error) throw error;
  return mapSession(data);
}

export async function deleteSession(id: string) {
  const supabase = await db();
  const { error } = await supabase.from("attendance_sessions").delete().eq("id", id);
  if (error) throw error;
}

export async function fetchRecords(sessionIds: string[]): Promise<AttendanceRecord[]> {
  if (!sessionIds.length) return [];
  const supabase = await db();
  const { data, error } = await supabase
    .from("attendance_records")
    .select("*")
    .in("session_id", sessionIds);
  if (error) throw error;
  return (data || []).map(mapRecord);
}

export async function fetchMyAttendance(userId: string): Promise<
  Array<AttendanceRecord & { session: AttendanceSession | null }>
> {
  const supabase = await db();
  const { data, error } = await supabase
    .from("attendance_records")
    .select("*, attendance_sessions(*)")
    .eq("student_id", userId);
  if (error) throw error;
  return (data || []).map((row: any) => ({
    ...mapRecord(row),
    session: row.attendance_sessions ? mapSession(row.attendance_sessions) : null,
  }));
}

export async function saveRecord(input: {
  sessionId: string;
  studentId: string;
  status: AttendanceStatus;
  note?: string;
}) {
  const supabase = await db();
  const { error } = await supabase.from("attendance_records").upsert(
    {
      session_id: input.sessionId,
      student_id: input.studentId,
      status: input.status,
      note: input.note ?? "",
    },
    { onConflict: "session_id,student_id" },
  );
  if (error) throw error;
}

export async function saveRecordsBulk(
  sessionId: string,
  rows: Array<{ studentId: string; status: AttendanceStatus; note?: string }>,
) {
  if (!rows.length) return;
  const supabase = await db();
  const { error } = await supabase.from("attendance_records").upsert(
    rows.map((r) => ({
      session_id: sessionId,
      student_id: r.studentId,
      status: r.status,
      note: r.note ?? "",
    })),
    { onConflict: "session_id,student_id" },
  );
  if (error) throw error;
}

/* ---------- journals ---------- */

export async function fetchJournals(grade?: number, termId?: string | null): Promise<Journal[]> {
  const supabase = await db();
  let q = supabase
    .from("teaching_journals")
    .select("*")
    .order("journal_date", { ascending: false })
    .limit(400);
  if (grade) q = q.eq("grade", grade);
  if (termId) q = q.eq("term_id", termId);
  const { data, error } = await q;
  if (error) throw error;
  return (data || []).map(mapJournal);
}


export async function saveJournal(input: {
  id?: string;
  journalDate: string;
  grade: number;
  topic: string;
  activities: string;
  obstacles: string;
  reflection: string;
  sessionId: string | null;
  userId: string;
}) {
  const supabase = await db();
  const payload = {
    journal_date: input.journalDate,
    grade: input.grade,
    topic: input.topic,
    activities: input.activities,
    obstacles: input.obstacles,
    reflection: input.reflection,
    session_id: input.sessionId,
    created_by: input.userId,
  };
  const { error } = input.id
    ? await supabase.from("teaching_journals").update(payload).eq("id", input.id)
    : await supabase.from("teaching_journals").insert(payload);
  if (error) throw error;
}

export async function deleteJournal(id: string) {
  const supabase = await db();
  const { error } = await supabase.from("teaching_journals").delete().eq("id", id);
  if (error) throw error;
}

/* ---------- helpers ---------- */

export function attendanceRate(records: Array<{ status: AttendanceStatus }>) {
  if (!records.length) return 0;
  const present = records.filter((r) => r.status === "hadir").length;
  return Math.round((present / records.length) * 100);
}

export function formatDay(date: string) {
  return new Date(date).toLocaleDateString("id-ID", {
    weekday: "long",
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function mapSchedule(row: any): Schedule {
  return {
    id: row.id,
    grade: row.grade,
    subject: row.subject,
    title: row.title,
    dayOfWeek: row.day_of_week,
    startTime: String(row.start_time).slice(0, 5),
    endTime: String(row.end_time).slice(0, 5),
    room: row.room,
    materialSlug: row.material_slug,
  };
}

function mapSession(row: any): AttendanceSession {
  return {
    id: row.id,
    grade: row.grade,
    sessionDate: row.session_date,
    meetingNumber: row.meeting_number,
    topic: row.topic,
    materialSlug: row.material_slug,
    createdAt: row.created_at,
  };
}

function mapRecord(row: any): AttendanceRecord {
  return {
    id: row.id,
    sessionId: row.session_id,
    studentId: row.student_id,
    status: row.status,
    note: row.note ?? "",
  };
}

function mapJournal(row: any): Journal {
  return {
    id: row.id,
    journalDate: row.journal_date,
    grade: row.grade,
    topic: row.topic,
    activities: row.activities,
    obstacles: row.obstacles,
    reflection: row.reflection,
    sessionId: row.session_id,
  };
}

export type StudentLite = { id: string; name: string; grade: number | null };

/** Roster for a grade (staff-only read via RLS). */
export async function fetchStudentsByGrade(grade: number): Promise<StudentLite[]> {
  const supabase = await db();
  const { data, error } = await supabase
    .from("profiles")
    .select("id, display_name, email, grade")
    .eq("grade", grade)
    .order("display_name");
  if (error) throw error;
  return (data || []).map((p: any) => ({
    id: p.id,
    name: p.display_name || p.email || "Siswa",
    grade: p.grade,
  }));
}
