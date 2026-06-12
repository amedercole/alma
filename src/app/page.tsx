import Link from "next/link";

export default function Home() {
  return (
    <div className="mx-auto max-w-2xl text-center">
      <h1 className="text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">
        Get an assessment from an Alma attorney
      </h1>
      <p className="mt-4 text-lg text-slate-600">
        Submit your details and resume. One of our attorneys will review your
        profile and reach out to you.
      </p>
      <div className="mt-8 flex items-center justify-center gap-4">
        <Link
          href="/leads/new"
          className="rounded-md bg-slate-900 px-5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-slate-700"
        >
          Submit your application
        </Link>
        <Link
          href="/dashboard"
          className="rounded-md border border-slate-300 bg-white px-5 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50"
        >
          Open the dashboard
        </Link>
      </div>
    </div>
  );
}
