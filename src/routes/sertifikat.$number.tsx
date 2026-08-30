import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Loader2, Award, CheckCircle, XCircle, AlertCircle } from "lucide-react";
import { getCertificateByNumber } from "@/lib/lms.functions";
import { useServerFn } from "@tanstack/react-start";
import { Button } from "@/components/ui/button";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";

export const Route = createFileRoute("/sertifikat/$number")({
  head: () => ({
    meta: [
      { title: "Verifikasi Sertifikat — Continuum LMS" },
      { name: "description", content: "Verifikasi keaslian sertifikat digital Continuum LMS." },
      { property: "og:title", content: "Verifikasi Sertifikat — Continuum LMS" },
      { property: "og:description", content: "Verifikasi keaslian sertifikat digital." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: CertificateVerificationPage,
});

function CertificateVerificationPage() {
  const { number } = Route.useParams();
  const [result, setResult] = useState<{ certificate: any } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const verify = useServerFn(getCertificateByNumber);

  useEffect(() => {
    verify({ data: { number } })
      .then((res) => setResult(res as any))
      .catch((err) => setError(err.message || "Sertifikat tidak ditemukan"))
      .finally(() => setLoading(false));
  }, [number]);

  const meta = result?.certificate?.metadata || {};

  return (
    <div className="min-h-screen flex flex-col bg-muted/30">
      <SiteHeader />
      <main className="flex-1 flex items-center justify-center px-5 py-24">
        <div className="w-full max-w-2xl">
          <div className="rounded-3xl border border-border/60 bg-background p-8 shadow-2xl md:p-12">
            {loading ? (
              <div className="flex h-48 flex-col items-center justify-center gap-3">
                <Loader2 className="h-6 w-6 animate-spin text-primary" />
                <p className="text-sm text-muted-foreground">Memverifikasi sertifikat...</p>
              </div>
            ) : error ? (
              <div className="text-center">
                <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-destructive/10">
                  <XCircle className="h-8 w-8 text-destructive" />
                </div>
                <h1 className="text-2xl font-bold tracking-tight">Sertifikat tidak ditemukan</h1>
                <p className="mt-2 text-sm text-muted-foreground">Nomor sertifikat yang Anda masukkan tidak terdaftar dalam sistem.</p>
              </div>
            ) : (
              <div className="text-center">
                <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-emerald-500/10">
                  <CheckCircle className="h-8 w-8 text-emerald-500" />
                </div>
                <p className="text-sm font-medium text-primary">Terverifikasi</p>
                <h1 className="mt-1 text-2xl font-bold tracking-tight">Sertifikat Digital Resmi</h1>
                <p className="mx-auto mt-3 max-w-md text-sm text-muted-foreground">
                  Sertifikat ini diterbitkan oleh Continuum LMS dan dapat diverifikasi secara publik.
                </p>

                <div className="mt-8 space-y-3 rounded-2xl bg-muted/40 p-5 text-left">
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Diberikan kepada</span>
                    <span className="font-medium">{meta.student_name || "—"}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Materi</span>
                    <span className="font-medium">{result?.certificate?.materialTitle || meta.material_title || "—"}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Mata pelajaran</span>
                    <span className="font-medium">{meta.material_subject || "—"}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Kelas</span>
                    <span className="font-medium">{meta.material_grade || "—"}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Sekolah</span>
                    <span className="font-medium">{meta.student_school || "—"}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Tanggal terbit</span>
                    <span className="font-medium">
                      {result?.certificate?.issued_at
                        ? new Date(result.certificate.issued_at).toLocaleDateString("id-ID", { dateStyle: "long" })
                        : "—"}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Nomor sertifikat</span>
                    <span className="font-mono text-sm font-medium">{result?.certificate?.certificate_number}</span>
                  </div>
                </div>

                <div className="mt-8 flex items-center justify-center gap-3">
                  <Button onClick={() => window.print()}>
                    <Award className="mr-2 h-4 w-4" /> Cetak sertifikat
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}
