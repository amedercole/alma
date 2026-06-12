import { describe, expect, it } from "vitest";
import { LeadState } from "@/generated/prisma/client";
import { ConflictError } from "@/lib/errors";
import { assertTransition, canTransition } from "@/server/leads/lead.state";

describe("lead state machine", () => {
  it("allows PENDING -> REACHED_OUT", () => {
    expect(canTransition(LeadState.PENDING, LeadState.REACHED_OUT)).toBe(true);
  });

  it("disallows staying PENDING -> PENDING", () => {
    expect(canTransition(LeadState.PENDING, LeadState.PENDING)).toBe(false);
  });

  it("disallows reverting REACHED_OUT -> PENDING", () => {
    expect(canTransition(LeadState.REACHED_OUT, LeadState.PENDING)).toBe(false);
  });

  it("disallows re-reaching-out REACHED_OUT -> REACHED_OUT", () => {
    expect(canTransition(LeadState.REACHED_OUT, LeadState.REACHED_OUT)).toBe(
      false,
    );
  });

  it("assertTransition throws ConflictError on invalid transition", () => {
    expect(() =>
      assertTransition(LeadState.REACHED_OUT, LeadState.REACHED_OUT),
    ).toThrow(ConflictError);
  });

  it("assertTransition does not throw on valid transition", () => {
    expect(() =>
      assertTransition(LeadState.PENDING, LeadState.REACHED_OUT),
    ).not.toThrow();
  });
});
