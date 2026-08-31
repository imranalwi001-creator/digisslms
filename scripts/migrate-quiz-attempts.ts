import { getTursoClient } from "../src/lib/turso";

async function main() {
  const db = getTursoClient();
  try {
    const res = await db.execute("PRAGMA table_info(quiz_attempts);");
    console.log("quiz_attempts columns:", res.rows.map((r) => `${r.name} (${r.type})`));
  } catch (e: any) {
    console.log("quiz_attempts error:", e.message);
  }

  // Ensure passed column exists in quiz_attempts
  try {
    await db.execute("ALTER TABLE quiz_attempts ADD COLUMN passed INTEGER DEFAULT 0;");
    console.log("Added passed to quiz_attempts");
  } catch {}

  // Ensure score column exists in quiz_attempts
  try {
    await db.execute("ALTER TABLE quiz_attempts ADD COLUMN score INTEGER DEFAULT 0;");
    console.log("Added score to quiz_attempts");
  } catch {}
}

main().catch(console.error);
