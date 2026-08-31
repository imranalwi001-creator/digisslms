import { createServerFn } from "@tanstack/react-start";

export const ADMIN_EMAIL = "admin@continuum.lms";

/**
 * Idempotent bootstrap: makes sure the built-in administrator account exists
 * and holds the admin role. Never returns credentials.
 */
export const ensureAdminAccount = createServerFn({ method: "POST" }).handler(async () => {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

  const password =
    (typeof process !== "undefined" && process.env?.["ADMIN_BOOTSTRAP_PASSWORD"]) || "bissmillah";

  try {
    const { data: list, error: listError } = await supabaseAdmin.auth.admin.listUsers({
      page: 1,
      perPage: 1000,
    });
    if (!listError && list?.users) {
      let user = list.users.find((u) => u.email?.toLowerCase() === ADMIN_EMAIL);

      if (!user) {
        const { data, error } = await supabaseAdmin.auth.admin.createUser({
          email: ADMIN_EMAIL,
          password,
          email_confirm: true,
          user_metadata: { full_name: "Administrator" },
        });
        if (!error && data?.user) {
          user = data.user;
        }
      } else {
        await supabaseAdmin.auth.admin.updateUserById(user.id, {
          password,
          email_confirm: true,
        });
      }

      if (user) {
        await supabaseAdmin
          .from("user_roles")
          .upsert({ user_id: user.id, role: "admin" }, { onConflict: "user_id,role" });
      }
    }
  } catch (err: any) {
    console.warn("[Admin Setup] ensureAdminAccount non-fatal warning:", err?.message);
  }

  return { ok: true as const };
});
