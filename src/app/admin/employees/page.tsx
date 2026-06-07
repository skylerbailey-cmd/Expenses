import Link from "next/link";
import { requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { AppHeader } from "@/components/AppHeader";
import { DateRangeFilter } from "@/components/DateRangeFilter";
import { formatCurrency } from "@/lib/format";

export const dynamic = "force-dynamic";

export default async function EmployeesPage({
  searchParams,
}: {
  searchParams: Promise<{ from?: string; to?: string }>;
}) {
  const user = await requireAdmin();
  const { from, to } = await searchParams;

  // Parse date filters.
  const fromDate = from ? new Date(`${from}T00:00:00`) : null;
  const toDate = to ? new Date(`${to}T23:59:59`) : null;

  // Build a date filter for submittedAt.
  const dateFilter: Record<string, Date> = {};
  if (fromDate && !isNaN(fromDate.getTime())) dateFilter.gte = fromDate;
  if (toDate && !isNaN(toDate.getTime())) dateFilter.lte = toDate;

  const submittedAtFilter =
    Object.keys(dateFilter).length > 0 ? dateFilter : undefined;

  // Fetch all users with their reports (non-draft, optionally filtered by date).
  const users = await prisma.user.findMany({
    where: { role: "EMPLOYEE" },
    select: {
      id: true,
      firstName: true,
      lastName: true,
      email: true,
      reports: {
        where: {
          status: { not: "DRAFT" },
          ...(submittedAtFilter ? { submittedAt: submittedAtFilter } : {}),
        },
        select: {
          status: true,
          expenses: {
            select: { amount: true, denied: true },
          },
        },
      },
    },
    orderBy: { firstName: "asc" },
  });

  // Calculate summary per user.
  const summaries = users.map((u) => {
    let totalReports = u.reports.length;
    let approvedAmount = 0;
    let paidAmount = 0;
    let pendingAmount = 0;

    for (const r of u.reports) {
      const reportTotal = r.expenses
        .filter((e) => !e.denied)
        .reduce((sum, e) => sum + (e.amount ?? 0), 0);

      if (r.status === "APPROVED") {
        approvedAmount += reportTotal;
      } else if (r.status === "PAID") {
        paidAmount += reportTotal;
      } else if (r.status === "SUBMITTED" || r.status === "RETURNED") {
        pendingAmount += reportTotal;
      }
    }

    return {
      id: u.id,
      firstName: u.firstName,
      lastName: u.lastName,
      email: u.email,
      totalReports,
      approvedAmount,
      paidAmount,
      pendingAmount,
    };
  });

  // Totals across all employees.
  const totalApproved = summaries.reduce((s, u) => s + u.approvedAmount, 0);
  const totalPaid = summaries.reduce((s, u) => s + u.paidAmount, 0);
  const totalPending = summaries.reduce((s, u) => s + u.pendingAmount, 0);

  return (
    <>
      <AppHeader user={user} />
      <main className="mx-auto max-w-3xl px-4 py-6">
        <h1 className="text-xl font-bold tracking-tight">
          Employees
        </h1>
        <p className="mt-1 text-sm text-slate-500">
          Expense summary by employee. Click on a name to see their reports.
        </p>

        <div className="mt-4">
          <DateRangeFilter />
        </div>

        {/* Totals bar */}
        <div className="mt-4 grid grid-cols-3 gap-3">
          <SummaryCard
            label="Owed (Approved)"
            amount={totalApproved}
            color="text-amber-700 bg-amber-50"
          />
          <SummaryCard
            label="Paid"
            amount={totalPaid}
            color="text-emerald-700 bg-emerald-50"
          />
          <SummaryCard
            label="Pending Review"
            amount={totalPending}
            color="text-blue-700 bg-blue-50"
          />
        </div>

        {summaries.length === 0 ? (
          <p className="mt-6 rounded-2xl border border-dashed border-slate-300 bg-white p-10 text-center text-sm text-slate-500">
            No employees found.
          </p>
        ) : (
          <ul className="mt-5 space-y-2">
            {summaries.map((u) => (
              <li key={u.id}>
                <Link
                  href={`/admin/employees/${u.id}`}
                  className="block rounded-2xl border border-slate-200 bg-white p-4 shadow-sm transition hover:border-slate-300 hover:shadow"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="truncate font-semibold text-slate-900">
                        {u.firstName} {u.lastName}
                      </p>
                      <p className="truncate text-sm text-slate-500">
                        {u.email}
                      </p>
                    </div>
                    <span className="shrink-0 rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-600">
                      {u.totalReports} report{u.totalReports === 1 ? "" : "s"}
                    </span>
                  </div>

                  {u.totalReports > 0 && (
                    <div className="mt-3 grid grid-cols-3 gap-2 text-center text-xs">
                      <div className="rounded-lg bg-amber-50 px-2 py-1.5">
                        <p className="font-semibold text-amber-700">
                          {formatCurrency(u.approvedAmount)}
                        </p>
                        <p className="text-amber-600">Owed</p>
                      </div>
                      <div className="rounded-lg bg-emerald-50 px-2 py-1.5">
                        <p className="font-semibold text-emerald-700">
                          {formatCurrency(u.paidAmount)}
                        </p>
                        <p className="text-emerald-600">Paid</p>
                      </div>
                      <div className="rounded-lg bg-blue-50 px-2 py-1.5">
                        <p className="font-semibold text-blue-700">
                          {formatCurrency(u.pendingAmount)}
                        </p>
                        <p className="text-blue-600">Pending</p>
                      </div>
                    </div>
                  )}
                </Link>
              </li>
            ))}
          </ul>
        )}
      </main>
    </>
  );
}

function SummaryCard({
  label,
  amount,
  color,
}: {
  label: string;
  amount: number;
  color: string;
}) {
  return (
    <div className={`rounded-xl p-3 text-center ${color}`}>
      <p className="text-lg font-bold">{formatCurrency(amount)}</p>
      <p className="text-xs">{label}</p>
    </div>
  );
}
