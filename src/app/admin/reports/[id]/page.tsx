import Link from "next/link";
import { notFound } from "next/navigation";
import { requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { getReportForUser, reportTotal } from "@/lib/reports";
import { findDuplicateWarnings, type DupCandidate } from "@/lib/duplicates";
import { AppHeader } from "@/components/AppHeader";
import { StatusBadge } from "@/components/StatusBadge";
import { ExpenseCard, type ExpenseDTO } from "@/components/ExpenseCard";
import { AdminActions } from "@/components/AdminActions";
import { AdminDeleteReportButton } from "@/components/AdminDeleteReportButton";
import { QboSyncPanel } from "@/components/QboSyncPanel";
import { qboConfigured, getConnection } from "@/lib/quickbooks";
import { formatCurrency, formatDate, toDateInputValue } from "@/lib/format";

export const dynamic = "force-dynamic";

export default async function AdminReportPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const user = await requireAdmin();
  const report = await getReportForUser(id, user);
  if (!report) notFound();

  const total = reportTotal(report.expenses);
  // Admins may correct figures while a report is under review (not after payment).
  const editable = report.status === "SUBMITTED" || report.status === "APPROVED";

  // Duplicate warnings within the report and against the submitter's history.
  const current: DupCandidate[] = report.expenses.map((e) => ({
    id: e.id,
    merchant: e.merchant,
    amount: e.amount,
    transactionDate: e.transactionDate,
    reportId: report.id,
  }));
  const otherExpenses = await prisma.expense.findMany({
    where: { report: { userId: report.userId }, reportId: { not: report.id } },
    select: {
      id: true,
      merchant: true,
      amount: true,
      transactionDate: true,
      reportId: true,
      report: { select: { title: true } },
    },
  });
  const existing: DupCandidate[] = otherExpenses.map((e) => ({
    id: e.id,
    merchant: e.merchant,
    amount: e.amount,
    transactionDate: e.transactionDate,
    reportId: e.reportId,
    reportTitle: e.report.title,
  }));
  const warnings = findDuplicateWarnings(current, existing);

  // QuickBooks status for this report.
  const qboConnection = qboConfigured() ? await getConnection() : null;
  const qboNeedsSetup = !qboConnection || !qboConnection.paymentAccountId;
  const qboSyncedCount = report.expenses.filter((e) => e.qboPurchaseId).length;

  const expenseDTOs: ExpenseDTO[] = report.expenses.map((e) => ({
    id: e.id,
    merchant: e.merchant,
    amount: e.amount,
    currency: e.currency,
    category: e.category,
    description: e.description,
    transactionDate: toDateInputValue(e.transactionDate),
    needsReview: e.needsReview,
    aiConfidence: e.aiConfidence,
    images: e.images.map((img) => ({ id: img.id, path: img.path })),
  }));

  return (
    <>
      <AppHeader user={user} />
      <main className="mx-auto max-w-3xl px-4 py-6">
        <Link href="/admin" className="text-sm text-slate-500 hover:text-slate-900">
          ← All reports
        </Link>

        <div className="mt-3 flex items-start justify-between gap-3">
          <div className="min-w-0">
            <h1 className="truncate text-xl font-bold tracking-tight">
              {report.title}
            </h1>
            <p className="text-sm text-slate-500">
              Submitted by {report.submitterFirstName} {report.submitterLastName}
              {report.user?.email ? ` · ${report.user.email}` : ""}
            </p>
            {report.submittedAt && (
              <p className="text-xs text-slate-400">
                Submitted {formatDate(report.submittedAt)}
              </p>
            )}
          </div>
          <StatusBadge status={report.status} />
        </div>

        <div className="mt-4 rounded-2xl border border-slate-200 bg-white p-4">
          <div className="flex items-center justify-between">
            <span className="text-sm text-slate-500">Total to reimburse</span>
            <span className="text-lg font-bold text-slate-900">
              {formatCurrency(total)}
            </span>
          </div>
          {warnings.size > 0 && (
            <p className="mt-2 rounded-lg bg-amber-50 px-3 py-2 text-sm text-amber-800">
              ⚠️ {warnings.size} expense{warnings.size === 1 ? "" : "s"} flagged as
              possible duplicate{warnings.size === 1 ? "" : "s"}.
            </p>
          )}
        </div>

        <div className="mt-4">
          <AdminActions reportId={report.id} status={report.status} userRole={user.role} />
        </div>

        {user.role === "ADMIN" &&
          (report.status === "APPROVED" || report.status === "PAID") && (
          <div className="mt-4">
            <QboSyncPanel
              reportId={report.id}
              syncedCount={qboSyncedCount}
              totalCount={report.expenses.length}
              needsSetup={qboNeedsSetup}
            />
          </div>
        )}

        {editable && (
          <p className="mt-4 text-xs text-slate-400">
            You can correct any field below before approving — changes save
            immediately.
          </p>
        )}

        <section className="mt-3 space-y-3">
          {expenseDTOs.map((e) => (
            <ExpenseCard
              key={e.id}
              expense={e}
              editable={editable}
              duplicateWarning={warnings.get(e.id)?.message}
            />
          ))}
        </section>

        <div className="mt-6 border-t border-slate-200 pt-4">
          <AdminDeleteReportButton reportId={report.id} />
        </div>
      </main>
    </>
  );
}
