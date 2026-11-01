import { createClient } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";

export async function listUsers({ companyId }: { companyId?: string } = {}) {
  const { data, error } = await supabase.rpc("list_company_members", { _company_id: companyId });
  if (error) throw new Error(error.message);
  return data ?? [];
}

async function resolveCompanyId(companyId?: string) {
  if (companyId) return companyId;
  const { data, error } = await supabase.rpc("current_company_id");
  if (error) throw new Error(error.message);
  if (!data) throw new Error("Sem transportadora");
  return data;
}

export async function setAdmin({ userId, admin, companyId }: { userId: string; admin: boolean; companyId?: string }) {
  const { error } = await supabase.rpc("set_member_access", {
    _user_id: userId, _company_id: await resolveCompanyId(companyId), _approved: admin,
  });
  if (error) throw new Error(error.message);
}

export async function deleteMember({ userId, companyId }: { userId: string; companyId?: string }) {
  const { error } = await supabase.rpc("delete_member", {
    _user_id: userId, _company_id: await resolveCompanyId(companyId),
  });
  if (error) throw new Error(error.message);
}

export async function deleteCompany({ companyId }: { companyId: string }) {
  const { error } = await supabase.rpc("delete_company", { _id: companyId });
  if (error) throw new Error(error.message);
}

export async function createMember({ email, password, companyId }: { email: string; password: string; companyId?: string }) {
  const normalizedEmail = email.trim().toLowerCase();
  if (!/^\S+@\S+\.\S+$/.test(normalizedEmail)) throw new Error("E-mail inválido");
  if (password.length < 6) throw new Error("A senha precisa ter pelo menos 6 caracteres");
  const { data, error } = await supabase.rpc("prepare_company_member", { _email: normalizedEmail, _company_id: companyId });
  if (error) throw new Error(error.message);
  if (!data || typeof data !== "object" || Array.isArray(data)) throw new Error("Não foi possível preparar o cadastro");
  if (data.existing === true) return { existing: true };
  if (typeof data.ticket !== "string") throw new Error("Não foi possível autorizar o cadastro");

  // A separate, non-persistent client must never replace the owner's session.
  const registrationClient = createClient<Database>(
    import.meta.env.VITE_SUPABASE_URL,
    import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
    { auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false } },
  );
  const { data: signup, error: signupError } = await registrationClient.auth.signUp({
    email: normalizedEmail, password,
    options: {
      emailRedirectTo: `${window.location.origin}/auth`,
      data: { company_registration_ticket: data.ticket },
    },
  });
  if (signupError) throw new Error(signupError.message);
  if (!signup.user || signup.user.identities?.length === 0) throw new Error("Não foi possível cadastrar esse e-mail. Tente novamente.");
  return { existing: false };
}