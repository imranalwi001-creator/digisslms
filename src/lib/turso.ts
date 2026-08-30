import { createClient, type Client } from "@libsql/client";

let tursoClient: Client | null = null;

export function getTursoClient(): Client {
  if (tursoClient) return tursoClient;

  let url =
    process.env.TURSO_DATABASE_URL ||
    (typeof import.meta !== "undefined" && (import.meta as any).env?.VITE_TURSO_DATABASE_URL) ||
    "";

  let authToken =
    process.env.TURSO_AUTH_TOKEN ||
    (typeof import.meta !== "undefined" && (import.meta as any).env?.VITE_TURSO_AUTH_TOKEN) ||
    "";

  // Fallback to reading .env in Node environment if process.env is empty
  if (!url && typeof process !== "undefined" && process.cwd) {
    try {
      const fs = require("node:fs");
      const path = require("node:path");
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
            if (key === "TURSO_DATABASE_URL") url = val;
            if (key === "TURSO_AUTH_TOKEN") authToken = val;
          }
        }
      }
    } catch {
      // ignore
    }
  }

  const DEFAULT_TURSO_URL = "libsql://lms-imranalwi001-creator.aws-ap-northeast-1.turso.io";
  const DEFAULT_TURSO_TOKEN = "eyJhbGciOiJFZERTQSIsInR5cCI6IkpXVCJ9.eyJhIjoicnciLCJpYXQiOjE3ODgwNjcyOTksImlkIjoiMDFhMDUxMWQtNTQwMS03MDY2LTg1NDAtNGI1MzFkNGE0MGIwIiwia2lkIjoibkdMTmRjb3ZnUGJJc0YzM0J3cUhtOTh0SDZXTE1XSGJiVVdxYUpjajl5ayIsInJpZCI6ImY2YWU2OTg2LTJmN2EtNDE4Zi1iNWMxLTUyZmI3ODBlZTJjMSJ9.NuLDyOSsdlR2drZ6s7mnyAywhTYQpMLWqv192ihkn1qWXs2s6RYyXCCw2siy1hpFt4h7coBwJVJQBFdipxz7DQ";

  tursoClient = createClient({
    url: url || DEFAULT_TURSO_URL,
    authToken: authToken || DEFAULT_TURSO_TOKEN,
  });

  return tursoClient;
}

/**
 * Initialize all standard LMS tables in Turso if they don't exist yet.
 */
export async function initTursoSchema() {
  const db = getTursoClient();

  await db.batch([
    // Materials table
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

    // Enrollments
    `CREATE TABLE IF NOT EXISTS enrollments (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      material_slug TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(user_id, material_slug)
    );`,

    // Module Progress
    `CREATE TABLE IF NOT EXISTS module_progress (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      material_slug TEXT NOT NULL,
      module_index INTEGER NOT NULL,
      completed_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(user_id, material_slug, module_index)
    );`,

    // Quizzes
    `CREATE TABLE IF NOT EXISTS quizzes (
      id TEXT PRIMARY KEY,
      material_slug TEXT NOT NULL,
      title TEXT NOT NULL,
      passing_score INTEGER DEFAULT 70,
      time_limit_minutes INTEGER,
      is_published INTEGER DEFAULT 1,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );`,

    // Quiz Attempts
    `CREATE TABLE IF NOT EXISTS quiz_attempts (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      quiz_id TEXT NOT NULL,
      score INTEGER NOT NULL,
      is_passed INTEGER NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );`,

    // Assignments
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

    // Assignment Submissions
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

    // Certificates
    `CREATE TABLE IF NOT EXISTS certificates (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      material_slug TEXT NOT NULL,
      certificate_number TEXT UNIQUE NOT NULL,
      metadata TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );`,

    // Student Notes
    `CREATE TABLE IF NOT EXISTS student_notes (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      material_slug TEXT NOT NULL,
      module_index INTEGER NOT NULL,
      module_name TEXT NOT NULL,
      note_text TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );`,

    // Q&A Forum
    `CREATE TABLE IF NOT EXISTS course_qa (
      id TEXT PRIMARY KEY,
      material_slug TEXT NOT NULL,
      user_id TEXT NOT NULL,
      author_name TEXT NOT NULL,
      author_avatar TEXT,
      question TEXT NOT NULL,
      replies TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );`,

    // Course Contents (Cross-Device Cloud Multimedia & Attachments)
    `CREATE TABLE IF NOT EXISTS course_contents (
      id TEXT PRIMARY KEY,
      material_slug TEXT NOT NULL,
      module_index INTEGER NOT NULL DEFAULT 0,
      type TEXT NOT NULL,
      title TEXT NOT NULL,
      description TEXT,
      url TEXT NOT NULL,
      file_size TEXT,
      duration TEXT,
      is_downloadable INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );`
  ], "write");

  return { success: true, message: "Turso database schema initialized successfully" };
}
