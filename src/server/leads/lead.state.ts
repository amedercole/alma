import { LeadState } from "@/generated/prisma/client";
import { ConflictError } from "@/lib/errors";

/**
 * Lead lifecycle state machine.
 *
 * A lead starts as PENDING and can only move forward to REACHED_OUT (set
 * manually by an attorney). REACHED_OUT is terminal. Centralizing the allowed
 * transitions here keeps the rule in one place and makes invalid moves
 * (e.g. reverting to PENDING, or re-reaching-out) explicit failures.
 */
const ALLOWED_TRANSITIONS: Record<LeadState, readonly LeadState[]> = {
  [LeadState.PENDING]: [LeadState.REACHED_OUT],
  [LeadState.REACHED_OUT]: [],
};

export function canTransition(from: LeadState, to: LeadState): boolean {
  return ALLOWED_TRANSITIONS[from].includes(to);
}

/** Throws a 409 ConflictError if the transition is not allowed. */
export function assertTransition(from: LeadState, to: LeadState): void {
  if (!canTransition(from, to)) {
    throw new ConflictError(`Cannot transition lead from ${from} to ${to}`);
  }
}
