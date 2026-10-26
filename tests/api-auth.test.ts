import { describe, expect, it } from "vitest";
import { getAdminApiStatus } from "@/lib/api-auth";

describe("admin API authorization status", () => {
  it("returns a JSON-ready 401 for unauthenticated sessions", () => {
    expect(getAdminApiStatus(null)).toBe(401);
  });
  it("prevents VIEWER accounts from modifying trips or images", () => {
    expect(getAdminApiStatus("VIEWER", ["ADMIN","EDITOR"])).toBe(403);
  });
  it("allows authorized editors, admin and view-only routes", () => {
    expect(getAdminApiStatus("ADMIN", ["ADMIN","EDITOR"])).toBe(200);
    expect(getAdminApiStatus("EDITOR", ["ADMIN","EDITOR"])).toBe(200);
    expect(getAdminApiStatus("VIEWER")).toBe(200);
  });
});
