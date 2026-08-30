import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { z } from "zod";

const createSchema = z.object({
  email: z.string().trim().email().max(255),
  password: z.string().min(6).max(72),
  fullName: z.string().trim().min(1).max(100),
  grade: z.number().int().min(7).max(9).nullable().optional(),
  phone: z.string().trim().max(30).optional(),
  school: z.string().trim().max(120).optional(),
  notes: z.string().trim().max(500).optional(),
  role: z.enum(["student", "guru", "admin"]).default("student"),
});

const updateSchema = z.object({
  userId: z.string().uuid(),
  email: z.string().trim().email().max(255).optional(),
  password: z.string().min(6).max(72).optional().or(z.literal("")),
});

const deleteSchema = z.object({ userId: z.string().uuid() });

async function isAdmin(context: { supabase: any; userId: string }) {
  const { data, error } = await context.supabase.rpc("has_role", {
    _user_id: context.userId,
    _role: "admin",
  });
  if (error) throw error;
  return !!data;
}

async function assertAdmin(context: { supabase: any; userId: string }) {
  if (!(await isAdmin(context))) throw new Error("Forbidden");
}

/** Admin or guru. Returns true when the caller is an administrator. */
async function assertStaff(context: { supabase: any; userId: string }) {
  const { data, error } = await context.supabase.rpc("is_staff", { _user_id: context.userId });
  if (error) throw error;
  if (!data) throw new Error("Forbidden");
  return await isAdmin(context);
}

export const createStudentAccount = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => createSchema.parse(input))
  .handler(async ({ data, context }) => {
    const callerIsAdmin = await assertStaff(context as any);
    // Only administrators may grant elevated roles.
    const targetRole = callerIsAdmin ? data.role : "student";
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const { data: created, error } = await supabaseAdmin.auth.admin.createUser({
      email: data.email,
      password: data.password,
      email_confirm: true,
      user_metadata: {
        full_name: data.fullName,
        grade: data.grade ?? null,
        phone: data.phone ?? null,
        school: data.school ?? null,
      },
    });
    if (error) throw new Error(error.message);
    const user = created.user;
    if (!user) throw new Error("Gagal membuat akun");

    const { error: profileError } = await supabaseAdmin.from("profiles").upsert(
      {
        id: user.id,
        display_name: data.fullName,
        email: data.email,
        grade: data.grade ?? null,
        phone: data.phone ?? null,
        school: data.school ?? null,
        notes: data.notes ?? null,
        status: "active",
      },
      { onConflict: "id" },
    );
    if (profileError) throw new Error(profileError.message);

    await supabaseAdmin.from("user_roles").delete().eq("user_id", user.id);
    const { error: roleError } = await supabaseAdmin
      .from("user_roles")
      .insert({ user_id: user.id, role: targetRole });
    if (roleError) throw new Error(roleError.message);

    return { ok: true as const, userId: user.id };
  });

export const updateStudentCredentials = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => updateSchema.parse(input))
  .handler(async ({ data, context }) => {
    await assertStaff(context as any);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const payload: { email?: string; password?: string } = {};
    if (data.email) payload.email = data.email;
    if (data.password) payload.password = data.password;
    if (Object.keys(payload).length === 0) return { ok: true as const };

    const { error } = await supabaseAdmin.auth.admin.updateUserById(data.userId, payload);
    if (error) throw new Error(error.message);

    if (data.email) {
      await supabaseAdmin.from("profiles").update({ email: data.email }).eq("id", data.userId);
    }
    return { ok: true as const };
  });

export const deleteStudentAccount = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => deleteSchema.parse(input))
  .handler(async ({ data, context }) => {
    await assertAdmin(context as any);
    if (data.userId === context.userId) throw new Error("Tidak bisa menghapus akun sendiri");
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin.auth.admin.deleteUser(data.userId);
    if (error) throw new Error(error.message);
    return { ok: true as const };
  });
