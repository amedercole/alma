import { describe, expect, it } from "vitest";
import { MAX_RESUME_BYTES } from "@/lib/resume";
import {
  createLeadSchema,
  listLeadsQuerySchema,
  updateLeadSchema,
} from "@/server/leads/lead.schema";

function pdf(name = "resume.pdf", size = 1024): File {
  return new File([new Uint8Array(size)], name, { type: "application/pdf" });
}

describe("createLeadSchema", () => {
  it("accepts valid input", () => {
    const result = createLeadSchema.safeParse({
      firstName: "Ada",
      lastName: "Lovelace",
      email: "ada@example.com",
      resume: pdf(),
    });
    expect(result.success).toBe(true);
  });

  it("trims and requires names", () => {
    const result = createLeadSchema.safeParse({
      firstName: "   ",
      lastName: "Lovelace",
      email: "ada@example.com",
      resume: pdf(),
    });
    expect(result.success).toBe(false);
  });

  it("rejects an invalid email", () => {
    const result = createLeadSchema.safeParse({
      firstName: "Ada",
      lastName: "Lovelace",
      email: "not-an-email",
      resume: pdf(),
    });
    expect(result.success).toBe(false);
  });

  it("rejects a missing resume", () => {
    const result = createLeadSchema.safeParse({
      firstName: "Ada",
      lastName: "Lovelace",
      email: "ada@example.com",
      resume: null,
    });
    expect(result.success).toBe(false);
  });

  it("rejects an oversized resume", () => {
    const result = createLeadSchema.safeParse({
      firstName: "Ada",
      lastName: "Lovelace",
      email: "ada@example.com",
      resume: pdf("big.pdf", MAX_RESUME_BYTES + 1),
    });
    expect(result.success).toBe(false);
  });

  it("rejects a disallowed file type", () => {
    const png = new File([new Uint8Array(10)], "x.png", { type: "image/png" });
    const result = createLeadSchema.safeParse({
      firstName: "Ada",
      lastName: "Lovelace",
      email: "ada@example.com",
      resume: png,
    });
    expect(result.success).toBe(false);
  });
});

describe("listLeadsQuerySchema", () => {
  it("accepts a valid state", () => {
    expect(listLeadsQuerySchema.parse({ state: "PENDING" }).state).toBe(
      "PENDING",
    );
  });
  it("accepts an absent state", () => {
    expect(listLeadsQuerySchema.parse({}).state).toBeUndefined();
  });
  it("rejects an unknown state", () => {
    expect(listLeadsQuerySchema.safeParse({ state: "NOPE" }).success).toBe(
      false,
    );
  });
});

describe("updateLeadSchema", () => {
  it("requires a valid state", () => {
    expect(updateLeadSchema.safeParse({ state: "REACHED_OUT" }).success).toBe(
      true,
    );
    expect(updateLeadSchema.safeParse({ state: "X" }).success).toBe(false);
  });
});
