import { getTursoClient } from "../src/lib/turso";

async function main() {
  const db = getTursoClient();
  const users = await db.execute("SELECT id, email, full_name, role, status FROM users;");
  console.log("=== USERS IN TURSO ===");
  console.log(users.rows);

  const profiles = await db.execute("SELECT id, email, full_name, display_name, role, status FROM profiles;");
  console.log("=== PROFILES IN TURSO ===");
  console.log(profiles.rows);
}

main().catch(console.error);
