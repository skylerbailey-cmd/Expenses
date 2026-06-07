import Link from "next/link";
import { requireUser } from "@/lib/auth";
import { AppHeader } from "@/components/AppHeader";
import { NewReportForm } from "./NewReportForm";

export const dynamic = "force-dynamic";

export default async function NewReportPage() {
  const user = await requireUser();
  return (
    <>
      <AppHeader user={user} />
      <main className="mx-auto max-w-xl px-4 py-6">
        <Link href="/dashboard" className="text-sm text-slate-500 hover:text-slate-900">
          ← Back
        </Link>
        <h1 className="mt-3 text-xl font-bold tracking-tight">New expense report</h1>
        <p className="mb-5 text-sm text-slate-500">
          Confirm your name and give this report a title (e.g. &quot;June client
          visit&quot;).
        </p>
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <NewReportForm
            defaultFirstName={user.firstName}
            defaultLastName={user.lastName}
          />
        </div>
      </main>
    </>
  );
}
