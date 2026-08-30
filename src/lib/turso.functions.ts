import { createServerFn } from "@tanstack/react-start";
import { getTursoClient, initTursoSchema } from "./turso";
import { TursoRepository, type TursoNote, type TursoQA } from "./turso-lms";

// Test & Sync
export const testTursoConnection = createServerFn({ method: "POST" }).handler(async () => {
  try {
    const db = getTursoClient();
    const result = await db.execute("SELECT 1 as connected;");
    return {
      success: true,
      connected: true,
      rowsCount: result.rows.length,
      message: "Berhasil terhubung ke database Turso!",
    };
  } catch (error: any) {
    return {
      success: false,
      connected: false,
      error: error.message || "Gagal menghubungi database Turso",
    };
  }
});

export const syncTursoSchema = createServerFn({ method: "POST" }).handler(async () => {
  try {
    const result = await initTursoSchema();
    return result;
  } catch (error: any) {
    return {
      success: false,
      error: error.message || "Gagal sinkronisasi skema Turso",
    };
  }
});

// ==========================================
// NOTES SERVER FUNCTIONS
// ==========================================
export const getStudentNotesForMaterial = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) => d as { userId: string; materialSlug: string })
  .handler(async ({ data }) => {
    try {
      const notes = await TursoRepository.getStudentNotes(data.userId, data.materialSlug);
      return { notes, success: true };
    } catch (e: any) {
      return { notes: [], success: false, error: e.message };
    }
  });

export const saveStudentNoteAction = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) => d as Omit<TursoNote, "id" | "created_at">)
  .handler(async ({ data }) => {
    try {
      const note = await TursoRepository.saveStudentNote(data);
      return { note, success: true };
    } catch (e: any) {
      return { note: null, success: false, error: e.message };
    }
  });

export const deleteStudentNoteAction = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) => d as { id: string; userId: string })
  .handler(async ({ data }) => {
    try {
      await TursoRepository.deleteStudentNote(data.id, data.userId);
      return { success: true };
    } catch (e: any) {
      return { success: false, error: e.message };
    }
  });

// ==========================================
// Q&A DISCUSSION SERVER FUNCTIONS
// ==========================================
export const getCourseQAAction = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) => d as { materialSlug: string })
  .handler(async ({ data }) => {
    try {
      const qa = await TursoRepository.getCourseQA(data.materialSlug);
      return { qa, success: true };
    } catch (e: any) {
      return { qa: [], success: false, error: e.message };
    }
  });

export const postQuestionAction = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) => d as Omit<TursoQA, "id" | "created_at" | "replies">)
  .handler(async ({ data }) => {
    try {
      const qa = await TursoRepository.postQuestion(data);
      return { qa, success: true };
    } catch (e: any) {
      return { qa: null, success: false, error: e.message };
    }
  });

export const postAnswerAction = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) => d as { questionId: string; author: string; avatar?: string; role?: string; text: string })
  .handler(async ({ data }) => {
    try {
      await TursoRepository.postAnswer(data.questionId, {
        author: data.author,
        avatar: data.avatar,
        role: data.role,
        text: data.text,
      });
      return { success: true };
    } catch (e: any) {
      return { success: false, error: e.message };
    }
  });

// ==========================================
// CERTIFICATE ISSUANCE
// ==========================================
export const issueTursoCertificateAction = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) => d as { userId: string; materialSlug: string; courseTitle: string; studentName: string })
  .handler(async ({ data }) => {
    try {
      const certificate = await TursoRepository.issueCertificate(
        data.userId,
        data.materialSlug,
        data.courseTitle,
        data.studentName
      );
      return { certificate, success: true };
    } catch (e: any) {
      return { certificate: null, success: false, error: e.message };
    }
  });
