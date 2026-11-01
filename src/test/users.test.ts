import { beforeEach, describe, expect, it, vi } from "vitest";
const { rpc, signup, createClient } = vi.hoisted(() => ({ rpc: vi.fn(), signup: vi.fn(), createClient: vi.fn() }));
vi.mock("@/integrations/supabase/client", () => ({ supabase: { rpc } }));
vi.mock("@supabase/supabase-js", () => ({ createClient }));
import { createMember, listUsers, setAdmin, deleteMember, deleteCompany } from "@/lib/users";

beforeEach(() => {
  vi.resetAllMocks();
  createClient.mockReturnValue({ auth: { signUp: signup } });
});

describe("Direct member management", () => {
  it("lists only the requested company's members through the protected RPC", async () => {
    rpc.mockResolvedValue({ data: [{ id: "operator", isOwner: false }], error: null });
    expect(await listUsers({ companyId: "company-a" })).toEqual([{ id: "operator", isOwner: false }]);
    expect(rpc).toHaveBeenCalledWith("list_company_members", { _company_id: "company-a" });
  });
  it("blocks and releases the selected member", async () => {
    rpc.mockResolvedValue({ error: null });
    await setAdmin({ userId: "operator", companyId: "company-a", admin: false });
    expect(rpc).toHaveBeenLastCalledWith("set_member_access", { _user_id: "operator", _company_id: "company-a", _approved: false });
    await setAdmin({ userId: "operator", companyId: "company-a", admin: true });
    expect(rpc).toHaveBeenLastCalledWith("set_member_access", { _user_id: "operator", _company_id: "company-a", _approved: true });
  });
  it("removes membership using the company-scoped protected RPC", async () => {
    rpc.mockResolvedValue({ error: null });
    await deleteMember({ userId: "operator", companyId: "company-a" });
    expect(rpc).toHaveBeenCalledWith("delete_member", { _user_id: "operator", _company_id: "company-a" });
  });
  it("propagates authorization failures", async () => {
    rpc.mockResolvedValue({ error: { message: "Sem permissão" } });
    await expect(listUsers({ companyId: "other-company" })).rejects.toThrow("Sem permissão");
  });
  it("keeps existing accounts' passwords unchanged", async () => {
    rpc.mockResolvedValue({ data: { existing: true }, error: null });
    await createMember({ email: " MEMBER@EXAMPLE.COM ", password: "abcdef", companyId: "company-a" });
    expect(rpc).toHaveBeenCalledWith("prepare_company_member", { _email: "member@example.com", _company_id: "company-a" });
    expect(createClient).not.toHaveBeenCalled();
  });
  it("creates new accounts through an isolated client with an authorized ticket", async () => {
    rpc.mockResolvedValue({ data: { existing: false, ticket: "one-use-ticket" }, error: null });
    signup.mockResolvedValue({ data: { user: { id: "new-member", identities: [{}] } }, error: null });
    await createMember({ email: "member@example.com", password: "abcdef", companyId: "company-a" });
    expect(createClient.mock.calls[0][2]).toEqual({ auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false } });
    expect(signup).toHaveBeenCalledWith(expect.objectContaining({ options: expect.objectContaining({ data: { company_registration_ticket: "one-use-ticket" } }) }));
  });
  it("requires at least six password characters", async () => {
    await expect(createMember({ email: "member@example.com", password: "12345" })).rejects.toThrow("6 caracteres");
    expect(rpc).not.toHaveBeenCalled();
  });
  it("deletes companies through the existing authorized RPC", async () => {
    rpc.mockResolvedValue({ error: null });
    await deleteCompany({ companyId: "company-a" });
    expect(rpc).toHaveBeenCalledWith("delete_company", { _id: "company-a" });
  });
});