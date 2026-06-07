import Link from "next/link";
import { notFound } from "next/navigation";
import { requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { AppHeader } from "@/components/AppHeader";
import { StatusBadge } from "@/components/StatusBadge";
import { formatCurrency, formatDate } from "@/lib/format";

export const dynamic = "force-dynamic";

export default async function EmployeeDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const user = await requireAdmin();

  const employee = await prisma.user.findUnique({
    where: { id },
    select: {
      id: true,
      firstName: true,
      lastName: true,
      email: true,
      role: true,
      reports: {
        where: { status: { not: "DRAFT" } },
        include: {
          expenses: {
            select: { amount: true, denied: true },
          },
        },
        orderBy: { updatedAt: "desc" },
      },
    },
  });

  if (!employee) notFound();

  // Summary totals.
  let approvedAmount = 0;
  let paidAmount = 0;
  let pendingAmount = 0;

  const reports = employee.reports.map((r) => {
    const total = r.expenses
      .filter((e) => !e.denied)
      .reduce((sum, e) => sum + (e.amount ?? 0), 0);

    if (r.status === "APPROVED") approvedAmount += total;
    else if (r.status === "PAID") paidAmount += total;
    else if (r.status === "SUBMITTED" || r.status === "RETURNED")
      pendingAmount += total;

    return { ...r, total };
  });

  return (
    <>
      <AppHeader user={user} />
      <main className="mx-auto max-w-3xl px-4 py-6">
        <Link
          href="/admin/employees"
          className="text-sm text-slate-500 hover:text-slate-900"
        >
          ← All employees
        </Link>

        <div className="mt-3">
          <h1 className="text-xl font-bold tracking-tight">
            {employee.firstName} {employee.lastName}
          </h1>
          <p className="text-sm text-slate-500">{employee.email}</p>
        </div>

        {/* Summary cards */}
        <div className="mt-4 grid grid-cols-3 gap-3">
          <div className="rounded-xl bg-amber-50 p-3 text-center">
            <p className="text-lg font-bold text-amber-700">
              {formatCurrency(approvedAmount)}
            </p>
            <p className="text-xs text-amber-600">Owed (Approved)</p>
          </div>
          <div className="rounded-xl bg-emerald-50 p-3 text-center">
            <p className="text-lg font-bold text-emerald-700">
              {formatCurrency(paidAmount)}
            </p>
            <p className="text-xs text-emerald-600">Paid</p>
          </div>
          <div className="rounded-xl bg-blue-50 p-3 text-center">
            <p className="text-lg font-bold text-blue-700">
              {formatCurrency(pendingAmount)}
            </p>
            <p className="text-xs text-blue-600">Pending Review</p>
          </div>
        </div>

        <h2 className="mt-6 text-sm font-semibold text-slate-700">
          Reports ({reports.length})
        </h2>

        {reports.length === 0 ? (
          <p className="mt-3 rounded-2xl border border-dashed border-slate-300 bg-white p-8 text-center text-sm text-slate-500">
            No submitted reports yet.
          </p>
        ) : (
          <ul className="mt-3 space-y-2">
            {reports.map((r) => (
              <li key={r.id}>
                <Link
                  href={`/admin/reports/${r.id}`}
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
                        {formatCurrency(r.total)}
                      </p>
                    </div>
                    <StatusBadge status={r.status} />
                  </div>
                  <p className="mt-2 text-xs text-slate-400">
                    {r.submittedAt
                      ? `Submitted ${formatDate(r.submittedAt)}`
                      : `Updated ${formatDate(r.updatedAt)}`}
                  </p>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </main>
    </>
  );
}
