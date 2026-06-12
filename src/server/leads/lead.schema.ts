import { z } from "zod";
import { LeadState } from "@/generated/prisma/client";

/**
 * Validation schemas for lead inputs. Pure (only depends on Zod), so these can
 * be shared with client components for matching front-end validation.
 */

export const MAX_RESUME_BYTES = 5 * 1024 * 1024; // 5 MB

export const ALLOWED_RESUME_MIME_TYPES = [
  "application/pdf",
  "application/msword", // .doc
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document", // .docx
] as const;

/** File constraints for an uploaded resume/CV. */
export const resumeFileSchema = z
  .instanceof(File, { message: "A resume/CV file is required" })
  .refine((file) => file.size > 0, "A resume/CV file is required")
  .refine(
    (file) => file.size <= MAX_RESUME_BYTES,
    "Resume must be 5 MB or smaller",
  )
  .refine(
    (file) =>
      (ALLOWED_RESUME_MIME_TYPES as readonly string[]).includes(file.type),
    "Resume must be a PDF, DOC, or DOCX file",
  );

/** Text fields of the public lead form. */
export const leadDetailsSchema = z.object({
  firstName: z.string().trim().min(1, "First name is required").max(100),
  lastName: z.string().trim().min(1, "Last name is required").max(100),
  email: z.email("A valid email is required").max(255),
});

/** Full create-lead input including the resume file (server-side). */
export const createLeadSchema = leadDetailsSchema.extend({
  resume: resumeFileSchema,
});

export type LeadDetailsInput = z.infer<typeof leadDetailsSchema>;
export type CreateLeadInput = z.infer<typeof createLeadSchema>;

/** Query params for listing leads (dashboard / API). */
export const listLeadsQuerySchema = z.object({
  state: z.enum(LeadState).optional(),
});

export type ListLeadsQuery = z.infer<typeof listLeadsQuerySchema>;

/** Body for updating a lead's state (currently: mark as reached out). */
export const updateLeadSchema = z.object({
  state: z.enum(LeadState),
});

export type UpdateLeadInput = z.infer<typeof updateLeadSchema>;
