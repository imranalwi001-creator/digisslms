import { createClient } from "@libsql/client";
import * as fs from "node:fs";
import * as path from "node:path";

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

const client = createClient({
  url: process.env.TURSO_DATABASE_URL!,
  authToken: process.env.TURSO_AUTH_TOKEN!,
});

async function inspect() {
  const tables = await client.execute("SELECT name FROM sqlite_master WHERE type='table' ORDER BY name;");
  console.log("=== DAFTAR TABEL DI TURSO ===");
  for (const t of tables.rows) {
    const tableName = String(t.name);
    if (tableName.startsWith("_")) continue;
    const countRes = await client.execute(`SELECT COUNT(*) as total FROM "${tableName}";`);
    console.log(`- ${tableName} (Jumlah baris data: ${countRes.rows[0].total})`);
  }
}

inspect();
