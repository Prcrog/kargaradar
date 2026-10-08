import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export const listUsers = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data: companyId } = await context.supabase.rpc("current_company_id");
    if (!companyId) throw new Error("Sem transportadora");
    const { data: owner } = await context.supabase.rpc("is_company_owner", { _company_id: companyId });
    if (!owner) throw new Error("Sem permissão");
    const { data: members, error: memberError } = await context.supabase.from("company_roles").select("user_id,approved,role").eq("company_id", companyId);
    if (memberError) throw new Error(memberError.message);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    return Promise.all((members ?? []).map(async (m) => {
      const { data, error } = await supabaseAdmin.auth.admin.getUserById(m.user_id);
      if (error) throw new Error(error.message);
      return { id: m.user_id, email: data.user.email ?? "", created_at: data.user.created_at,
        confirmed: Boolean(data.user.email_confirmed_at), isAdmin: m.approved, isOwner: m.role === "owner" };
    }));
  });

export const setAdmin = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { userId: string; admin: boolean }) => d)
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase.rpc("set_member_access", { _user_id: data.userId, _approved: data.admin });
    if (error) throw new Error(error.message);
    return { ok: true };
  });
