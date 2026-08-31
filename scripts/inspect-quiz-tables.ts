import { getTursoClient } from "../src/lib/turso";

async function main() {
  const db = getTursoClient();
  const tables = ["quiz_attempts", "module_progress", "enrollments", "certificates", "assignment_submissions"];
  for (const t of tables) {
    try {
      const info = await db.execute(`PRAGMA table_info(${t});`);
      console.log(`Table ${t} columns:`, info.rows.map((r) => `${r.name} (${r.type})`));
    } catch (e: any) {
      console.log(`Table ${t} error:`, e.message);
    }
  }
}

main().catch(console.error);
