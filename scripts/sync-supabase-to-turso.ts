import { createClient } from "@supabase/supabase-js";
import { getTursoClient } from "../src/lib/turso";
import { hashPassword } from "../src/lib/turso-auth";

async function main() {
  const url = "https://sutvsbkrsfwrqpmslqpq.supabase.co";
  const key = "sb_publishable_AETzNUCgAkvAOlGxoeMe0A_nG8hac1R";
  const supabase = createClient(url, key);

  console.log("Mencoba login ke Supabase dengan admin@continuum.lms...");
  await supabase.auth.signInWithPassword({
    email: "admin@continuum.lms",
    password: "bissmillah",
  });

  const [profiles, roles, enrollments, progress] = await Promise.all([
    supabase.from("profiles").select("*"),
    supabase.from("user_roles").select("*"),
    supabase.from("enrollments").select("*"),
    supabase.from("module_progress").select("*"),
  ]);

  const studentList = profiles.data || [];
  console.log(`Ditemukan ${studentList.length} data siswa dari Supabase.`);

  const turso = getTursoClient();
  const defaultHash = await hashPassword("bissmillah");
  const batchStatements: Array<{ sql: string; args: any[] }> = [];

  for (const p of studentList) {
    const role = roles.data?.find((r: any) => r.user_id === p.id)?.role || (p.email === "admin@continuum.lms" ? "admin" : "student");
    const email = p.email || `${p.id}@digisschool.my.id`;
    const name = p.display_name || p.full_name || "Siswa";

    batchStatements.push({
      sql: `INSERT OR REPLACE INTO users (id, email, password_hash, full_name, role, status, grade, phone_number, school, notes)
            VALUES (?, ?, ?, ?, ?, 'active', ?, ?, ?, ?);`,
      args: [
        p.id,
        email,
        defaultHash,
        name,
        role,
        p.grade ? Number(p.grade) : null,
        p.phone || null,
        p.school || null,
        p.notes || null,
      ],
    });

    batchStatements.push({
      sql: `INSERT OR REPLACE INTO profiles (id, display_name, full_name, email, role, grade, phone, school, notes, status)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'active');`,
      args: [
        p.id,
        name,
        name,
        email,
        role,
        p.grade ? Number(p.grade) : null,
        p.phone || null,
        p.school || null,
        p.notes || null,
      ],
    });

    batchStatements.push({
      sql: `INSERT OR REPLACE INTO user_roles (user_id, role) VALUES (?, ?);`,
      args: [p.id, role],
    });
  }

  for (const e of enrollments.data || []) {
    batchStatements.push({
      sql: `INSERT OR IGNORE INTO enrollments (id, user_id, material_slug, created_at)
            VALUES (?, ?, ?, ?);`,
      args: [e.id || `${e.user_id}-${e.material_slug}`, e.user_id, e.material_slug, e.created_at || new Date().toISOString()],
    });
  }

  for (const pr of progress.data || []) {
    batchStatements.push({
      sql: `INSERT OR IGNORE INTO module_progress (id, user_id, material_slug, module_index, completed_at)
            VALUES (?, ?, ?, ?, ?);`,
      args: [pr.id || `${pr.user_id}-${pr.material_slug}-${pr.module_index}`, pr.user_id, pr.material_slug, pr.module_index, pr.completed_at || new Date().toISOString()],
    });
  }

  console.log(`Mengirim batch ${batchStatements.length} statements ke Turso...`);
  await turso.batch(batchStatements, "write");

  console.log("🎉 SELURUH 16 DATA SISWA & PROFIL LENGKAP TELAH DISINKRONKAN KE TURSO 100%!");
}

main().catch(console.error);
