export type CompanyAccess = { companyId: string | null; approved: boolean; status: string | null };
export function canUseCompany(access: CompanyAccess) {
  return Boolean(access.companyId && access.approved && access.status === "approved");
}
export type PlanFeatures = { whatsapp: boolean; team: boolean; excel: boolean };
export function planFeatures(plan: string | null | undefined): PlanFeatures {
  if (plan === "completo") return { whatsapp: true, team: true, excel: true };
  if (plan === "profissional") return { whatsapp: true, team: true, excel: false };
  return { whatsapp: false, team: false, excel: false };
}
