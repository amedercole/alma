import type { Metadata } from "next";
import { LoginForm } from "@/components/login-form";

export const metadata: Metadata = {
  title: "Attorney login — Alma",
};

export default function LoginPage() {
  return (
    <div className="mx-auto max-w-sm">
      <h1 className="text-2xl font-bold tracking-tight text-slate-900">
        Attorney login
      </h1>
      <p className="mt-2 text-sm text-slate-600">
        Sign in to review and manage incoming leads.
      </p>
      <div className="mt-6 rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
        <LoginForm />
      </div>
    </div>
  );
}
