import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

// Run with a locally minted platform-admin session; never print session contents.
const sessionPath = process.env['MEMBER_TEST_SESSION_FILE'];
const url = process.env['SUPABASE_URL'];
const key = process.env['SUPABASE_PUBLISHABLE_KEY'];

describe.skipIf(!sessionPath || !url || !key)("Platform administrator team visibility", () => {
  const companyId = "50ded111-f709-496a-9f31-fd0e5e93541d";
  const memberId = "0a4e8f3c-f8d0-4da6-acd6-10ed98d1f004";

  async function members(authenticated: boolean) {
    if (!sessionPath || !url || !key) throw new Error("Integration test configuration missing");
    const headers: Record<string, string> = { apikey: key };
    if (authenticated) {
      const { session } = JSON.parse(readFileSync(sessionPath, "utf8"));
      headers['Authorization'] = `Bearer ${session.access_token}`;
    }
    return fetch(`${url}/rest/v1/company_roles?select=user_id,company_id,role&company_id=eq.${companyId}`, { headers });
  }

  it("lets the platform administrator read the operator registered with Rogerio Transportes", async () => {
    const response = await members(true);
    expect(response.status).toBe(200);
    expect(await response.json()).toEqual(expect.arrayContaining([
      expect.objectContaining({ user_id: memberId, company_id: companyId, role: "operator" }),
    ]));
  });

  it("does not expose that company's membership to anonymous visitors", async () => {
    const response = await members(false);
    if (response.ok) expect(await response.json()).toEqual([]);
    else expect([401, 403]).toContain(response.status);
  });
});