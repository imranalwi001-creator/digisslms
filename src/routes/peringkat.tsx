import { createFileRoute, redirect } from "@tanstack/react-router";

/** Papan peringkat kini menyatu di dashboard siswa (tab "Peringkat"). */
export const Route = createFileRoute("/peringkat")({
  beforeLoad: () => {
    throw redirect({ to: "/dashboard" });
  },
});
