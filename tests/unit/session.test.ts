import { describe, expect, it } from "vitest";
import { signSession, verifySessionToken } from "@/server/auth/session";

describe("session tokens", () => {
  it("round-trips a signed session", async () => {
    const token = await signSession({ userId: "user-1", role: "ATTORNEY" });
    const payload = await verifySessionToken(token);
    expect(payload).toEqual({ userId: "user-1", role: "ATTORNEY" });
  });

  it("returns null for an undefined token", async () => {
    expect(await verifySessionToken(undefined)).toBeNull();
  });

  it("returns null for a tampered/invalid token", async () => {
    const token = await signSession({ userId: "user-1", role: "ATTORNEY" });
    expect(await verifySessionToken(`${token}tampered`)).toBeNull();
    expect(await verifySessionToken("not.a.jwt")).toBeNull();
  });
});
