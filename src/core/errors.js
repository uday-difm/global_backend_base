import { ZodError } from "zod";

// ---------------------------------------------------------------------------
// Standard response helpers — all API routes must use these for consistency.
// Shape: { data: any, meta: object, error: null }
// ---------------------------------------------------------------------------

/**
 * Wrap a single item or named object in the standard envelope.
 * @param {any} data — the payload (object, array, or primitive)
 * @param {object} meta — optional metadata (pagination, counts, etc.)
 */
export function apiSuccess(data, meta = {}) {
  return { success: true, data, meta, error: null };
}

/**
 * Wrap a list of items with pagination metadata.
 * @param {Array} items — the list
 * @param {object} meta — must include at minimum { total }
 */
export function apiList(items, meta = {}) {
  return { data: items, meta, error: null };
}

// ---------------------------------------------------------------------------
// Error classes
// ---------------------------------------------------------------------------

export class AppError extends Error {
  constructor(message, code = "INTERNAL_ERROR", status = 500, details = null) {
    super(message);
    this.name = this.constructor.name;
    this.code = code;
    this.status = status;
    this.details = details;
    Error.captureStackTrace(this, this.constructor);
  }
}

export class ValidationError extends AppError {
  constructor(details = null) {
    super("Validation failed", "VALIDATION_ERROR", 400, details);
  }
}

export class NotFoundError extends AppError {
  constructor(resource = "Resource") {
    super(`${resource} not found`, "NOT_FOUND", 404);
  }
}

export class UnauthorizedError extends AppError {
  constructor(message = "Unauthorized") {
    super(message, "UNAUTHORIZED", 401);
  }
}

export class ForbiddenError extends AppError {
  constructor(message = "Forbidden: Insufficient permissions") {
    super(message, "FORBIDDEN", 403);
  }
}

export function handleApiError(err) {
  console.error("API Error encountered:", err);

  if (err instanceof AppError) {
    return Response.json(
      {
        success: false,
        error: err.message,
        code: err.code,
        details: err.details,
      },
      { status: err.status },
    );
  }

  if (err instanceof ZodError) {
    return Response.json(
      {
        success: false,
        error: "Validation failed",
        code: "VALIDATION_ERROR",
        details: err.issues || err.errors,
      },
      { status: 400 },
    );
  }

  return Response.json(
    {
      success: false,
      error: "Internal Server Error",
      code: "SERVER_ERROR",
      message: err.message || String(err),
    },
    { status: 500 },
  );
}
