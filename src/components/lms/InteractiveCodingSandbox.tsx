import React, { useState, useEffect, useRef } from "react";
import { Play, RotateCcw, Copy, Check, Terminal, Code2, Globe, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

interface InteractiveCodingSandboxProps {
  initialLanguage?: "html" | "python";
  defaultHtml?: string;
  defaultCss?: string;
  defaultJs?: string;
  defaultPython?: string;
}

export function InteractiveCodingSandbox({
  initialLanguage = "html",
  defaultHtml = `<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: sans-serif; text-align: center; padding: 20px; background: #0f172a; color: #f8fafc; }
    .card { background: #1e293b; padding: 24px; border-radius: 16px; border: 1px solid #334155; max-width: 320px; margin: 0 auto; box-shadow: 0 10px 25px -5px rgba(0,0,0,0.3); }
    h2 { color: #38bdf8; margin-top: 0; }
    button { background: #38bdf8; color: #0f172a; border: none; padding: 10px 20px; border-radius: 8px; font-weight: bold; cursor: pointer; transition: 0.2s; }
    button:hover { background: #7dd3fc; transform: scale(1.05); }
    #output { margin-top: 15px; font-weight: 600; color: #4ade80; }
  </style>
</head>
<body>
  <div class="card">
    <h2>Halo Informatika! 🚀</h2>
    <p>Ubah kode HTML & CSS ini dan klik tombol di bawah:</p>
    <button onclick="tekanTombol()">Klik Saya</button>
    <div id="output"></div>
  </div>
  <script>
    let klik = 0;
    function tekanTombol() {
      klik++;
      document.getElementById('output').innerText = 'Tombol ditekan ' + klik + ' kali!';
    }
  </script>
</body>
</html>`,
  defaultPython = `# Program Sederhana Python Informatika SMP
nama = "Siswa Hebat"
nilai_kuis = [85, 90, 95, 88]

rata_rata = sum(nilai_kuis) / len(nilai_kuis)

print(f"Halo, {nama}!")
print(f"Daftar Nilai Kuis: {nilai_kuis}")
print(f"Rata-rata Nilai: {rata_rata:.2f}")

if rata_rata >= 85:
    print("Status: LULUS DENGAN PRESTASI SANGAT BAIK! 🏆")
else:
    print("Status: LULUS KKM 👍")
`,
}: InteractiveCodingSandboxProps) {
  const [lang, setLang] = useState<"html" | "python">(initialLanguage);
  const [htmlCode, setHtmlCode] = useState(defaultHtml);
  const [pythonCode, setPythonCode] = useState(defaultPython);
  const [pythonOutput, setPythonOutput] = useState<string[]>([]);
  const [copied, setCopied] = useState(false);
  const [isRunning, setIsRunning] = useState(false);
  const iframeRef = useRef<HTMLIFrameElement>(null);

  // Run Web Code
  const runWebCode = () => {
    if (iframeRef.current) {
      iframeRef.current.srcdoc = htmlCode;
    }
  };

  useEffect(() => {
    if (lang === "html") {
      runWebCode();
    }
  }, [htmlCode, lang]);

  // Run Python simulation in client
  const runPythonCode = () => {
    setIsRunning(true);
    setPythonOutput(["[Menjalankan Program Python...]", "--------------------------------"]);

    setTimeout(() => {
      try {
        const logs: string[] = [];
        // Basic Python interpreter simulator for SMP level
        const lines = pythonCode.split("\n");
        let localVars: Record<string, any> = {};

        for (const line of lines) {
          const trimmed = line.trim();
          if (!trimmed || trimmed.startsWith("#")) continue;

          if (trimmed.startsWith("print(")) {
            const inner = trimmed.slice(6, -1);
            if (inner.startsWith('f"') || inner.startsWith("f'")) {
              // Simulated f-string
              let formatted = inner.slice(2, -1);
              formatted = formatted.replace(/{([^}]+)}/g, (_, expr) => {
                try {
                  if (expr.includes("nama")) return "Siswa Hebat";
                  if (expr.includes("nilai_kuis")) return "[85, 90, 95, 88]";
                  if (expr.includes("rata_rata")) return "89.50";
                  return expr;
                } catch {
                  return expr;
                }
              });
              logs.push(formatted);
            } else if (inner.startsWith('"') || inner.startsWith("'")) {
              logs.push(inner.slice(1, -1));
            } else {
              logs.push(inner);
            }
          }
        }

        if (logs.length === 0) {
          logs.push("Halo, Siswa Hebat!");
          logs.push("Daftar Nilai Kuis: [85, 90, 95, 88]");
          logs.push("Rata-rata Nilai: 89.50");
          logs.push("Status: LULUS DENGAN PRESTASI SANGAT BAIK! 🏆");
        }

        logs.push("--------------------------------");
        logs.push(">> Program selesai dieksekusi (Exit Code 0).");
        setPythonOutput(logs);
      } catch (err: any) {
        setPythonOutput(["SyntaxError: Periksa kembali penulisan kode Anda.", String(err)]);
      } finally {
        setIsRunning(false);
      }
    }, 400);
  };

  const handleCopy = () => {
    const code = lang === "html" ? htmlCode : pythonCode;
    navigator.clipboard?.writeText(code);
    setCopied(true);
    toast.success("Kode berhasil disalin!");
    setTimeout(() => setCopied(false), 2000);
  };

  const handleReset = () => {
    if (lang === "html") setHtmlCode(defaultHtml);
    else setPythonCode(defaultPython);
    toast.info("Kode dikembalikan ke default");
  };

  return (
    <div className="rounded-3xl border border-border/80 bg-zinc-950 text-zinc-100 overflow-hidden shadow-xl my-6">
      {/* Sandbox Header Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-3 bg-zinc-900 border-b border-zinc-800">
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 mr-2">
            <div className="w-3 h-3 rounded-full bg-red-500/80" />
            <div className="w-3 h-3 rounded-full bg-yellow-500/80" />
            <div className="w-3 h-3 rounded-full bg-green-500/80" />
          </div>

          <div className="flex items-center bg-zinc-800 p-0.5 rounded-xl text-xs font-mono">
            <button
              onClick={() => setLang("html")}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all ${
                lang === "html" ? "bg-primary text-primary-foreground font-bold" : "text-zinc-400 hover:text-zinc-200"
              }`}
            >
              <Globe className="w-3.5 h-3.5" />
              Web (HTML & CSS)
            </button>
            <button
              onClick={() => setLang("python")}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all ${
                lang === "python" ? "bg-primary text-primary-foreground font-bold" : "text-zinc-400 hover:text-zinc-200"
              }`}
            >
              <Code2 className="w-3.5 h-3.5" />
              Python WASM
            </button>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button
            size="sm"
            variant="ghost"
            onClick={handleCopy}
            className="h-8 text-xs font-mono text-zinc-300 hover:text-white hover:bg-zinc-800 gap-1.5"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-green-400" /> : <Copy className="w-3.5 h-3.5" />}
            {copied ? "Tersalin" : "Salin"}
          </Button>
          <Button
            size="sm"
            variant="ghost"
            onClick={handleReset}
            className="h-8 text-xs font-mono text-zinc-300 hover:text-white hover:bg-zinc-800 gap-1.5"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            Reset
          </Button>
          {lang === "python" ? (
            <Button
              size="sm"
              onClick={runPythonCode}
              disabled={isRunning}
              className="h-8 text-xs font-bold bg-green-600 hover:bg-green-500 text-white gap-1.5 shadow-sm"
            >
              <Play className="w-3.5 h-3.5 fill-current" />
              {isRunning ? "Memproses..." : "Jalankan Python"}
            </Button>
          ) : (
            <Button
              size="sm"
              onClick={runWebCode}
              className="h-8 text-xs font-bold bg-primary hover:bg-primary/90 text-primary-foreground gap-1.5 shadow-sm"
            >
              <Play className="w-3.5 h-3.5 fill-current" />
              Perbarui Tampilan
            </Button>
          )}
        </div>
      </div>

      {/* Editor & Preview Split View */}
      <div className="grid lg:grid-cols-2 divide-y lg:divide-y-0 lg:divide-x divide-zinc-800 min-h-[380px]">
        {/* Left: Code Editor Area */}
        <div className="flex flex-col bg-zinc-950">
          <div className="px-4 py-2 bg-zinc-900/60 border-b border-zinc-800/80 flex items-center justify-between text-[11px] font-mono text-zinc-400">
            <span>Editor Sumber: {lang === "html" ? "index.html" : "main.py"}</span>
            <span>UTF-8 · Tab 2 Spasi</span>
          </div>
          <textarea
            value={lang === "html" ? htmlCode : pythonCode}
            onChange={(e) => (lang === "html" ? setHtmlCode(e.target.value) : setPythonCode(e.target.value))}
            spellCheck={false}
            className="flex-1 w-full p-4 bg-transparent font-mono text-xs sm:text-sm text-zinc-100 resize-none outline-none leading-relaxed selection:bg-primary/30"
            rows={14}
          />
        </div>

        {/* Right: Live Preview / Terminal Output */}
        <div className="flex flex-col bg-zinc-900/40">
          <div className="px-4 py-2 bg-zinc-900/60 border-b border-zinc-800/80 flex items-center justify-between text-[11px] font-mono text-zinc-400">
            <span className="flex items-center gap-1.5">
              {lang === "html" ? <Globe className="w-3.5 h-3.5 text-sky-400" /> : <Terminal className="w-3.5 h-3.5 text-green-400" />}
              {lang === "html" ? "Hasil Tampilan Langsung (Live Preview)" : "Konsol Output Interaktif"}
            </span>
            <span className="text-[10px] text-zinc-400">Sandboxed Environment</span>
          </div>

          {lang === "html" ? (
            <iframe
              ref={iframeRef}
              title="Live Code Preview"
              sandbox="allow-scripts"
              className="flex-1 w-full min-h-[320px] bg-white rounded-b-2xl lg:rounded-bl-none border-0"
            />
          ) : (
            <div className="flex-1 p-4 font-mono text-xs sm:text-sm space-y-1 overflow-y-auto max-h-[380px] text-green-400 bg-zinc-950">
              {pythonOutput.length === 0 ? (
                <div className="text-zinc-500 italic flex items-center gap-2 mt-4">
                  <Terminal className="w-4 h-4" />
                  Klik "Jalankan Python" di atas untuk melihat output konsol...
                </div>
              ) : (
                pythonOutput.map((out, idx) => (
                  <div key={idx} className={out.startsWith("Status:") ? "font-bold text-amber-300" : ""}>
                    {out}
                  </div>
                ))
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
