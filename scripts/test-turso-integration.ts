import { TursoRepository } from "../src/lib/turso-lms";
import * as fs from "node:fs";
import * as path from "node:path";

// Read .env
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

async function runIntegrationTest() {
  console.log("🧪 Memulai pengujian integrasi live Turso Database...\n");

  const testUserId = "user-test-e2e";
  const testSlug = "dasar-algoritma-pemrograman";

  // 1. Test Materials
  console.log("1. Mengambil materi pembelajaran...");
  const materials = await TursoRepository.getMaterials();
  console.log(`✅ Berhasil mengambil ${materials.length} materi dari Turso.`);

  // 2. Test Enrollment
  console.log("2. Mengetes pendaftaran kelas (Enrollment)...");
  await TursoRepository.enrollCourse(testUserId, testSlug);
  const enrollments = await TursoRepository.getEnrollments(testUserId);
  console.log(`✅ Berhasil mendaftarkan siswa ke kelas: ${enrollments.map(e => e.material_slug).join(", ")}`);

  // 3. Test Module Progress
  console.log("3. Mengetes pelacakan progres modul...");
  await TursoRepository.toggleModuleProgress(testUserId, testSlug, 0, true);
  await TursoRepository.toggleModuleProgress(testUserId, testSlug, 1, true);
  const progress = await TursoRepository.getModuleProgress(testUserId);
  console.log(`✅ Progres modul berhasil dicatat (${progress.length} modul selesai).`);

  // 4. Test Student Notes
  console.log("4. Mengetes pencatatan catatan timestamp (Notes)...");
  const note = await TursoRepository.saveStudentNote({
    user_id: testUserId,
    material_slug: testSlug,
    module_index: 0,
    module_name: "Logika Berpikir Komputasional",
    note_text: "Catatan pengujian: Algoritma adalah langkah-langkah terstruktur untuk menyelesaikan masalah.",
  });
  console.log(`✅ Catatan berhasil disimpan: "${note.note_text}" (ID: ${note.id})`);
  const notes = await TursoRepository.getStudentNotes(testUserId, testSlug);
  console.log(`✅ Total catatan tersimpan di Turso: ${notes.length}`);

  // 5. Test Q&A Discussion
  console.log("5. Mengetes forum diskusi Q&A...");
  const qa = await TursoRepository.postQuestion({
    material_slug: testSlug,
    user_id: testUserId,
    author_name: "Budi Santoso",
    question: "Bagaimana cara menentukan efisiensi waktu algoritma (Big O)?",
  });
  console.log(`✅ Pertanyaan berhasil diposting: "${qa.question}" (ID: ${qa.id})`);

  await TursoRepository.postAnswer(qa.id, {
    author: "Guru Pengampu",
    text: "Halo Budi! Kita bisa menghitung kompleksitas waktu berdasarkan jumlah iterasi loop terhadap ukuran input n.",
  });
  const allQA = await TursoRepository.getCourseQA(testSlug);
  const foundQA = allQA.find(q => q.id === qa.id);
  console.log(`✅ Balasan berhasil disimpan di Turso (${foundQA?.replies?.length} balasan).`);

  // 6. Test Certificate Issuance
  console.log("6. Mengetes penerbitan sertifikat resmi...");
  const cert = await TursoRepository.issueCertificate(
    testUserId,
    testSlug,
    "Dasar Algoritma & Pemrograman",
    "Budi Santoso"
  );
  console.log(`✅ Sertifikat resmi berhasil diterbitkan: No: ${cert.certificate_number}`);

  console.log("\n🎉 SELURUH PENGUJIAN INTEGRASI TURSO BERHASIL 100%!");
}

runIntegrationTest().catch(console.error);
