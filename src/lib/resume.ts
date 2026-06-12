/**
 * Resume/CV upload constraints. Pure module (no server-only imports) so it can
 * be shared by the server-side Zod schema and the client-side form.
 */
export const MAX_RESUME_BYTES = 5 * 1024 * 1024; // 5 MB

export const ALLOWED_RESUME_MIME_TYPES = [
  "application/pdf",
  "application/msword", // .doc
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document", // .docx
] as const;

/** Value for an <input type="file"> accept attribute. */
export const RESUME_ACCEPT = ".pdf,.doc,.docx";
