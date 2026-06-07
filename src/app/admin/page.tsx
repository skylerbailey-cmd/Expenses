import Link from "next/link";
import { requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { AppHeader } from "@/components/AppHeader";
import { StatusBadge } from "@/components/StatusBadge";
import { formatCurrency, formatDate } from "@/lib/format";
import { REPORT_STATUSES, STATUS_LABELS, type ReportStatus } from "@/lib/constants";

export const dynamic = "force-dynamic";

// Submitted reports float to the top so the admin sees what needs action.
const STATUS_ORDER: Record<string, number> = {
  SUBMITTED: 0,
  RETURNED: 1,
  APPROVED: 2,
  PAID: 3,
  DRAFT: 4,
};

export default async function AdminPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>;
}) {
  const user = await requireAdmin();
  const { status } = await searchParams;
  const filter = REPORT_STATUSES.includes(status as ReportStatus)
    ? (status as ReportStatus)
    : null;

  const reports = await prisma.expenseReport.findMany({
    where: filter ? { status: filter } : { status: { not: "DRAFT" } },
    include: {
      expenses: { select: { amount: true } },
      user: { select: { firstName: true, lastName: true } },
    },
  });

  reports.sort((a, b) => {
    const o = (STATUS_ORDER[a.status] ?? 9) - (STATUS_ORDER[b.status] ?? 9);
    if (o !== 0) return o;
    return b.updatedAt.getTime() - a.updatedAt.getTime();
  });

  const pendingCount = await prisma.expenseReport.count({
    where: { status: "SUBMITTED" },
  });

  return (
    <>
      <AppHeader user={user} />
      <main className="mx-auto max-w-3xl px-4 py-6">
        <div className="mb-4">
          <h1 className="text-xl font-bold tracking-tight">Admin · Expense reports</h1>
          <p className="text-sm text-slate-500">
            {pendingCount > 0
              ? `${pendingCount} report${pendingCount === 1 ? "" : "s"} waiting for your review.`
              : "Nothing waiting for review right now."}
          </p>
        </div>

        <div className="mb-4 flex flex-wrap gap-2">
          <FilterChip href="/admin" label="All" active={!filter} />
          {REPORT_STATUSES.filter((s) => s !== "DRAFT").map((s) => (
            <FilterChip
              key={s}
              href={`/admin?status=${s}`}
              label={STATUS_LABELS[s]}
              active={filter === s}
            />
          ))}
        </div>

        {reports.length === 0 ? (
          <p className="rounded-2xl border border-dashed border-slate-300 bg-white p-10 text-center text-sm text-slate-500">
            No reports here.
          </p>
        ) : (
          <ul className="space-y-3">
            {reports.map((r) => {
              const total = r.expenses.reduce((s, e) => s + (e.amount ?? 0), 0);
              return (
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
                          {r.submitterFirstName} {r.submitterLastName} ·{" "}
                          {r.expenses.length} item
                          {r.expenses.length === 1 ? "" : "s"} ·{" "}
                          {formatCurrency(total)}
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
              );
            })}
          </ul>
        )}
      </main>
    </>
  );
}

function FilterChip({
  href,
  label,
  active,
}: {
  href: string;
  label: string;
  active: boolean;
}) {
  return (
    <Link
      href={href}
      className={`rounded-full px-3 py-1.5 text-sm font-medium ring-1 ring-inset transition ${
        active
          ? "bg-slate-900 text-white ring-slate-900"
          : "bg-white text-slate-600 ring-slate-200 hover:ring-slate-300"
      }`}
    >
      {label}
    </Link>
  );
}
