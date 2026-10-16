import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

async function resolveCompanyId(ctx: { supabase: any }, companyId?: string) {
  if (companyId) return companyId;
  const { data } = await ctx.supabase.rpc("current_company_id");
  if (!data) throw new Error("Sem transportadora");
  return data as string;
}

async function assertCanManage(ctx: { supabase: any }, companyId: string) {
  const { data: owner } = await ctx.supabase.rpc("is_company_owner", { _company_id: companyId });
  if (owner) return;
  const { data: platform } = await ctx.supabase.rpc("is_platform_admin");
  if (!platform) throw new Error("Sem permissão");
}

export const listUsers = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d?: { companyId?: string }) => d ?? {})
  .handler(async ({ data, context }) => {
    const companyId = await resolveCompanyId(context, data.companyId);
    await assertCanManage(context, companyId);
    const { data: members, error } = await context.supabase
      .from("company_roles").select("user_id,approved,role").eq("company_id", companyId);
    if (error) throw new Error(error.message);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    return Promise.all((members ?? []).map(async (m: any) => {
      const { data: u, error: ue } = await supabaseAdmin.auth.admin.getUserById(m.user_id);
      if (ue) throw new Error(ue.message);
      return { id: m.user_id, email: u.user.email ?? "", created_at: u.user.created_at,
        confirmed: Boolean(u.user.email_confirmed_at), isAdmin: m.approved, isOwner: m.role === "owner" };
    }));
  });

export const setAdmin = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { userId: string; admin: boolean; companyId?: string }) => d)
  .handler(async ({ data, context }) => {
    const companyId = await resolveCompanyId(context, data.companyId);
    const { error } = await context.supabase.rpc("set_member_access", {
      _user_id: data.userId, _company_id: companyId, _approved: data.admin,
    });
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const deleteMember = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { userId: string; companyId?: string }) => d)
  .handler(async ({ data, context }) => {
    const companyId = await resolveCompanyId(context, data.companyId);
    const { error } = await context.supabase.rpc("delete_member", {
      _user_id: data.userId, _company_id: companyId,
    });
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const createMember = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { email: string; password: string; companyId?: string }) => {
    const email = String(d.email ?? "").trim().toLowerCase();
    if (!/^\S+@\S+\.\S+$/.test(email)) throw new Error("E-mail inválido");
    if (String(d.password ?? "").length < 6) throw new Error("A senha precisa ter pelo menos 6 caracteres");
    return { email, password: String(d.password), companyId: d.companyId };
  })
  .handler(async ({ data, context }) => {
    const companyId = await resolveCompanyId(context, data.companyId);
    await assertCanManage(context, companyId);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: created, error } = await supabaseAdmin.auth.admin.createUser({
      email: data.email, password: data.password, email_confirm: true,
    });
    if (error || !created.user) {
      throw new Error(/already|registered|exists/i.test(error?.message ?? "") ? "Esse e-mail já possui cadastro" : "Não foi possível criar o usuário");
    }
    const { error: re } = await supabaseAdmin.from("company_roles").insert({
      company_id: companyId, user_id: created.user.id, role: "operator", approved: true,
    });
    if (re) {
      await supabaseAdmin.auth.admin.deleteUser(created.user.id);
      throw new Error("Não foi possível vincular o usuário à transportadora");
    }
    return { ok: true };
  });

export const deleteCompany = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { companyId: string }) => d)
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase.rpc("delete_company", { _id: data.companyId });
    if (error) throw new Error(error.message);
    return { ok: true };
  });
