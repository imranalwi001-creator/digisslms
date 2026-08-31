import { getTursoClient } from "../src/lib/turso";

async function main() {
  const db = getTursoClient();
  const profileCols = [
    { name: "display_name", type: "TEXT" },
    { name: "phone", type: "TEXT" },
    { name: "school", type: "TEXT" },
    { name: "notes", type: "TEXT" },
    { name: "status", type: "TEXT DEFAULT 'active'" },
  ];

  for (const col of profileCols) {
    try {
      await db.execute(`ALTER TABLE profiles ADD COLUMN ${col.name} ${col.type};`);
      console.log(`✅ Added column ${col.name} to profiles`);
    } catch (e: any) {
      // Column already exists or duplicate
    }
  }

  const userCols = [
    { name: "school", type: "TEXT" },
    { name: "notes", type: "TEXT" },
    { name: "grade", type: "INTEGER" },
  ];

  for (const col of userCols) {
    try {
      await db.execute(`ALTER TABLE users ADD COLUMN ${col.name} ${col.type};`);
      console.log(`✅ Added column ${col.name} to users`);
    } catch (e: any) {
      // Column already exists or duplicate
    }
  }

  // Ensure user_roles table exists
  await db.execute(`CREATE TABLE IF NOT EXISTS user_roles (
    user_id TEXT NOT NULL,
    role TEXT NOT NULL,
    PRIMARY KEY(user_id, role)
  );`);

  // Ensure admin user exists with password_hash
  const adminId = "admin-root-001";
  const { hashPassword } = await import("../src/lib/turso-auth");
  const hashedPassword = await hashPassword("bissmillah");

  await db.execute({
    sql: `INSERT OR REPLACE INTO users (id, email, password_hash, full_name, role, status)
          VALUES (?, 'admin@continuum.lms', ?, 'Administrator', 'admin', 'active');`,
    args: [adminId, hashedPassword],
  });

  await db.execute({
    sql: `INSERT OR REPLACE INTO user_roles (user_id, role)
          VALUES (?, 'admin');`,
    args: [adminId],
  });

  await db.execute({
    sql: `INSERT OR REPLACE INTO profiles (id, full_name, display_name, email, role, status)
          VALUES (?, 'Administrator', 'Administrator', 'admin@continuum.lms', 'admin', 'active');`,
    args: [adminId],
  });

  console.log("🎉 Turso schema migration and admin bootstrap completed successfully!");
}

main().catch(console.error);
