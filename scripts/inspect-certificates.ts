import { getTursoClient } from "../src/lib/turso";

async function main() {
  const db = getTursoClient();
  const c = await db.execute("PRAGMA table_info(certificates);");
  console.log("certificates columns:", c.rows.map((r) => `${r.name} (${r.type})`));
  const sample = await db.execute("SELECT * FROM certificates LIMIT 2;");
  console.log("certificates sample:", sample.rows);
}

main().catch(console.error);
