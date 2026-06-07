import Link from "next/link";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { AppHeader } from "@/components/AppHeader";
import { StatusBadge } from "@/components/StatusBadge";
import { formatCurrency, formatDate } from "@/lib/format";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const user = await requireUser();
  if (user.role === "ADMIN") {
    // Admins primarily use the admin console, but can still file their own.
  }

  const reports = await prisma.expenseReport.findMany({
    where: { userId: user.id },
    include: { expenses: { select: { amount: true } } },
    orderBy: { updatedAt: "desc" },
  });

  return (
    <>
      <AppHeader user={user} />
      <main className="mx-auto max-w-3xl px-4 py-6">
        <div className="mb-5 flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold tracking-tight">My expense reports</h1>
            <p className="text-sm text-slate-500">
              Snap receipts and we&apos;ll fill in the details.
            </p>
          </div>
          <Link
            href="/reports/new"
            className="rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white hover:bg-slate-800"
          >
            New report
          </Link>
        </div>

        {reports.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-10 text-center">
            <p className="font-medium text-slate-700">No reports yet</p>
            <p className="mt-1 text-sm text-slate-500">
              Create your first report to start adding receipts.
            </p>
            <Link
              href="/reports/new"
              className="mt-4 inline-block rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white hover:bg-slate-800"
            >
              New report
            </Link>
          </div>
        ) : (
          <ul className="space-y-3">
            {reports.map((r) => {
              const total = r.expenses.reduce((s, e) => s + (e.amount ?? 0), 0);
              return (
                <li key={r.id}>
                  <Link
                    href={`/reports/${r.id}`}
                    className="block rounded-2xl border border-slate-200 bg-white p-4 shadow-sm transition hover:border-slate-300 hover:shadow"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="truncate font-semibold text-slate-900">
                          {r.title}
                        </p>
                        <p className="mt-0.5 text-sm text-slate-500">
                          {r.expenses.length} item
                          {r.expenses.length === 1 ? "" : "s"} ·{" "}
                          {formatCurrency(total)}
                        </p>
                      </div>
                      <StatusBadge status={r.status} />
                    </div>
                    {r.status === "RETURNED" && r.adminNote && (
                      <p className="mt-2 rounded-lg bg-amber-50 px-3 py-2 text-sm text-amber-800">
                        <span className="font-medium">Returned:</span> {r.adminNote}
                      </p>
                    )}
                    <p className="mt-2 text-xs text-slate-400">
                      Updated {formatDate(r.updatedAt)}
                    </p>
                  </Link>
                </li>
              );
            })}
          </ul>
        )}
      </main>
    </>
  );
}
