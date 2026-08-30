/** CSV bulk import for attendance, with row-level validation. */
import { attendanceStatuses, statusLabel, type AttendanceStatus, type StudentLite } from "./teaching";

export type ImportRow = {
  line: number;
  raw: string;
  name: string;
  statusText: string;
  note: string;
  studentId: string | null;
  status: AttendanceStatus | null;
  error: string | null;
};

export type ImportResult = {
  rows: ImportRow[];
  valid: ImportRow[];
  errors: ImportRow[];
  duplicates: number;
  missing: StudentLite[];
};

/** Minimal RFC4180-ish splitter supporting quotes and , or ; separators. */
export function parseCsv(text: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let cell = "";
  let quoted = false;
  const sep = (text.split("\n")[0]?.match(/;/g)?.length ?? 0) > (text.split("\n")[0]?.match(/,/g)?.length ?? 0) ? ";" : ",";

  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    if (quoted) {
      if (ch === '"' && text[i + 1] === '"') {
        cell += '"';
        i++;
      } else if (ch === '"') {
        quoted = false;
      } else {
        cell += ch;
      }
      continue;
    }
    if (ch === '"') quoted = true;
    else if (ch === sep) {
      row.push(cell.trim());
      cell = "";
    } else if (ch === "\n") {
      row.push(cell.trim());
      rows.push(row);
      row = [];
      cell = "";
    } else if (ch !== "\r") {
      cell += ch;
    }
  }
  row.push(cell.trim());
  if (row.some((c) => c.length)) rows.push(row);
  return rows.filter((r) => r.some((c) => c.length));
}

const normalize = (value: string) => value.trim().toLowerCase().replace(/\s+/g, " ");

const statusAliases: Record<string, AttendanceStatus> = {
  hadir: "hadir",
  h: "hadir",
  present: "hadir",
  masuk: "hadir",
  izin: "izin",
  i: "izin",
  ijin: "izin",
  sakit: "sakit",
  s: "sakit",
  alpa: "alpa",
  a: "alpa",
  alfa: "alpa",
  absen: "alpa",
  bolos: "alpa",
};

export const csvTemplate = (students: StudentLite[]) =>
  [
    ["Nama siswa", "Status", "Catatan"],
    ...(students.length
      ? students.map((s) => [s.name, "hadir", ""])
      : [["Nama siswa contoh", "hadir", "opsional"]]),
  ] as string[][];

export const statusHint = attendanceStatuses.map((s) => statusLabel[s]).join(" / ");

/**
 * Maps CSV rows to students of the class. Matches by exact name/email first,
 * then by case-insensitive name. Every problem is reported per row.
 */
export function validateImport(text: string, students: StudentLite[]): ImportResult {
  const table = parseCsv(text);
  if (!table.length) {
    return { rows: [], valid: [], errors: [], duplicates: 0, missing: students };
  }
  const first = table[0]!.map(normalize);
  const hasHeader = first.some((c) => ["nama", "nama siswa", "siswa", "name"].includes(c));
  const body = hasHeader ? table.slice(1) : table;

  const byName = new Map<string, StudentLite>();
  for (const s of students) byName.set(normalize(s.name), s);

  const seen = new Set<string>();
  let duplicates = 0;

  const rows: ImportRow[] = body.map((cols, idx) => {
    const line = idx + (hasHeader ? 2 : 1);
    const name = cols[0] ?? "";
    const statusText = cols[1] ?? "";
    const note = cols[2] ?? "";
    const match = byName.get(normalize(name)) ?? null;
    const status = statusAliases[normalize(statusText)] ?? null;

    let error: string | null = null;
    if (!name.trim()) error = "Nama kosong";
    else if (!match) error = "Siswa tidak ditemukan di kelas ini";
    else if (!statusText.trim()) error = "Status kosong";
    else if (!status) error = `Status tidak dikenal (gunakan ${statusHint})`;
    else if (seen.has(match.id)) {
      error = "Baris ganda untuk siswa yang sama";
      duplicates++;
    }
    if (!error && match) seen.add(match.id);

    return {
      line,
      raw: cols.join(", "),
      name,
      statusText,
      note,
      studentId: match?.id ?? null,
      status,
      error,
    };
  });

  return {
    rows,
    valid: rows.filter((r) => !r.error),
    errors: rows.filter((r) => r.error),
    duplicates,
    missing: students.filter((s) => !seen.has(s.id)),
  };
}
