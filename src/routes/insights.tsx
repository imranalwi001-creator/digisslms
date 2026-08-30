import { createFileRoute, redirect } from "@tanstack/react-router";

/** Progres kini menyatu di dashboard siswa (tab "Progres"). */
export const Route = createFileRoute("/insights")({
  beforeLoad: () => {
    throw redirect({ to: "/dashboard" });
  },
});
