import { getTursoClient } from "./turso";

export interface TursoMaterial {
  id: string;
  slug: string;
  title: string;
  subject: string;
  grade: number;
  semester: number;
  element: string | null;
  description: string | null;
  image_url: string | null;
  duration: string;
  module_list: string[];
  is_published: number;
  is_custom: number;
  created_at?: string;
}

export interface TursoEnrollment {
  id: string;
  user_id: string;
  material_slug: string;
  created_at: string;
}

export interface TursoModuleProgress {
  id: string;
  user_id: string;
  material_slug: string;
  module_index: number;
  completed_at: string;
}

export interface TursoNote {
  id: string;
  user_id: string;
  material_slug: string;
  module_index: number;
  module_name: string;
  note_text: string;
  created_at: string;
}

export interface TursoQA {
  id: string;
  material_slug: string;
  user_id: string;
  author_name: string;
  author_avatar?: string | null;
  question: string;
  replies?: Array<{
    id: string;
    author: string;
    avatar?: string;
    role?: string;
    text: string;
    time: string;
  }>;
  created_at: string;
}

export interface TursoCertificate {
  id: string;
  user_id: string;
  material_slug: string;
  certificate_number: string;
  metadata?: any;
  created_at: string;
}

export const TursoRepository = {
  // ==========================================
  // MATERIALS
  // ==========================================
  async getMaterials(): Promise<TursoMaterial[]> {
    const db = getTursoClient();
    const res = await db.execute("SELECT * FROM materials ORDER BY grade ASC, title ASC;");
    return res.rows.map((r) => ({
      id: String(r.id),
      slug: String(r.slug),
      title: String(r.title),
      subject: String(r.subject),
      grade: Number(r.grade),
      semester: Number(r.semester || 1),
      element: r.element ? String(r.element) : null,
      description: r.description ? String(r.description) : null,
      image_url: r.image_url ? String(r.image_url) : null,
      duration: String(r.duration || "4 jam"),
      module_list: r.module_list ? JSON.parse(String(r.module_list)) : [],
      is_published: Number(r.is_published ?? 1),
      is_custom: Number(r.is_custom ?? 0),
      created_at: String(r.created_at || ""),
    }));
  },

  async getMaterialBySlug(slug: string): Promise<TursoMaterial | null> {
    const db = getTursoClient();
    const res = await db.execute({
      sql: "SELECT * FROM materials WHERE slug = ? LIMIT 1;",
      args: [slug],
    });
    if (res.rows.length === 0) return null;
    const r = res.rows[0];
    return {
      id: String(r.id),
      slug: String(r.slug),
      title: String(r.title),
      subject: String(r.subject),
      grade: Number(r.grade),
      semester: Number(r.semester || 1),
      element: r.element ? String(r.element) : null,
      description: r.description ? String(r.description) : null,
      image_url: r.image_url ? String(r.image_url) : null,
      duration: String(r.duration || "4 jam"),
      module_list: r.module_list ? JSON.parse(String(r.module_list)) : [],
      is_published: Number(r.is_published ?? 1),
      is_custom: Number(r.is_custom ?? 0),
      created_at: String(r.created_at || ""),
    };
  },

  // ==========================================
  // ENROLLMENTS
  // ==========================================
  async getEnrollments(userId: string): Promise<TursoEnrollment[]> {
    const db = getTursoClient();
    const res = await db.execute({
      sql: "SELECT * FROM enrollments WHERE user_id = ? ORDER BY created_at DESC;",
      args: [userId],
    });
    return res.rows.map((r) => ({
      id: String(r.id),
      user_id: String(r.user_id),
      material_slug: String(r.material_slug),
      created_at: String(r.created_at),
    }));
  },

  async enrollCourse(userId: string, materialSlug: string): Promise<void> {
    const db = getTursoClient();
    const id = `enr-${userId}-${materialSlug}`;
    await db.execute({
      sql: `INSERT OR IGNORE INTO enrollments (id, user_id, material_slug) VALUES (?, ?, ?);`,
      args: [id, userId, materialSlug],
    });
  },

  async unenrollCourse(userId: string, materialSlug: string): Promise<void> {
    const db = getTursoClient();
    await db.execute({
      sql: `DELETE FROM enrollments WHERE user_id = ? AND material_slug = ?;`,
      args: [userId, materialSlug],
    });
  },

  // ==========================================
  // MODULE PROGRESS
  // ==========================================
  async getModuleProgress(userId: string): Promise<TursoModuleProgress[]> {
    const db = getTursoClient();
    const res = await db.execute({
      sql: "SELECT * FROM module_progress WHERE user_id = ? ORDER BY completed_at ASC;",
      args: [userId],
    });
    return res.rows.map((r) => ({
      id: String(r.id),
      user_id: String(r.user_id),
      material_slug: String(r.material_slug),
      module_index: Number(r.module_index),
      completed_at: String(r.completed_at),
    }));
  },

  async toggleModuleProgress(userId: string, materialSlug: string, moduleIndex: number, done: boolean): Promise<void> {
    const db = getTursoClient();
    if (done) {
      const id = `prog-${userId}-${materialSlug}-${moduleIndex}`;
      await db.execute({
        sql: `INSERT OR REPLACE INTO module_progress (id, user_id, material_slug, module_index, completed_at)
              VALUES (?, ?, ?, ?, CURRENT_TIMESTAMP);`,
        args: [id, userId, materialSlug, moduleIndex],
      });
    } else {
      await db.execute({
        sql: `DELETE FROM module_progress WHERE user_id = ? AND material_slug = ? AND module_index = ?;`,
        args: [userId, materialSlug, moduleIndex],
      });
    }
  },

  // ==========================================
  // STUDENT NOTES (Timestamped)
  // ==========================================
  async getStudentNotes(userId: string, materialSlug: string): Promise<TursoNote[]> {
    const db = getTursoClient();
    const res = await db.execute({
      sql: "SELECT * FROM student_notes WHERE user_id = ? AND material_slug = ? ORDER BY created_at DESC;",
      args: [userId, materialSlug],
    });
    return res.rows.map((r) => ({
      id: String(r.id),
      user_id: String(r.user_id),
      material_slug: String(r.material_slug),
      module_index: Number(r.module_index),
      module_name: String(r.module_name),
      note_text: String(r.note_text),
      created_at: String(r.created_at),
    }));
  },

  async saveStudentNote(note: Omit<TursoNote, "id" | "created_at">): Promise<TursoNote> {
    const db = getTursoClient();
    const id = `note-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`;
    await db.execute({
      sql: `INSERT INTO student_notes (id, user_id, material_slug, module_index, module_name, note_text)
            VALUES (?, ?, ?, ?, ?, ?);`,
      args: [id, note.user_id, note.material_slug, note.module_index, note.module_name, note.note_text],
    });
    return {
      id,
      ...note,
      created_at: new Date().toISOString(),
    };
  },

  async deleteStudentNote(id: string, userId: string): Promise<void> {
    const db = getTursoClient();
    await db.execute({
      sql: "DELETE FROM student_notes WHERE id = ? AND user_id = ?;",
      args: [id, userId],
    });
  },

  // ==========================================
  // Q&A DISCUSSION FORUM
  // ==========================================
  async getCourseQA(materialSlug: string): Promise<TursoQA[]> {
    const db = getTursoClient();
    const res = await db.execute({
      sql: "SELECT * FROM course_qa WHERE material_slug = ? ORDER BY created_at DESC;",
      args: [materialSlug],
    });
    return res.rows.map((r) => ({
      id: String(r.id),
      material_slug: String(r.material_slug),
      user_id: String(r.user_id),
      author_name: String(r.author_name),
      author_avatar: r.author_avatar ? String(r.author_avatar) : null,
      question: String(r.question),
      replies: r.replies ? JSON.parse(String(r.replies)) : [],
      created_at: String(r.created_at),
    }));
  },

  async postQuestion(qa: Omit<TursoQA, "id" | "created_at" | "replies">): Promise<TursoQA> {
    const db = getTursoClient();
    const id = `qa-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`;
    await db.execute({
      sql: `INSERT INTO course_qa (id, material_slug, user_id, author_name, author_avatar, question, replies)
            VALUES (?, ?, ?, ?, ?, ?, ?);`,
      args: [id, qa.material_slug, qa.user_id, qa.author_name, qa.author_avatar || null, qa.question, "[]"],
    });
    return {
      id,
      ...qa,
      replies: [],
      created_at: new Date().toISOString(),
    };
  },

  async postAnswer(questionId: string, reply: { author: string; avatar?: string; role?: string; text: string }): Promise<void> {
    const db = getTursoClient();
    const res = await db.execute({
      sql: "SELECT replies FROM course_qa WHERE id = ? LIMIT 1;",
      args: [questionId],
    });
    if (res.rows.length === 0) return;
    const currentReplies = res.rows[0].replies ? JSON.parse(String(res.rows[0].replies)) : [];
    const newReply = {
      id: `rep-${Date.now()}`,
      ...reply,
      time: "Baru saja",
    };
    currentReplies.push(newReply);
    await db.execute({
      sql: "UPDATE course_qa SET replies = ? WHERE id = ?;",
      args: [JSON.stringify(currentReplies), questionId],
    });
  },

  // ==========================================
  // CERTIFICATES
  // ==========================================
  async getCertificates(userId: string): Promise<TursoCertificate[]> {
    const db = getTursoClient();
    const res = await db.execute({
      sql: "SELECT * FROM certificates WHERE user_id = ? ORDER BY created_at DESC;",
      args: [userId],
    });
    return res.rows.map((r) => ({
      id: String(r.id),
      user_id: String(r.user_id),
      material_slug: String(r.material_slug),
      certificate_number: String(r.certificate_number),
      metadata: r.metadata ? JSON.parse(String(r.metadata)) : null,
      created_at: String(r.created_at),
    }));
  },

  async issueCertificate(userId: string, materialSlug: string, courseTitle: string, studentName: string): Promise<TursoCertificate> {
    const db = getTursoClient();
    const certNumber = `CERT-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).substr(2, 4).toUpperCase()}`;
    const id = `cert-${userId}-${materialSlug}`;
    const metadata = {
      courseTitle,
      studentName,
      issuedDate: new Date().toLocaleDateString("id-ID"),
    };

    await db.execute({
      sql: `INSERT OR REPLACE INTO certificates (id, user_id, material_slug, certificate_number, metadata)
            VALUES (?, ?, ?, ?, ?);`,
      args: [id, userId, materialSlug, certNumber, JSON.stringify(metadata)],
    });

    return {
      id,
      user_id: userId,
      material_slug: materialSlug,
      certificate_number: certNumber,
      metadata,
      created_at: new Date().toISOString(),
    };
  }
};
