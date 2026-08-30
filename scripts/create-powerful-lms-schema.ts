import { createClient } from "@libsql/client";
import * as fs from "node:fs";
import * as path from "node:path";

// Load .env
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

export const POWERFUL_LMS_TABLES = [
  // ==========================================
  // 1. USER & IDENTITY & ACCESS CONTROL
  // ==========================================
  `CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    email TEXT UNIQUE NOT NULL,
    password_hash TEXT,
    full_name TEXT NOT NULL,
    role TEXT CHECK(role IN ('admin', 'instructor', 'guru', 'student', 'siswa', 'parent')) DEFAULT 'student',
    status TEXT CHECK(status IN ('active', 'suspended', 'pending')) DEFAULT 'active',
    avatar_url TEXT,
    phone_number TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );`,

  `CREATE TABLE IF NOT EXISTS user_profiles (
    user_id TEXT PRIMARY KEY,
    headline TEXT,
    bio TEXT,
    grade INTEGER,
    school_name TEXT,
    nisn TEXT,
    website_url TEXT,
    social_links TEXT, -- JSON
    preferences TEXT, -- JSON (theme, notifications, language)
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE
  );`,

  // ==========================================
  // 2. COURSE CATEGORIES & CURRICULUM
  // ==========================================
  `CREATE TABLE IF NOT EXISTS course_categories (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    slug TEXT UNIQUE NOT NULL,
    icon TEXT,
    description TEXT,
    sort_order INTEGER DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );`,

  `CREATE TABLE IF NOT EXISTS courses (
    id TEXT PRIMARY KEY,
    category_id TEXT,
    instructor_id TEXT,
    slug TEXT UNIQUE NOT NULL,
    title TEXT NOT NULL,
    subtitle TEXT,
    description TEXT,
    subject TEXT NOT NULL,
    grade INTEGER NOT NULL,
    semester INTEGER DEFAULT 1,
    difficulty_level TEXT CHECK(difficulty_level IN ('beginner', 'intermediate', 'advanced')) DEFAULT 'beginner',
    thumbnail_url TEXT,
    promo_video_url TEXT,
    estimated_hours REAL DEFAULT 0,
    price REAL DEFAULT 0,
    is_published INTEGER DEFAULT 1,
    is_featured INTEGER DEFAULT 0,
    published_at DATETIME,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(category_id) REFERENCES course_categories(id),
    FOREIGN KEY(instructor_id) REFERENCES users(id)
  );`,

  `CREATE TABLE IF NOT EXISTS course_sections (
    id TEXT PRIMARY KEY,
    course_id TEXT NOT NULL,
    title TEXT NOT NULL,
    description TEXT,
    sort_order INTEGER DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(course_id) REFERENCES courses(id) ON DELETE CASCADE
  );`,

  `CREATE TABLE IF NOT EXISTS course_lessons (
    id TEXT PRIMARY KEY,
    section_id TEXT NOT NULL,
    title TEXT NOT NULL,
    slug TEXT NOT NULL,
    lesson_type TEXT CHECK(lesson_type IN ('video', 'article', 'interactive', 'quiz', 'assignment')) DEFAULT 'video',
    content_text TEXT,
    video_url TEXT,
    duration_seconds INTEGER DEFAULT 0,
    is_preview INTEGER DEFAULT 0,
    sort_order INTEGER DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(section_id) REFERENCES course_sections(id) ON DELETE CASCADE
  );`,

  `CREATE TABLE IF NOT EXISTS course_resources (
    id TEXT PRIMARY KEY,
    course_id TEXT NOT NULL,
    lesson_id TEXT,
    title TEXT NOT NULL,
    file_url TEXT NOT NULL,
    file_type TEXT,
    file_size_kb INTEGER,
    download_count INTEGER DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(course_id) REFERENCES courses(id) ON DELETE CASCADE
  );`,

  // ==========================================
  // 3. LEARNING PROGRESS & GAMIFICATION
  // ==========================================
  `CREATE TABLE IF NOT EXISTS course_enrollments (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    course_id TEXT NOT NULL,
    status TEXT CHECK(status IN ('active', 'completed', 'dropped')) DEFAULT 'active',
    progress_percent REAL DEFAULT 0,
    enrolled_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    completed_at DATETIME,
    UNIQUE(user_id, course_id),
    FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY(course_id) REFERENCES courses(id) ON DELETE CASCADE
  );`,

  `CREATE TABLE IF NOT EXISTS lesson_progress (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    lesson_id TEXT NOT NULL,
    is_completed INTEGER DEFAULT 0,
    last_position_seconds INTEGER DEFAULT 0,
    watch_time_seconds INTEGER DEFAULT 0,
    completed_at DATETIME,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, lesson_id),
    FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY(lesson_id) REFERENCES course_lessons(id) ON DELETE CASCADE
  );`,

  `CREATE TABLE IF NOT EXISTS learning_streaks (
    user_id TEXT PRIMARY KEY,
    current_streak_days INTEGER DEFAULT 0,
    longest_streak_days INTEGER DEFAULT 0,
    total_xp_points INTEGER DEFAULT 0,
    last_activity_date TEXT,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE
  );`,

  `CREATE TABLE IF NOT EXISTS gamification_badges (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    code TEXT UNIQUE NOT NULL,
    description TEXT,
    icon_url TEXT,
    points_reward INTEGER DEFAULT 50,
    criteria_type TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );`,

  `CREATE TABLE IF NOT EXISTS user_badges (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    badge_id TEXT NOT NULL,
    earned_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, badge_id),
    FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY(badge_id) REFERENCES gamification_badges(id) ON DELETE CASCADE
  );`,

  // ==========================================
  // 4. ADVANCED QUIZZES & QUESTION BANK
  // ==========================================
  `CREATE TABLE IF NOT EXISTS quiz_banks (
    id TEXT PRIMARY KEY,
    course_id TEXT,
    title TEXT NOT NULL,
    description TEXT,
    passing_score INTEGER DEFAULT 70,
    time_limit_minutes INTEGER DEFAULT 30,
    shuffle_questions INTEGER DEFAULT 1,
    max_attempts INTEGER DEFAULT 3,
    is_published INTEGER DEFAULT 1,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );`,

  `CREATE TABLE IF NOT EXISTS quiz_questions (
    id TEXT PRIMARY KEY,
    quiz_id TEXT NOT NULL,
    question_text TEXT NOT NULL,
    question_type TEXT CHECK(question_type IN ('single_choice', 'multiple_choice', 'true_false', 'short_essay')) DEFAULT 'single_choice',
    explanation TEXT,
    points INTEGER DEFAULT 10,
    sort_order INTEGER DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(quiz_id) REFERENCES quiz_banks(id) ON DELETE CASCADE
  );`,

  `CREATE TABLE IF NOT EXISTS quiz_question_options (
    id TEXT PRIMARY KEY,
    question_id TEXT NOT NULL,
    option_text TEXT NOT NULL,
    is_correct INTEGER DEFAULT 0,
    sort_order INTEGER DEFAULT 0,
    FOREIGN KEY(question_id) REFERENCES quiz_questions(id) ON DELETE CASCADE
  );`,

  `CREATE TABLE IF NOT EXISTS quiz_attempt_records (
    id TEXT PRIMARY KEY,
    quiz_id TEXT NOT NULL,
    user_id TEXT NOT NULL,
    attempt_number INTEGER DEFAULT 1,
    total_score REAL DEFAULT 0,
    percent_score REAL DEFAULT 0,
    is_passed INTEGER DEFAULT 0,
    time_spent_seconds INTEGER DEFAULT 0,
    started_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    completed_at DATETIME,
    FOREIGN KEY(quiz_id) REFERENCES quiz_banks(id) ON DELETE CASCADE,
    FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE
  );`,

  // ==========================================
  // 5. ASSIGNMENTS & RUBRIC GRADING
  // ==========================================
  `CREATE TABLE IF NOT EXISTS assignment_tasks (
    id TEXT PRIMARY KEY,
    course_id TEXT NOT NULL,
    title TEXT NOT NULL,
    instructions TEXT NOT NULL,
    max_score INTEGER DEFAULT 100,
    due_date DATETIME,
    allow_late_submission INTEGER DEFAULT 1,
    attachment_urls TEXT, -- JSON
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );`,

  `CREATE TABLE IF NOT EXISTS student_assignment_submissions (
    id TEXT PRIMARY KEY,
    assignment_id TEXT NOT NULL,
    user_id TEXT NOT NULL,
    submission_text TEXT,
    file_attachment_urls TEXT, -- JSON
    status TEXT CHECK(status IN ('submitted', 'graded', 'returned')) DEFAULT 'submitted',
    score REAL,
    graded_by TEXT,
    feedback TEXT,
    submitted_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    graded_at DATETIME,
    UNIQUE(assignment_id, user_id),
    FOREIGN KEY(assignment_id) REFERENCES assignment_tasks(id) ON DELETE CASCADE,
    FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE
  );`,

  // ==========================================
  // 6. COMMUNITY, Q&A & REVIEWS
  // ==========================================
  `CREATE TABLE IF NOT EXISTS course_reviews (
    id TEXT PRIMARY KEY,
    course_id TEXT NOT NULL,
    user_id TEXT NOT NULL,
    rating INTEGER CHECK(rating BETWEEN 1 AND 5) NOT NULL,
    review_title TEXT,
    review_content TEXT,
    instructor_response TEXT,
    is_featured INTEGER DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(course_id, user_id),
    FOREIGN KEY(course_id) REFERENCES courses(id) ON DELETE CASCADE,
    FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE
  );`,

  `CREATE TABLE IF NOT EXISTS discussion_threads (
    id TEXT PRIMARY KEY,
    course_id TEXT NOT NULL,
    lesson_id TEXT,
    user_id TEXT NOT NULL,
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    upvotes_count INTEGER DEFAULT 0,
    is_resolved INTEGER DEFAULT 0,
    is_pinned INTEGER DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(course_id) REFERENCES courses(id) ON DELETE CASCADE,
    FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE
  );`,

  `CREATE TABLE IF NOT EXISTS discussion_replies (
    id TEXT PRIMARY KEY,
    thread_id TEXT NOT NULL,
    user_id TEXT NOT NULL,
    reply_content TEXT NOT NULL,
    is_endorsed_by_instructor INTEGER DEFAULT 0,
    upvotes_count INTEGER DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(thread_id) REFERENCES discussion_threads(id) ON DELETE CASCADE,
    FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE
  );`,

  // ==========================================
  // 7. CERTIFICATES, LIVE SESSIONS & NOTIFICATIONS
  // ==========================================
  `CREATE TABLE IF NOT EXISTS verified_certificates (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    course_id TEXT NOT NULL,
    certificate_number TEXT UNIQUE NOT NULL,
    recipient_name TEXT NOT NULL,
    course_title TEXT NOT NULL,
    final_grade REAL,
    verification_qr_url TEXT,
    issued_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY(course_id) REFERENCES courses(id) ON DELETE CASCADE
  );`,

  `CREATE TABLE IF NOT EXISTS live_webinars (
    id TEXT PRIMARY KEY,
    course_id TEXT NOT NULL,
    instructor_id TEXT NOT NULL,
    title TEXT NOT NULL,
    description TEXT,
    meeting_url TEXT NOT NULL,
    scheduled_start DATETIME NOT NULL,
    duration_minutes INTEGER DEFAULT 60,
    recording_url TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(course_id) REFERENCES courses(id) ON DELETE CASCADE,
    FOREIGN KEY(instructor_id) REFERENCES users(id)
  );`,

  `CREATE TABLE IF NOT EXISTS user_notifications (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    type TEXT NOT NULL,
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    link_url TEXT,
    is_read INTEGER DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE
  );`
];

async function deployEnterpriseSchema() {
  console.log("🚀 Menerapkan skema enterprise database LMS ke Turso...");
  await client.batch(POWERFUL_LMS_TABLES, "write");

  const tables = await client.execute("SELECT name FROM sqlite_master WHERE type='table' ORDER BY name;");
  console.log(`\n🎉 Berhasil! Total ${tables.rows.length} tabel telah aktif di Turso:`);
  tables.rows.forEach((r, idx) => {
    if (!String(r.name).startsWith("_")) {
      console.log(`  ${idx + 1}. ${r.name}`);
    }
  });
}

deployEnterpriseSchema().catch(console.error);
