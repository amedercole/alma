import { z } from "zod";

/**
 * Application error hierarchy. Each error carries the HTTP status and a stable
 * machine-readable `code` so route handlers can map any thrown error to a
 * consistent JSON response in one place (`errorToResponse`).
 */
export class AppError extends Error {
  constructor(
    message: string,
    readonly status: number,
    readonly code: string,
    readonly details?: unknown,
  ) {
    super(message);
    this.name = new.target.name;
  }
}

export class ValidationError extends AppError {
  constructor(message = "Validation failed", details?: unknown) {
    super(message, 400, "VALIDATION_ERROR", details);
  }
}

export class UnauthorizedError extends AppError {
  constructor(message = "Authentication required") {
    super(message, 401, "UNAUTHORIZED");
  }
}

export class ForbiddenError extends AppError {
  constructor(message = "Forbidden") {
    super(message, 403, "FORBIDDEN");
  }
}

export class NotFoundError extends AppError {
  constructor(message = "Not found") {
    super(message, 404, "NOT_FOUND");
  }
}

export class ConflictError extends AppError {
  constructor(message = "Conflict") {
    super(message, 409, "CONFLICT");
  }
}

/** Shape of the JSON body returned for any error. */
export interface ErrorBody {
  error: { code: string; message: string; details?: unknown };
}

/**
 * Converts any thrown value into a JSON `Response`. Zod errors become 400s with
 * field-level details; known `AppError`s use their status; anything else is a
 * 500 that does not leak internals.
 */
export function errorToResponse(error: unknown): Response {
  if (error instanceof z.ZodError) {
    return Response.json(
      {
        error: {
          code: "VALIDATION_ERROR",
          message: "Validation failed",
          details: z.flattenError(error).fieldErrors,
        },
      } satisfies ErrorBody,
      { status: 400 },
    );
  }

  if (error instanceof AppError) {
    return Response.json(
      {
        error: {
          code: error.code,
          message: error.message,
          details: error.details,
        },
      } satisfies ErrorBody,
      { status: error.status },
    );
  }

  console.error("Unhandled error:", error);
  return Response.json(
    {
      error: { code: "INTERNAL_ERROR", message: "Internal server error" },
    } satisfies ErrorBody,
    { status: 500 },
  );
}
