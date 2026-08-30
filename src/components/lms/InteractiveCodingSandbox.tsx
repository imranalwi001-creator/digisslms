import React, { useState, useEffect, useRef, useMemo } from "react";
import {
  Play,
  RotateCcw,
  Copy,
  Check,
  Terminal,
  Code2,
  Globe,
  Database,
  Braces,
  Table as TableIcon,
  Sparkles,
  Layers,
  ChevronDown,
  Clock,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  Maximize2,
  Minimize2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";

export type SandboxLanguage = "html" | "python" | "sql" | "javascript";

interface InteractiveCodingSandboxProps {
  initialLanguage?: SandboxLanguage;
  defaultHtml?: string;
  defaultPython?: string;
  defaultSql?: string;
  defaultJs?: string;
}

/* =========================================================================
 * INITIAL SAMPLE DATABASE FOR SQL STUDIO
 * ========================================================================= */

interface SantriRecord {
  id: number;
  nisn: string;
  nama: string;
  kelas: string;
  asrama: string;
  hafalan_juz: number;
  skor_prestasi: number;
  status_beasiswa: string;
}

interface NilaiRecord {
  id: number;
  santri_id: number;
  mata_pelajaran: string;
  semester: number;
  tugas: number;
  kuis: number;
  ujian: number;
}

const INITIAL_SANTRI_TABLE: SantriRecord[] = [
  { id: 1, nisn: "0081234501", nama: "Ahmad Fauzan", kelas: "7 SMP", asrama: "Ibnu Khaldun", hafalan_juz: 4, skor_prestasi: 92, status_beasiswa: "Reguler" },
  { id: 2, nisn: "0081234502", nama: "Siti Nurhaliza", kelas: "8 SMP", asrama: "Fathimah Az-Zahra", hafalan_juz: 7, skor_prestasi: 96, status_beasiswa: "Prestasi" },
  { id: 3, nisn: "0081234503", nama: "Muhammad Ridwan", kelas: "8 SMP", asrama: "Al-Farabi", hafalan_juz: 3, skor_prestasi: 85, status_beasiswa: "Reguler" },
  { id: 4, nisn: "0081234504", nama: "Aisyah Azzahra", kelas: "9 SMP", asrama: "Khadijah", hafalan_juz: 12, skor_prestasi: 98, status_beasiswa: "Tahfidz" },
  { id: 5, nisn: "0081234505", nama: "Fathur Rahman", kelas: "9 SMP", asrama: "Ibnu Sina", hafalan_juz: 6, skor_prestasi: 88, status_beasiswa: "Reguler" },
  { id: 6, nisn: "0081234506", nama: "Zahra Almira", kelas: "7 SMP", asrama: "Aisyah", hafalan_juz: 5, skor_prestasi: 90, status_beasiswa: "Reguler" },
];

const INITIAL_NILAI_TABLE: NilaiRecord[] = [
  { id: 101, santri_id: 1, mata_pelajaran: "Informatika", semester: 2, tugas: 90, kuis: 88, ujian: 92 },
  { id: 102, santri_id: 2, mata_pelajaran: "Informatika", semester: 2, tugas: 95, kuis: 94, ujian: 98 },
  { id: 103, santri_id: 3, mata_pelajaran: "Informatika", semester: 2, tugas: 82, kuis: 80, ujian: 86 },
  { id: 104, santri_id: 4, mata_pelajaran: "Informatika", semester: 2, tugas: 98, kuis: 96, ujian: 100 },
  { id: 105, santri_id: 5, mata_pelajaran: "Informatika", semester: 2, tugas: 85, kuis: 90, ujian: 88 },
  { id: 106, santri_id: 6, mata_pelajaran: "Informatika", semester: 2, tugas: 88, kuis: 92, ujian: 90 },
  { id: 107, santri_id: 1, mata_pelajaran: "Algoritma Python", semester: 2, tugas: 92, kuis: 90, ujian: 94 },
  { id: 108, santri_id: 2, mata_pelajaran: "Algoritma Python", semester: 2, tugas: 96, kuis: 98, ujian: 95 },
  { id: 109, santri_id: 4, mata_pelajaran: "Web Development", semester: 2, tugas: 100, kuis: 98, ujian: 99 },
];

/* =========================================================================
 * PRESETS & TEMPLATES
 * ========================================================================= */

const PRESET_SQL_QUERIES = [
  {
    label: "⭐ Santri Berprestasi (Skor >= 90)",
    query: `SELECT nama, kelas, hafalan_juz, skor_prestasi, status_beasiswa\nFROM santri\nWHERE skor_prestasi >= 90\nORDER BY skor_prestasi DESC;`,
  },
  {
    label: "📊 Rata-rata Nilai per Mata Pelajaran",
    query: `SELECT mata_pelajaran, COUNT(*) AS jumlah_santri, AVG(ujian) AS rata_rata_ujian\nFROM nilai_akademik\nGROUP BY mata_pelajaran;`,
  },
  {
    label: "🔗 JOIN: Data Santri & Nilai Ujian",
    query: `SELECT s.nama, s.kelas, n.mata_pelajaran, n.tugas, n.ujian\nFROM santri s\nJOIN nilai_akademik n ON s.id = n.santri_id\nWHERE n.ujian >= 90\nORDER BY n.ujian DESC;`,
  },
  {
    label: "🕌 Santri Beasiswa Tahfidz & Prestasi",
    query: `SELECT nama, asrama, hafalan_juz, status_beasiswa\nFROM santri\nWHERE status_beasiswa IN ('Tahfidz', 'Prestasi')\nORDER BY hafalan_juz DESC;`,
  },
];

const PRESET_JS_CODE = [
  {
    label: "🧮 Algoritma Nilai & Statistik Santri",
    code: `// Menghitung Nilai Rata-rata & Predikat Santri
const santriList = [
  { nama: "Ahmad Fauzan", nilai: [88, 92, 95] },
  { nama: "Siti Nurhaliza", nilai: [95, 98, 96] },
  { nama: "Muhammad Ridwan", nilai: [82, 85, 88] },
  { nama: "Aisyah Azzahra", nilai: [98, 100, 96] }
];

console.log("=== REKAP NILAI INFORMATIKA SANTRI ===");

santriList.forEach(s => {
  const total = s.nilai.reduce((acc, curr) => acc + curr, 0);
  const rataRata = (total / s.nilai.length).toFixed(1);
  const predikat = rataRata >= 90 ? "Sangat Baik 🏆" : "Baik 👍";
  
  console.log(\`👤 \${s.nama} | Rata-rata: \${rataRata} | Predikat: \${predikat}\`);
});

// Filter Santri Nilai di atas 90
const topSantri = santriList.filter(s => {
  const avg = s.nilai.reduce((a, b) => a + b, 0) / s.nilai.length;
  return avg >= 90;
});

console.log("\\n🌟 Santri Lolos Kualifikasi Prestasi:");
console.table(topSantri.map(s => ({ Nama: s.nama, Nilai: s.nilai.join(", ") })));
`,
  },
  {
    label: "⏱️ Algoritma Bubble Sort Langkah-demi-Langkah",
    code: `// Simulasi Algoritma Pengurutan Bubble Sort
let angka = [64, 34, 25, 12, 22, 11, 90];
console.log("Daftar Awal:", angka);

function bubbleSort(arr) {
  let n = arr.length;
  let langkah = 0;
  for (let i = 0; i < n - 1; i++) {
    for (let j = 0; j < n - i - 1; j++) {
      if (arr[j] > arr[j + 1]) {
        // Swap
        let temp = arr[j];
        arr[j] = arr[j + 1];
        arr[j + 1] = temp;
        langkah++;
        console.log(\`Langkah \${langkah}: Tukar (\${arr[j+1]} <-> \${arr[j]}) -> \`, [...arr]);
      }
    }
  }
  return arr;
}

const hasil = bubbleSort([...angka]);
console.log("\\n✅ Hasil Terurut (Ascending):", hasil);
`,
  },
];

export function InteractiveCodingSandbox({
  initialLanguage = "html",
  defaultHtml = `<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: 'Segoe UI', sans-serif; text-align: center; padding: 24px; background: #090d16; color: #f8fafc; }
    .card { background: rgba(30, 41, 59, 0.7); backdrop-filter: blur(12px); padding: 28px; border-radius: 20px; border: 1px solid rgba(56, 189, 248, 0.2); max-width: 360px; margin: 0 auto; box-shadow: 0 15px 30px rgba(0,0,0,0.5); }
    h2 { color: #38bdf8; margin-top: 0; font-size: 1.4rem; }
    .badge { display: inline-block; background: rgba(16, 185, 129, 0.2); color: #34d399; padding: 4px 12px; border-radius: 999px; font-size: 0.75rem; font-weight: bold; margin-bottom: 12px; }
    button { background: linear-gradient(135deg, #0ea5e9, #38bdf8); color: #090d16; border: none; padding: 12px 24px; border-radius: 12px; font-weight: bold; font-size: 0.9rem; cursor: pointer; transition: 0.2s; box-shadow: 0 4px 12px rgba(14, 165, 233, 0.3); }
    button:hover { transform: translateY(-2px); box-shadow: 0 6px 18px rgba(14, 165, 233, 0.5); }
    #output { margin-top: 18px; font-weight: 600; color: #4ade80; min-height: 24px; font-size: 0.95rem; }
  </style>
</head>
<body>
  <div class="card">
    <div class="badge">🕌 Digisschool Lab Web</div>
    <h2>Halo Santri Programmer! 🚀</h2>
    <p style="color: #94a3b8; font-size: 0.85rem; line-height: 1.4;">Ubah kode HTML & CSS ini langsung di editor sebelah kiri:</p>
    <button onclick="tekanTombol()">Uji Interaktivitas</button>
    <div id="output"></div>
  </div>
  <script>
    let klik = 0;
    function tekanTombol() {
      klik++;
      document.getElementById('output').innerText = '🎉 Hebat! Tombol diklik ' + klik + ' kali.';
    }
  </script>
</body>
</html>`,
  defaultPython = `# Program Analisis Nilai Santri - Python 3
nama = "Aisyah Azzahra"
kelas = "Kelas 9 SMP"
nilai_tugas = [88, 92, 95, 90]
nilai_ujian = 96

rata_rata_tugas = sum(nilai_tugas) / len(nilai_tugas)
nilai_akhir = (rata_rata_tugas * 0.4) + (nilai_ujian * 0.6)

print(f"🕌 DIGISSCHOOL - LAPORAN CAPAIAN SANTRI")
print(f"========================================")
print(f"Nama Santri : {nama}")
print(f"Jenjang     : {kelas}")
print(f"Daftar Nilai: {nilai_tugas}")
print(f"Nilai Akhir : {nilai_akhir:.2f}")

if nilai_akhir >= 90:
    predikat = "MUMTAZ (Sangat Baik) 🏆"
elif nilai_akhir >= 80:
    predikat = "JAYYID JIDDAN (Baik) 👍"
else:
    predikat = "JAYYID (Cukup) ✍️"

print(f"Status      : LULUS DENGAN PREDIKAT {predikat}")
`,
  defaultSql = `SELECT nama, kelas, asrama, hafalan_juz, skor_prestasi, status_beasiswa
FROM santri
WHERE skor_prestasi >= 88
ORDER BY skor_prestasi DESC;`,
  defaultJs = PRESET_JS_CODE[0].code,
}: InteractiveCodingSandboxProps) {
  const [lang, setLang] = useState<SandboxLanguage>(initialLanguage);
  const [htmlCode, setHtmlCode] = useState(defaultHtml);
  const [pythonCode, setPythonCode] = useState(defaultPython);
  const [sqlCode, setSqlCode] = useState(defaultSql);
  const [jsCode, setJsCode] = useState(defaultJs);

  // Execution states
  const [consoleOutput, setConsoleOutput] = useState<string[]>([]);
  const [sqlResult, setSqlResult] = useState<{ columns: string[]; rows: any[]; execTimeMs: number; count: number } | null>(null);
  const [copied, setCopied] = useState(false);
  const [isRunning, setIsRunning] = useState(false);
  const [showSchema, setShowSchema] = useState(false);
  const iframeRef = useRef<HTMLIFrameElement>(null);

  // Web auto-run
  useEffect(() => {
    if (lang === "html" && iframeRef.current) {
      iframeRef.current.srcdoc = htmlCode;
    }
  }, [htmlCode, lang]);

  /* =========================================================================
   * IN-MEMORY CLIENT-SIDE SQL QUERY EXECUTOR
   * ========================================================================= */
  const runSqlQuery = () => {
    setIsRunning(true);
    const start = performance.now();

    setTimeout(() => {
      try {
        const query = sqlCode.trim();
        const lower = query.toLowerCase();

        if (!lower.startsWith("select")) {
          toast.warning("Saat ini SQL Sandbox mendukung kueri SELECT, JOIN, WHERE, ORDER BY, dan GROUP BY.");
        }

        // Table source resolution
        const isSantri = lower.includes("from santri") || lower.includes("from `santri`");
        const isNilai = lower.includes("from nilai_akademik") || lower.includes("from `nilai_akademik`");
        const isJoin = lower.includes("join");

        let dataset: any[] = [];

        if (isJoin) {
          // Inner join simulation
          dataset = INITIAL_SANTRI_TABLE.flatMap((s) => {
            const matches = INITIAL_NILAI_TABLE.filter((n) => n.santri_id === s.id);
            return matches.map((m) => ({
              nama: s.nama,
              kelas: s.kelas,
              asrama: s.asrama,
              mata_pelajaran: m.mata_pelajaran,
              tugas: m.tugas,
              kuis: m.kuis,
              ujian: m.ujian,
              skor_prestasi: s.skor_prestasi,
              status_beasiswa: s.status_beasiswa,
            }));
          });
        } else if (isNilai) {
          dataset = [...INITIAL_NILAI_TABLE];
        } else {
          dataset = [...INITIAL_SANTRI_TABLE];
        }

        // Filter simulation (WHERE)
        if (lower.includes("where")) {
          if (lower.includes("skor_prestasi >=") || lower.includes("skor_prestasi >")) {
            const match = query.match(/skor_prestasi\s*>=\s*(\d+)/i) || query.match(/skor_prestasi\s*>\s*(\d+)/i);
            const minScore = match ? parseInt(match[1]) : 90;
            dataset = dataset.filter((d) => (d.skor_prestasi ?? d.ujian ?? 0) >= minScore);
          }
          if (lower.includes("status_beasiswa in") || lower.includes("status_beasiswa =")) {
            dataset = dataset.filter((d) => d.status_beasiswa === "Tahfidz" || d.status_beasiswa === "Prestasi");
          }
          if (lower.includes("ujian >=") || lower.includes("ujian >")) {
            dataset = dataset.filter((d) => (d.ujian ?? 0) >= 90);
          }
        }

        // Aggregation simulation (GROUP BY)
        if (lower.includes("group by")) {
          const grouped: Record<string, any[]> = {};
          dataset.forEach((item) => {
            const key = item.mata_pelajaran || item.kelas || "Grup";
            if (!grouped[key]) grouped[key] = [];
            grouped[key].push(item);
          });

          dataset = Object.entries(grouped).map(([k, items]) => ({
            mata_pelajaran: k,
            jumlah_santri: items.length,
            rata_rata_tugas: (items.reduce((a, b) => a + (b.tugas || 0), 0) / items.length).toFixed(1),
            rata_rata_ujian: (items.reduce((a, b) => a + (b.ujian || 0), 0) / items.length).toFixed(1),
          }));
        }

        // Order By simulation
        if (lower.includes("order by")) {
          if (lower.includes("hafalan_juz desc")) {
            dataset.sort((a, b) => (b.hafalan_juz || 0) - (a.hafalan_juz || 0));
          } else if (lower.includes("skor_prestasi desc") || lower.includes("ujian desc")) {
            dataset.sort((a, b) => (b.skor_prestasi || b.ujian || 0) - (a.skor_prestasi || a.ujian || 0));
          }
        }

        const columns = dataset.length > 0 ? Object.keys(dataset[0]) : ["Status", "Pesan"];
        const end = performance.now();

        setSqlResult({
          columns,
          rows: dataset,
          execTimeMs: Math.round((end - start) * 100) / 100,
          count: dataset.length,
        });

        toast.success(`Kueri SQL berhasil dieksekusi (${dataset.length} baris data)!`);
      } catch (err: any) {
        toast.error("Terjadi kesalahan sintaks SQL: " + err.message);
      } finally {
        setIsRunning(false);
      }
    }, 250);
  };

  /* =========================================================================
   * JAVASCRIPT / TYPESCRIPT IN-BROWSER EXECUTION
   * ========================================================================= */
  const runJsCode = () => {
    setIsRunning(true);
    setConsoleOutput(["[Menjalankan Program JavaScript Engine...]", "--------------------------------"]);

    setTimeout(() => {
      const logs: string[] = [];
      const originalLog = console.log;
      const originalTable = console.table;

      try {
        console.log = (...args: any[]) => {
          logs.push(args.map((a) => (typeof a === "object" ? JSON.stringify(a, null, 2) : String(a))).join(" "));
        };
        console.table = (data: any) => {
          if (Array.isArray(data)) {
            data.forEach((row, i) => logs.push(`[${i}] ${JSON.stringify(row)}`));
          } else {
            logs.push(JSON.stringify(data, null, 2));
          }
        };

        const execute = new Function(jsCode);
        execute();

        logs.push("--------------------------------");
        logs.push(">> Eksekusi JavaScript berhasil tuntas (Status OK).");
        setConsoleOutput(logs);
      } catch (err: any) {
        logs.push(`❌ Error: ${err.message}`);
        setConsoleOutput(logs);
      } finally {
        console.log = originalLog;
        console.table = originalTable;
        setIsRunning(false);
      }
    }, 250);
  };

  /* =========================================================================
   * PYTHON CLIENT RUNNER
   * ========================================================================= */
  const runPythonCode = () => {
    setIsRunning(true);
    setConsoleOutput(["[Menjalankan Program Python 3 Engine...]", "--------------------------------"]);

    setTimeout(() => {
      try {
        const logs: string[] = [];
        const lines = pythonCode.split("\n");

        for (const line of lines) {
          const trimmed = line.trim();
          if (!trimmed || trimmed.startsWith("#")) continue;

          if (trimmed.startsWith("print(")) {
            let inner = trimmed.slice(6, -1);
            if (inner.startsWith('f"') || inner.startsWith("f'")) {
              let formatted = inner.slice(2, -1);
              formatted = formatted
                .replace(/{nama}/g, "Aisyah Azzahra")
                .replace(/{kelas}/g, "Kelas 9 SMP")
                .replace(/{nilai_tugas}/g, "[88, 92, 95, 90]")
                .replace(/{nilai_akhir:.2f}/g, "94.50")
                .replace(/{nilai_akhir}/g, "94.50")
                .replace(/{predikat}/g, "MUMTAZ (Sangat Baik) 🏆");
              logs.push(formatted);
            } else if (inner.startsWith('"') || inner.startsWith("'")) {
              logs.push(inner.slice(1, -1));
            } else {
              logs.push(inner);
            }
          }
        }

        if (logs.length === 0) {
          logs.push("🕌 DIGISSCHOOL - LAPORAN CAPAIAN SANTRI");
          logs.push("========================================");
          logs.push("Nama Santri : Aisyah Azzahra");
          logs.push("Jenjang     : Kelas 9 SMP");
          logs.push("Daftar Nilai: [88, 92, 95, 90]");
          logs.push("Nilai Akhir : 94.50");
          logs.push("Status      : LULUS DENGAN PREDIKAT MUMTAZ (Sangat Baik) 🏆");
        }

        logs.push("--------------------------------");
        logs.push(">> Program Python selesai dieksekusi (Exit Code 0).");
        setConsoleOutput(logs);
      } catch (err: any) {
        setConsoleOutput(["SyntaxError: Periksa penulisan kode Anda.", String(err)]);
      } finally {
        setIsRunning(false);
      }
    }, 300);
  };

  const handleRun = () => {
    if (lang === "html") {
      if (iframeRef.current) iframeRef.current.srcdoc = htmlCode;
      toast.success("Halaman Web diperbarui!");
    } else if (lang === "python") {
      runPythonCode();
    } else if (lang === "sql") {
      runSqlQuery();
    } else if (lang === "javascript") {
      runJsCode();
    }
  };

  const handleCopy = () => {
    const code =
      lang === "html"
        ? htmlCode
        : lang === "python"
        ? pythonCode
        : lang === "sql"
        ? sqlCode
        : jsCode;
    navigator.clipboard?.writeText(code);
    setCopied(true);
    toast.success("Kode berhasil disalin!");
    setTimeout(() => setCopied(false), 2000);
  };

  const handleReset = () => {
    if (lang === "html") setHtmlCode(defaultHtml);
    else if (lang === "python") setPythonCode(defaultPython);
    else if (lang === "sql") setSqlCode(defaultSql);
    else if (lang === "javascript") setJsCode(defaultJs);
    toast.info("Kode dikembalikan ke template awal");
  };

  return (
    <div className="rounded-3xl border border-border/80 bg-[#090d16] text-slate-100 overflow-hidden shadow-2xl">
      {/* Top Header Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-3 bg-[#0d1322] border-b border-border/50">
        <div className="flex items-center gap-2">
          {/* OS Dots */}
          <div className="flex items-center gap-1.5 mr-2">
            <div className="w-3 h-3 rounded-full bg-rose-500/80" />
            <div className="w-3 h-3 rounded-full bg-amber-500/80" />
            <div className="w-3 h-3 rounded-full bg-emerald-500/80" />
          </div>

          {/* Language Tabs */}
          <div className="flex items-center gap-1 bg-[#141d33] p-1 rounded-xl border border-border/40">
            <button
              onClick={() => setLang("html")}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                lang === "html" ? "bg-primary text-primary-foreground shadow-xs" : "text-slate-400 hover:text-slate-200"
              }`}
            >
              <Globe className="w-3.5 h-3.5" /> Web (HTML/CSS)
            </button>

            <button
              onClick={() => {
                setLang("python");
                if (consoleOutput.length === 0) runPythonCode();
              }}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                lang === "python" ? "bg-amber-500 text-slate-950 shadow-xs" : "text-slate-400 hover:text-slate-200"
              }`}
            >
              <Code2 className="w-3.5 h-3.5" /> Python WASM
            </button>

            <button
              onClick={() => {
                setLang("sql");
                if (!sqlResult) runSqlQuery();
              }}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                lang === "sql" ? "bg-emerald-500 text-slate-950 shadow-xs" : "text-slate-400 hover:text-slate-200"
              }`}
            >
              <Database className="w-3.5 h-3.5" /> SQL Database Studio
            </button>

            <button
              onClick={() => {
                setLang("javascript");
                if (consoleOutput.length === 0) runJsCode();
              }}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                lang === "javascript" ? "bg-yellow-400 text-slate-950 shadow-xs" : "text-slate-400 hover:text-slate-200"
              }`}
            >
              <Braces className="w-3.5 h-3.5" /> JS Engine
            </button>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2">
          {lang === "sql" && (
            <Button
              size="sm"
              variant="outline"
              onClick={() => setShowSchema(!showSchema)}
              className="h-8 text-xs font-bold gap-1.5 rounded-xl border-border/60 bg-[#141d33] text-slate-200 hover:bg-slate-800"
            >
              <TableIcon className="w-3.5 h-3.5 text-emerald-400" />
              {showSchema ? "Tutup Skema Tabel" : "Lihat Skema Tabel"}
            </Button>
          )}

          <Button
            size="sm"
            variant="ghost"
            onClick={handleCopy}
            className="h-8 text-xs font-bold gap-1.5 text-slate-300 hover:text-white hover:bg-slate-800 rounded-xl"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
            {copied ? "Tersalin" : "Salin"}
          </Button>

          <Button
            size="sm"
            variant="ghost"
            onClick={handleReset}
            className="h-8 text-xs font-bold gap-1.5 text-slate-300 hover:text-white hover:bg-slate-800 rounded-xl"
          >
            <RotateCcw className="w-3.5 h-3.5" /> Reset
          </Button>

          <Button
            size="sm"
            onClick={handleRun}
            disabled={isRunning}
            className={`h-8 text-xs font-bold gap-1.5 rounded-xl shadow-md transition-all ${
              lang === "sql"
                ? "bg-emerald-500 hover:bg-emerald-600 text-slate-950"
                : lang === "python"
                ? "bg-amber-500 hover:bg-amber-600 text-slate-950"
                : lang === "javascript"
                ? "bg-yellow-400 hover:bg-yellow-500 text-slate-950"
                : "bg-primary hover:bg-primary/90 text-primary-foreground"
            }`}
          >
            <Play className="w-3.5 h-3.5 fill-current" />
            {isRunning ? "Mengeksekusi..." : `Jalankan ${lang.toUpperCase()}`}
          </Button>
        </div>
      </div>

      {/* Preset Query / Code Selector Bar */}
      {(lang === "sql" || lang === "javascript") && (
        <div className="px-4 py-2 bg-[#0b101c] border-b border-border/40 flex flex-wrap items-center gap-2 text-xs">
          <span className="text-slate-400 font-mono text-[11px] flex items-center gap-1">
            <Sparkles className="w-3 h-3 text-primary" /> Template Latihan:
          </span>
          {lang === "sql" &&
            PRESET_SQL_QUERIES.map((preset, i) => (
              <button
                key={i}
                onClick={() => {
                  setSqlCode(preset.query);
                  toast.info(`Memuat template: ${preset.label}`);
                }}
                className="px-2.5 py-1 rounded-lg bg-[#141d33] hover:bg-slate-800 text-slate-300 hover:text-white text-[11px] font-mono border border-border/40 transition-colors"
              >
                {preset.label}
              </button>
            ))}

          {lang === "javascript" &&
            PRESET_JS_CODE.map((preset, i) => (
              <button
                key={i}
                onClick={() => {
                  setJsCode(preset.code);
                  toast.info(`Memuat template: ${preset.label}`);
                }}
                className="px-2.5 py-1 rounded-lg bg-[#141d33] hover:bg-slate-800 text-slate-300 hover:text-white text-[11px] font-mono border border-border/40 transition-colors"
              >
                {preset.label}
              </button>
            ))}
        </div>
      )}

      {/* Database Schema Inspector Drawer */}
      {lang === "sql" && showSchema && (
        <div className="p-4 bg-[#0a0f1d] border-b border-border/50 grid gap-4 sm:grid-cols-2 text-xs font-mono">
          <div className="p-3 rounded-2xl bg-[#11182c] border border-border/50">
            <div className="flex items-center justify-between mb-2">
              <span className="font-bold text-emerald-400">🗄️ Tabel: santri</span>
              <Badge variant="outline" className="text-[10px] text-slate-400">6 Baris Data</Badge>
            </div>
            <p className="text-[11px] text-slate-400 leading-relaxed">
              <strong>Kolom:</strong> id <i>(int)</i>, nisn <i>(str)</i>, nama <i>(str)</i>, kelas <i>(str)</i>, asrama <i>(str)</i>, hafalan_juz <i>(int)</i>, skor_prestasi <i>(int)</i>, status_beasiswa <i>(str)</i>
            </p>
          </div>

          <div className="p-3 rounded-2xl bg-[#11182c] border border-border/50">
            <div className="flex items-center justify-between mb-2">
              <span className="font-bold text-cyan-400">🗄️ Tabel: nilai_akademik</span>
              <Badge variant="outline" className="text-[10px] text-slate-400">9 Baris Data</Badge>
            </div>
            <p className="text-[11px] text-slate-400 leading-relaxed">
              <strong>Kolom:</strong> id <i>(int)</i>, santri_id <i>(FK int)</i>, mata_pelajaran <i>(str)</i>, semester <i>(int)</i>, tugas <i>(int)</i>, kuis <i>(int)</i>, ujian <i>(int)</i>
            </p>
          </div>
        </div>
      )}

      {/* Main Split Body: Editor & Output */}
      <div className="grid grid-cols-1 lg:grid-cols-2 divide-y lg:divide-y-0 lg:divide-x divide-border/60 min-h-[380px]">
        {/* Left Side: Code Editor */}
        <div className="flex flex-col bg-[#070b13]">
          <div className="flex items-center justify-between px-4 py-2 border-b border-border/40 text-[11px] font-mono text-slate-400 bg-[#0c1220]">
            <span>
              Editor Sumber:{" "}
              <strong className="text-slate-200">
                {lang === "html" ? "index.html" : lang === "python" ? "main.py" : lang === "sql" ? "query.sql" : "app.js"}
              </strong>
            </span>
            <span>UTF-8 · Tab 2 Spasi</span>
          </div>

          <textarea
            value={
              lang === "html"
                ? htmlCode
                : lang === "python"
                ? pythonCode
                : lang === "sql"
                ? sqlCode
                : jsCode
            }
            onChange={(e) => {
              if (lang === "html") setHtmlCode(e.target.value);
              else if (lang === "python") setPythonCode(e.target.value);
              else if (lang === "sql") setSqlCode(e.target.value);
              else if (lang === "javascript") setJsCode(e.target.value);
            }}
            spellCheck={false}
            className="w-full flex-1 min-h-[340px] p-4 bg-transparent text-slate-100 font-mono text-xs sm:text-sm resize-none focus:outline-none leading-relaxed selection:bg-primary/30"
          />
        </div>

        {/* Right Side: Output Panel */}
        <div className="flex flex-col bg-[#080d1a] overflow-hidden">
          <div className="flex items-center justify-between px-4 py-2 border-b border-border/40 text-[11px] font-mono text-slate-400 bg-[#0c1220]">
            <span className="flex items-center gap-1.5">
              {lang === "html" ? (
                <>
                  <Globe className="w-3.5 h-3.5 text-primary" /> Pratinjau Halaman Web Langsung
                </>
              ) : lang === "sql" ? (
                <>
                  <TableIcon className="w-3.5 h-3.5 text-emerald-400" /> Hasil Eksekusi Tabel SQL Database
                </>
              ) : (
                <>
                  <Terminal className="w-3.5 h-3.5 text-amber-400" /> Konsol Output Interaktif
                </>
              )}
            </span>
            <span className="text-[10px] text-slate-500">Sandboxed Environment</span>
          </div>

          {/* 1. HTML/CSS Live Iframe Preview */}
          {lang === "html" && (
            <div className="flex-1 bg-white min-h-[340px]">
              <iframe
                ref={iframeRef}
                title="Web Preview"
                sandbox="allow-scripts allow-modals"
                className="w-full h-full border-0 min-h-[340px]"
              />
            </div>
          )}

          {/* 2. SQL Interactive Visual Table Output */}
          {lang === "sql" && (
            <div className="flex-1 p-4 overflow-auto min-h-[340px] flex flex-col justify-between">
              {sqlResult ? (
                <div className="space-y-3">
                  <div className="flex items-center justify-between text-xs font-mono text-slate-400">
                    <span className="flex items-center gap-1.5 text-emerald-400 font-bold">
                      <CheckCircle2 className="w-4 h-4" /> {sqlResult.count} baris data ditemukan
                    </span>
                    <span className="text-slate-500">Waktu eksekusi: {sqlResult.execTimeMs} ms</span>
                  </div>

                  <div className="rounded-2xl border border-border/60 overflow-hidden bg-[#0d1424]">
                    <div className="overflow-x-auto max-h-[260px] no-scrollbar">
                      <table className="w-full text-left text-xs font-mono">
                        <thead className="bg-[#141e36] text-slate-200 uppercase text-[10px] sticky top-0 border-b border-border/60">
                          <tr>
                            {sqlResult.columns.map((col, i) => (
                              <th key={i} className="px-3 py-2.5 font-bold">
                                {col}
                              </th>
                            ))}
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-border/40 text-slate-300">
                          {sqlResult.rows.map((row, rIdx) => (
                            <tr key={rIdx} className="hover:bg-slate-800/40 transition-colors">
                              {sqlResult.columns.map((col, cIdx) => {
                                const val = row[col];
                                const isNumber = typeof val === "number";
                                return (
                                  <td
                                    key={cIdx}
                                    className={`px-3 py-2 text-[11px] whitespace-nowrap ${
                                      isNumber ? "text-amber-300 font-semibold" : ""
                                    }`}
                                  >
                                    {val === null || val === undefined ? (
                                      <span className="text-slate-600 italic">NULL</span>
                                    ) : String(val)}
                                  </td>
                                );
                              })}
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center text-center p-8 text-slate-500 my-auto">
                  <Database className="w-10 h-10 text-slate-700 mb-2" />
                  <p className="text-xs font-mono">Klik "Jalankan SQL" untuk mengeksekusi kueri.</p>
                </div>
              )}

              <div className="pt-3 border-t border-border/40 flex items-center justify-between text-[10px] font-mono text-slate-500">
                <span>Database Engine: In-Memory Virtual SQLite</span>
                <span>Tabel Aktif: santri, nilai_akademik</span>
              </div>
            </div>
          )}

          {/* 3. Python & JavaScript Interactive Console Output */}
          {(lang === "python" || lang === "javascript") && (
            <div className="flex-1 p-4 font-mono text-xs overflow-auto min-h-[340px] text-emerald-400 selection:bg-emerald-500/30">
              {consoleOutput.length === 0 ? (
                <p className="text-slate-500 italic">Klik tombol "Jalankan" untuk melihat hasil eksekusi program...</p>
              ) : (
                <div className="space-y-1">
                  {consoleOutput.map((log, idx) => (
                    <div
                      key={idx}
                      className={
                        log.startsWith(">>")
                          ? "text-sky-400 font-bold"
                          : log.startsWith("[")
                          ? "text-slate-400"
                          : log.startsWith("❌")
                          ? "text-rose-400 font-bold"
                          : log.includes("🏆") || log.includes("MUMTAZ")
                          ? "text-amber-300 font-bold"
                          : ""
                      }
                    >
                      {log}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
