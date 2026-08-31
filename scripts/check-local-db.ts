import { createClient } from "@libsql/client";

async function main() {
  try {
    const local = createClient({ url: "file:local.db" });
    const tables = await local.execute("SELECT name FROM sqlite_master WHERE type='table';");
    console.log("=== LOCAL.DB TABLES ===");
    console.log(tables.rows.map((r) => r.name));

    for (const t of tables.rows) {
      const name = String(t.name);
      if (["profiles", "users", "user_roles", "enrollments", "module_progress"].includes(name)) {
        const rows = await local.execute(`SELECT * FROM "${name}";`);
        console.log(`local.db ${name} count: ${rows.rows.length}`);
        if (rows.rows.length > 0) {
          console.log(`Sample from ${name}:`, rows.rows);
        }
      }
    }
  } catch (e) {
    console.error("local.db error:", e);
  }
}

main().catch(console.error);
