import { describe, expect, it } from "vitest";
import { z } from "zod";
import {
  ConflictError,
  NotFoundError,
  UnauthorizedError,
  errorToResponse,
} from "@/lib/errors";

describe("errorToResponse", () => {
  it("maps AppError to its status and code", async () => {
    const res = errorToResponse(new NotFoundError("Lead not found"));
    expect(res.status).toBe(404);
    const body = await res.json();
    expect(body.error.code).toBe("NOT_FOUND");
    expect(body.error.message).toBe("Lead not found");
  });

  it("maps UnauthorizedError to 401", () => {
    expect(errorToResponse(new UnauthorizedError()).status).toBe(401);
  });

  it("maps ConflictError to 409", () => {
    expect(errorToResponse(new ConflictError()).status).toBe(409);
  });

  it("maps ZodError to 400 with field details", async () => {
    const schema = z.object({ email: z.email() });
    const parsed = schema.safeParse({ email: "bad" });
    expect(parsed.success).toBe(false);
    if (parsed.success) return;
    const res = errorToResponse(parsed.error);
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error.code).toBe("VALIDATION_ERROR");
    expect(body.error.details.email).toBeDefined();
  });

  it("maps unknown errors to a 500 without leaking details", async () => {
    const res = errorToResponse(new Error("secret internal detail"));
    expect(res.status).toBe(500);
    const body = await res.json();
    expect(body.error.code).toBe("INTERNAL_ERROR");
    expect(JSON.stringify(body)).not.toContain("secret internal detail");
  });
});
