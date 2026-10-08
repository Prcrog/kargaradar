export type CompanyAccess = { companyId: string | null; approved: boolean; status: string | null };
export function canUseCompany(access: CompanyAccess) {
  return Boolean(access.companyId && access.approved && access.status === "approved");
}