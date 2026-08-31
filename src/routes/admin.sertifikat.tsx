import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Loader2, Award, Search, ExternalLink } from "lucide-react";
import { toast } from "sonner";
import { DashboardShell } from "@/components/DashboardShell";
import { RequireRole } from "@/components/RequireRole";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { listCertificatesForAdmin } from "@/lib/lms.functions";
import { useServerFn } from "@tanstack/react-start";

export const Route = createFileRoute("/admin/sertifikat")({
  head: () => ({
    meta: [
      { title: "Sertifikat — Admin Digisschool LMS" },
      { name: "description", content: "Lihat dan verifikasi sertifikat yang diterbitkan." },
      { property: "og:title", content: "Sertifikat — Admin Digisschool LMS" },
      { property: "og:description", content: "Daftar sertifikat santri." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: () => <RequireRole role="staff">{() => <AdminCertificates />}</RequireRole>,
});

function AdminCertificates() {
  const [certificates, setCertificates] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");
  const fetchFn = useServerFn(listCertificatesForAdmin);

  useEffect(() => {
    fetchFn()
      .then(({ certificates: data }) => setCertificates(data))
      .catch((err) => toast.error(err.message || "Gagal memuat sertifikat"))
      .finally(() => setLoading(false));
  }, []);

  const filtered = certificates.filter((c) =>
    [c.certificate_number, c.student_name, c.material_title, c.profiles?.display_name]
      .join(" ")
      .toLowerCase()
      .includes(query.toLowerCase()),
  );

  return (
    <DashboardShell role="staff" title="Sertifikat" subtitle={`${certificates.length} sertifikat diterbitkan`}>
      <div className="space-y-5">
        <div className="flex items-center gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Cari nomor, nama siswa, atau materi"
              className="pl-9"
            />
          </div>
        </div>

        {loading ? (
          <div className="flex h-64 items-center justify-center">
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
          </div>
        ) : (
          <div className="rounded-2xl border border-border/60 bg-background">
            {filtered.length === 0 ? (
              <div className="p-8 text-center text-sm text-muted-foreground">
                {query ? "Tidak ada sertifikat yang cocok." : "Belum ada sertifikat diterbitkan."}
              </div>
            ) : (
              <div className="divide-y divide-border/60">
                {filtered.map((c) => (
                  <div key={c.id} className="flex items-center justify-between gap-3 p-4">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="font-medium">{c.student_name}</p>
                        <Badge variant="outline" className="text-xs">
                          {c.certificate_number}
                        </Badge>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        {c.material_title} · Kelas {c.grade} · {c.school} · {" "}
                        {new Date(c.issued_at).toLocaleDateString("id-ID")}
                      </p>
                    </div>
                    <Button asChild size="sm" variant="outline">
                      <a href={`/sertifikat/${c.certificate_number}`} target="_blank" rel="noreferrer">
                        <ExternalLink className="mr-1 h-4 w-4" /> Lihat
                      </a>
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </DashboardShell>
  );
}
