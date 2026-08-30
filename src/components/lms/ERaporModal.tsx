import React from "react";
import { Printer, Download, Share2, Award, CheckCircle2, GraduationCap, Building2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

interface ERaporModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  studentName?: string;
  nisn?: string;
  grade?: number;
  semester?: number;
  academicYear?: string;
}

export function ERaporModal({
  open,
  onOpenChange,
  studentName = "Ahmad Rizky Pratama",
  nisn = "0089274819",
  grade = 8,
  semester = 1,
  academicYear = "2025/2026",
}: ERaporModalProps) {
  const raportData = [
    {
      code: "INF-01",
      subject: "Informatika (Berpikir Komputasional)",
      formativeScore: 90,
      summativeScore: 92,
      finalScore: 91,
      predicate: "Sangat Baik (A)",
      description: "Menunjukkan penguasaan sangat baik dalam dekomposisi masalah dan perancangan algoritma Bebras task.",
    },
    {
      code: "INF-02",
      subject: "Informatika (Analisis Data & Spreadsheet)",
      formativeScore: 86,
      summativeScore: 88,
      finalScore: 87,
      predicate: "Baik (B)",
      description: "Mampu menerapkan formula matematika, fungsi logika IF, serta visualisasi grafik data secara tepat.",
    },
    {
      code: "INF-03",
      subject: "Informatika (Pemrograman Python)",
      formativeScore: 94,
      summativeScore: 96,
      finalScore: 95,
      predicate: "Sangat Baik (A)",
      description: "Sangat terampil dalam menyusun kode percabangan, perulangan, dan pemecahan masalah komputasi terstruktur.",
    },
    {
      code: "INF-04",
      subject: "Informatika (Keamanan Siber & Jaringan)",
      formativeScore: 88,
      summativeScore: 90,
      finalScore: 89,
      predicate: "Baik (B)",
      description: "Memahami topologi jaringan, teknik enkripsi data, dan etika keamanan privasi digital dengan baik.",
    },
  ];

  const averageScore = Math.round(
    raportData.reduce((acc, curr) => acc + curr.finalScore, 0) / raportData.length
  );

  const handlePrint = () => {
    window.print();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl p-0 overflow-hidden bg-card border-border/80 rounded-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader className="p-6 pb-3 border-b border-border/60">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <GraduationCap className="w-5 h-5 text-primary" />
              <DialogTitle className="text-lg font-bold">Rapor Capaian Hasil Belajar (E-Rapor)</DialogTitle>
            </div>
            <Badge variant="outline" className="font-mono text-xs">
              Kurikulum Merdeka SMP
            </Badge>
          </div>
        </DialogHeader>

        {/* Official Report Document Body */}
        <div className="p-6 sm:p-8 bg-background">
          <div className="rounded-2xl border border-border/80 bg-card p-6 sm:p-8 shadow-sm">
            {/* School Header */}
            <div className="text-center border-b-2 border-primary/20 pb-6 mb-6">
              <h3 className="font-display text-xl sm:text-2xl font-bold tracking-tight text-foreground">
                SMP CONTINUUM LEARNING ACADEMY
              </h3>
              <p className="text-xs text-muted-foreground mt-1">
                Laporan Hasil Belajar Peserta Didik · Tahun Ajaran {academicYear}
              </p>
            </div>

            {/* Student Info Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 p-4 rounded-xl bg-secondary/30 border border-border/60 text-xs mb-6 font-mono">
              <div>
                <span className="text-muted-foreground">Nama Peserta Didik:</span>
                <p className="font-bold text-foreground mt-0.5">{studentName}</p>
              </div>
              <div>
                <span className="text-muted-foreground">NISN / No. Induk:</span>
                <p className="font-bold text-foreground mt-0.5">{nisn}</p>
              </div>
              <div>
                <span className="text-muted-foreground">Kelas / Semester:</span>
                <p className="font-bold text-foreground mt-0.5">Kelas {grade} / Semester {semester}</p>
              </div>
              <div>
                <span className="text-muted-foreground">Rata-rata Nilai:</span>
                <p className="font-bold text-primary mt-0.5 text-sm">{averageScore} / 100 🌟</p>
              </div>
            </div>

            {/* Competency Grade Table */}
            <div className="overflow-x-auto rounded-xl border border-border/80 mb-6">
              <table className="w-full text-left text-xs border-collapse">
                <thead className="bg-muted/60 font-mono border-b border-border/60 text-muted-foreground">
                  <tr>
                    <th className="p-3 font-bold">Mata Pelajaran & Elemen</th>
                    <th className="p-3 font-bold text-center">Formatif</th>
                    <th className="p-3 font-bold text-center">Sumatif</th>
                    <th className="p-3 font-bold text-center">Nilai Akhir</th>
                    <th className="p-3 font-bold">Capaian Kompetensi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/60">
                  {raportData.map((row) => (
                    <tr key={row.code} className="hover:bg-muted/20">
                      <td className="p-3 font-semibold text-foreground">
                        {row.subject}
                        <span className="block font-mono text-[10px] text-muted-foreground mt-0.5">{row.code}</span>
                      </td>
                      <td className="p-3 text-center font-mono">{row.formativeScore}</td>
                      <td className="p-3 text-center font-mono">{row.summativeScore}</td>
                      <td className="p-3 text-center font-mono font-bold text-primary">{row.finalScore}</td>
                      <td className="p-3 text-[11px] text-muted-foreground leading-relaxed max-w-xs">{row.description}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Signatures Footer */}
            <div className="mt-8 pt-6 border-t border-border/60 grid grid-cols-2 gap-8 text-center text-xs font-mono text-muted-foreground">
              <div>
                <p>Mengetahui,</p>
                <p className="font-semibold text-foreground mt-1">Orang Tua / Wali Murid</p>
                <div className="h-16" />
                <p className="border-t border-border/60 w-36 mx-auto pt-1">( ........................................ )</p>
              </div>

              <div>
                <p>Jakarta, 30 Agustus 2026</p>
                <p className="font-semibold text-foreground mt-1">Guru Pengampu Informatika</p>
                <div className="h-16 flex items-center justify-center">
                  <span className="text-[10px] text-primary border border-primary/30 rounded-md px-2 py-0.5 bg-primary/5">
                    Tervalidasi Digital ✓
                  </span>
                </div>
                <p className="border-t border-border/60 w-36 mx-auto pt-1 font-bold text-foreground">Imran Alwi, S.Kom.</p>
              </div>
            </div>
          </div>
        </div>

        {/* Modal Action Bar */}
        <div className="p-4 bg-muted/40 border-t border-border/60 flex items-center justify-end gap-3">
          <Button variant="outline" size="sm" onClick={() => onOpenChange(false)} className="text-xs">
            Tutup
          </Button>
          <Button size="sm" onClick={handlePrint} className="gap-1.5 text-xs font-semibold">
            <Printer className="w-3.5 h-3.5" />
            Cetak / Simpan PDF E-Rapor
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
