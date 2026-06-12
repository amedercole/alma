import type { Metadata } from "next";
import { LeadForm } from "@/components/lead-form";

export const metadata: Metadata = {
  title: "Submit your application — Alma",
};

export default function NewLeadPage() {
  return (
    <div className="mx-auto max-w-xl">
      <h1 className="text-2xl font-bold tracking-tight text-slate-900">
        Submit your application
      </h1>
      <p className="mt-2 text-slate-600">
        Tell us a bit about yourself and upload your resume. We&apos;ll be in
        touch.
      </p>
      <div className="mt-6 rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
        <LeadForm />
      </div>
    </div>
  );
}
