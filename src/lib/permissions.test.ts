import { describe, expect, it } from "vitest";

import { can } from "@/lib/permissions";

describe("permissões", () => {
  it("ADMIN pode tudo", () => {
    for (const permission of [
      "product:write",
      "product:delete",
      "stock:move",
      "location:manage",
      "company:manage",
      "users:manage",
    ] as const) {
      expect(can("ADMIN", permission)).toBe(true);
    }
  });

  it("MEMBER opera produtos e estoque, mas não administra", () => {
    expect(can("MEMBER", "product:write")).toBe(true);
    expect(can("MEMBER", "stock:move")).toBe(true);
    expect(can("MEMBER", "product:delete")).toBe(false);
    expect(can("MEMBER", "location:manage")).toBe(false);
    expect(can("MEMBER", "company:manage")).toBe(false);
    expect(can("MEMBER", "users:manage")).toBe(false);
  });
});
