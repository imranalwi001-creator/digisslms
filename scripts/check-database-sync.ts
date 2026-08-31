import { createClient } from "@supabase/supabase-js";
import { getTursoClient } from "../src/lib/turso";
import * as fs from "node:fs";
import * as path from "node:path";

// Load .env
const envPath = path.resolve(process.cwd(), ".env");
if (fs.existsSync(envPath)) {
  const content = fs.readFileSync(envPath, "utf-8");
  for (const line of content.split("\n")) {
    const trimmed = line.trim();
    if (trimmed && !trimmed.startsWith("#") && trimmed.includes("=")) {
      const idx = trimmed.indexOf("=");
      const key = trimmed.slice(0, idx).trim();
      let val = trimmed.slice(idx + 1).trim();
      if (val.startsWith('"') && val.endsWith('"')) val = val.slice(1, -1);
      process.env[key] = val;
    }
  }
}

async function checkBothDatabases() {
  console.log("=== MEMERIKSA SUPABASE ===");
  const supabase = createClient(
    process.env.SUPABASE_URL || "https://sutvsbkrsfwrqpmslqpq.supabase.co",
    process.env.SUPABASE_PUBLISHABLE_KEY || "sb_publishable_AETzNUCgAkvAOlGxoeMe0A_nG8hac1R"
  );

  const [sbProfiles, sbRoles, sbEnrollments, sbProgress] = await Promise.all([
    supabase.from("profiles").select("*"),
    supabase.from("user_roles").select("*"),
    supabase.from("enrollments").select("*"),
    supabase.from("module_progress").select("*"),
  ]);

  console.log(`Supabase Profiles count: ${sbProfiles.data?.length || 0}`);
  if (sbProfiles.data && sbProfiles.data.length > 0) {
    console.log("Contoh data profile di Supabase:", sbProfiles.data.slice(0, 5));
  }
  console.log(`Supabase User Roles count: ${sbRoles.data?.length || 0}`);
  console.log(`Supabase Enrollments count: ${sbEnrollments.data?.length || 0}`);
  console.log(`Supabase Progress count: ${sbProgress.data?.length || 0}`);

  console.log("\n=== MEMERIKSA TURSO ===");
  const turso = getTursoClient();
  const [tUsers, tProfiles, tRoles, tEnrollments, tProgress] = await Promise.all([
    turso.execute("SELECT * FROM users;").catch((e) => ({ rows: [] })),
    turso.execute("SELECT * FROM profiles;").catch((e) => ({ rows: [] })),
    turso.execute("SELECT * FROM user_roles;").catch((e) => ({ rows: [] })),
    turso.execute("SELECT * FROM enrollments;").catch((e) => ({ rows: [] })),
    turso.execute("SELECT * FROM module_progress;").catch((e) => ({ rows: [] })),
  ]);

  console.log(`Turso Users count: ${tUsers.rows.length}`);
  console.log(`Turso Profiles count: ${tProfiles.rows.length}`);
  if (tProfiles.rows.length > 0) {
    console.log("Data profiles di Turso:", tProfiles.rows);
  }
  console.log(`Turso User Roles count: ${tRoles.rows.length}`);
  console.log(`Turso Enrollments count: ${tEnrollments.rows.length}`);
  console.log(`Turso Progress count: ${tProgress.rows.length}`);
}

checkBothDatabases().catch(console.error);
