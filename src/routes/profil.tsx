import { createFileRoute, redirect } from "@tanstack/react-router";

/** Editor profil kini menyatu di dashboard siswa (tab "Profil saya"). */
export const Route = createFileRoute("/profil")({
  beforeLoad: () => {
    throw redirect({ to: "/dashboard" });
  },
});
