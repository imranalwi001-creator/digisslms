import React from "react";
import { Award, CheckCircle2, Download, Printer, Share2, X, ShieldCheck } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

interface CertificateModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  certificate: {
    number: string;
    courseTitle: string;
    studentName: string;
    issueDate: string;
    grade?: number | null;
  } | null;
}

export function CertificateModal({
  open,
  onOpenChange,
  certificate,
}: CertificateModalProps) {
  if (!certificate) return null;

  const handlePrint = () => {
    window.print();
  };

  const handleShare = () => {
    navigator.clipboard?.writeText(window.location.href);
    toast.success("Tautan sertifikat berhasil disalin!");
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl p-0 overflow-hidden bg-card border-border/80 rounded-3xl">
        <DialogHeader className="p-6 pb-2 border-b border-border/60">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Award className="w-5 h-5 text-primary" />
              <DialogTitle className="text-lg font-bold">Sertifikat Kelulusan Resmi</DialogTitle>
            </div>
            <span className="font-mono text-xs text-muted-foreground">
              No: {certificate.number}
            </span>
          </div>
        </DialogHeader>

        {/* Certificate Paper Frame */}
        <div className="p-6 sm:p-8 bg-background">
          <div className="relative rounded-2xl border-4 border-double border-primary/40 bg-card p-6 sm:p-10 text-center shadow-md">
            {/* Watermark Seal */}
            <div className="absolute top-4 right-4 opacity-15 pointer-events-none">
              <ShieldCheck className="w-24 h-24 text-primary" />
            </div>

            <span className="font-mono text-xs font-bold uppercase tracking-[0.25em] text-primary">
              SERTIFIKAT KOMPETENSI
            </span>

            <h3 className="font-display text-2xl sm:text-3xl font-bold text-foreground mt-3">
              Continuum Learning Academy
            </h3>

            <p className="text-xs text-muted-foreground mt-3">Diberikan secara resmi kepada:</p>
            <p className="font-display text-xl sm:text-2xl font-bold text-foreground mt-1 border-b-2 border-primary/30 pb-2 inline-block max-w-sm">
              {certificate.studentName || "Siswa Teladan"}
            </p>

            <p className="text-xs text-muted-foreground mt-4 leading-relaxed max-w-md mx-auto">
              Atas keberhasilan dan ketekunannya dalam menyelesaikan seluruh rangkaian modul, evaluasi kuis, dan penugasan pada mata pelajaran:
            </p>

            <p className="text-base sm:text-lg font-bold text-primary mt-2">
              {certificate.courseTitle}
            </p>

            <div className="mt-8 pt-6 border-t border-border/60 flex flex-wrap items-center justify-between gap-4 text-xs font-mono text-muted-foreground">
              <div className="text-left">
                <span>Tanggal Terbit:</span>
                <p className="font-semibold text-foreground">{certificate.issueDate}</p>
              </div>
              <div className="flex items-center gap-1.5 text-success">
                <CheckCircle2 className="w-4 h-4" />
                <span className="font-semibold">Terverifikasi Digital</span>
              </div>
              <div className="text-right">
                <span>Status Kelulusan:</span>
                <p className="font-semibold text-foreground">Lulus Sempurna</p>
              </div>
            </div>
          </div>
        </div>

        {/* Action Footer */}
        <div className="p-4 bg-muted/40 border-t border-border/60 flex items-center justify-end gap-3">
          <Button variant="outline" size="sm" onClick={handleShare} className="gap-1.5 text-xs font-semibold">
            <Share2 className="w-3.5 h-3.5" />
            Bagikan
          </Button>
          <Button size="sm" onClick={handlePrint} className="gap-1.5 text-xs font-semibold">
            <Printer className="w-3.5 h-3.5" />
            Cetak / Simpan PDF
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
