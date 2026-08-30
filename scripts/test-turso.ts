import { createClient } from "@libsql/client";
import * as fs from "node:fs";
import * as path from "node:path";

// Read .env file directly
const envPath = path.resolve(process.cwd(), ".env");
if (fs.existsSync(envPath)) {
  const content = fs.readFileSync(envPath, "utf-8");
  for (const line of content.split("\n")) {
    const trimmed = line.trim();
    if (trimmed && !trimmed.startsWith("#") && trimmed.includes("=")) {
      const idx = trimmed.indexOf("=");
      const key = trimmed.slice(0, idx).trim();
      let val = trimmed.slice(idx + 1).trim();
      if (val.startsWith('"') && val.endsWith('"')) {
        val = val.slice(1, -1);
      }
      process.env[key] = val;
    }
  }
}

const url = process.env.TURSO_DATABASE_URL;
const authToken = process.env.TURSO_AUTH_TOKEN;

console.log("Connecting to Turso Database:", url);

const client = createClient({
  url: url!,
  authToken: authToken!,
});

async function main() {
  try {
    const res = await client.execute("SELECT 1 as test, 'connected' as status;");
    console.log("✅ Turso connection successful!", res.rows);

    // Initialize Schema
    console.log("📦 Creating LMS tables in Turso...");
    await client.batch([
      `CREATE TABLE IF NOT EXISTS materials (
        id TEXT PRIMARY KEY,
        slug TEXT UNIQUE NOT NULL,
        title TEXT NOT NULL,
        subject TEXT NOT NULL,
        grade INTEGER NOT NULL,
        semester INTEGER DEFAULT 1,
        element TEXT,
        description TEXT,
        image_url TEXT,
        duration TEXT,
        module_list TEXT,
        is_published INTEGER DEFAULT 1,
        is_custom INTEGER DEFAULT 0,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );`,
      `CREATE TABLE IF NOT EXISTS enrollments (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL,
        material_slug TEXT NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(user_id, material_slug)
      );`,
      `CREATE TABLE IF NOT EXISTS module_progress (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL,
        material_slug TEXT NOT NULL,
        module_index INTEGER NOT NULL,
        completed_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(user_id, material_slug, module_index)
      );`,
      `CREATE TABLE IF NOT EXISTS quizzes (
        id TEXT PRIMARY KEY,
        material_slug TEXT NOT NULL,
        title TEXT NOT NULL,
        passing_score INTEGER DEFAULT 70,
        time_limit_minutes INTEGER,
        is_published INTEGER DEFAULT 1,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );`,
      `CREATE TABLE IF NOT EXISTS quiz_attempts (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL,
        quiz_id TEXT NOT NULL,
        score INTEGER NOT NULL,
        is_passed INTEGER NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );`,
      `CREATE TABLE IF NOT EXISTS assignments (
        id TEXT PRIMARY KEY,
        material_slug TEXT NOT NULL,
        title TEXT NOT NULL,
        description TEXT,
        max_score INTEGER DEFAULT 100,
        due_date DATETIME,
        is_published INTEGER DEFAULT 1,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );`,
      `CREATE TABLE IF NOT EXISTS assignment_submissions (
        id TEXT PRIMARY KEY,
        assignment_id TEXT NOT NULL,
        user_id TEXT NOT NULL,
        answer_text TEXT NOT NULL,
        score INTEGER,
        feedback TEXT,
        submitted_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(assignment_id, user_id)
      );`,
      `CREATE TABLE IF NOT EXISTS certificates (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL,
        material_slug TEXT NOT NULL,
        certificate_number TEXT UNIQUE NOT NULL,
        metadata TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );`,
      `CREATE TABLE IF NOT EXISTS student_notes (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL,
        material_slug TEXT NOT NULL,
        module_index INTEGER NOT NULL,
        module_name TEXT NOT NULL,
        note_text TEXT NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );`,
      `CREATE TABLE IF NOT EXISTS course_qa (
        id TEXT PRIMARY KEY,
        material_slug TEXT NOT NULL,
        user_id TEXT NOT NULL,
        author_name TEXT NOT NULL,
        author_avatar TEXT,
        question TEXT NOT NULL,
        replies TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );`
    ], "write");

    const tables = await client.execute("SELECT name FROM sqlite_master WHERE type='table';");
    console.log("✅ All tables created successfully:", tables.rows.map(r => r.name));
  } catch (error) {
    console.error("❌ Turso connection/schema error:", error);
    process.exit(1);
  }
}

main();
