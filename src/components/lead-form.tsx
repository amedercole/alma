"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { MAX_RESUME_BYTES, RESUME_ACCEPT } from "@/lib/resume";

type FieldErrors = Partial<
  Record<"firstName" | "lastName" | "email" | "resume", string[]>
>;

const labelClass = "block text-sm font-medium text-slate-700";
const inputClass =
  "mt-1 block w-full rounded-md border border-slate-300 px-3 py-2 text-slate-900 shadow-sm focus:border-slate-500 focus:outline-none focus:ring-1 focus:ring-slate-500";

export function LeadForm() {
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState<FieldErrors>({});
  const [formError, setFormError] = useState<string | null>(null);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setErrors({});
    setFormError(null);

    const form = event.currentTarget;
    const formData = new FormData(form);

    // Light client-side guard for file size; the server is the source of truth.
    const resume = formData.get("resume");
    if (resume instanceof File && resume.size > MAX_RESUME_BYTES) {
      setErrors({ resume: ["Resume must be 5 MB or smaller"] });
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch("/api/leads", { method: "POST", body: formData });
      if (res.ok) {
        router.push("/leads/thank-you");
        return;
      }
      const data = await res.json().catch(() => null);
      if (data?.error?.details) {
        setErrors(data.error.details as FieldErrors);
      } else {
        setFormError(data?.error?.message ?? "Something went wrong.");
      }
    } catch {
      setFormError("Network error. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="space-y-5">
      <div className="grid gap-5 sm:grid-cols-2">
        <div>
          <label htmlFor="firstName" className={labelClass}>
            First name
          </label>
          <input id="firstName" name="firstName" className={inputClass} />
          <FieldError messages={errors.firstName} />
        </div>
        <div>
          <label htmlFor="lastName" className={labelClass}>
            Last name
          </label>
          <input id="lastName" name="lastName" className={inputClass} />
          <FieldError messages={errors.lastName} />
        </div>
      </div>

      <div>
        <label htmlFor="email" className={labelClass}>
          Email
        </label>
        <input id="email" name="email" type="email" className={inputClass} />
        <FieldError messages={errors.email} />
      </div>

      <div>
        <label htmlFor="resume" className={labelClass}>
          Resume / CV
        </label>
        <input
          id="resume"
          name="resume"
          type="file"
          accept={RESUME_ACCEPT}
          className="mt-1 block w-full text-sm text-slate-700 file:mr-4 file:rounded-md file:border-0 file:bg-slate-900 file:px-4 file:py-2 file:text-sm file:font-semibold file:text-white hover:file:bg-slate-700"
        />
        <p className="mt-1 text-xs text-slate-500">
          PDF, DOC, or DOCX. Max 5 MB.
        </p>
        <FieldError messages={errors.resume} />
      </div>

      {formError && (
        <p role="alert" className="text-sm text-red-600">
          {formError}
        </p>
      )}

      <button
        type="submit"
        disabled={submitting}
        className="rounded-md bg-slate-900 px-5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-slate-700 disabled:opacity-60"
      >
        {submitting ? "Submitting…" : "Submit application"}
      </button>
    </form>
  );
}

function FieldError({ messages }: { messages?: string[] }) {
  if (!messages?.length) return null;
  return <p className="mt-1 text-sm text-red-600">{messages[0]}</p>;
}
