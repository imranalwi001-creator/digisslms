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
  const p = await client.execute("PRAGMA table_info(profiles);");
  console.log("profiles columns:", p.rows.map(r => r.name));
  const u = await client.execute("PRAGMA table_info(users);");
  console.log("users columns:", u.rows.map(r => r.name));
  const up = await client.execute("PRAGMA table_info(user_profiles);");
  console.log("user_profiles columns:", up.rows.map(r => r.name));
}

inspect();
