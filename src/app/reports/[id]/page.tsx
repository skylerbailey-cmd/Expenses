import Link from "next/link";
import { notFound } from "next/navigation";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { getReportForUser, EDITABLE_BY_EMPLOYEE, reportTotal } from "@/lib/reports";
import { findDuplicateWarnings, type DupCandidate } from "@/lib/duplicates";
import { aiEnabled } from "@/lib/ai";
import { AppHeader } from "@/components/AppHeader";
import { StatusBadge } from "@/components/StatusBadge";
import { ReceiptUploader } from "@/components/ReceiptUploader";
import { ExpenseCard, type ExpenseDTO } from "@/components/ExpenseCard";
import { SubmitReportBar } from "@/components/SubmitReportBar";
import { DeleteReportButton } from "@/components/DeleteReportButton";
import { formatCurrency, toDateInputValue } from "@/lib/format";

export const dynamic = "force-dynamic";

export default async function ReportPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const user = await requireUser();
  const report = await getReportForUser(id, user);
  if (!report) notFound();

  const editable = EDITABLE_BY_EMPLOYEE.has(report.status);
  const total = reportTotal(report.expenses);

  // Build duplicate warnings: within this report and against the owner's other expenses.
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

  const missingFieldCount = report.expenses.filter(
    (e) => e.amount == null || !e.merchant
  ).length;

  return (
    <>
      <AppHeader user={user} />
      <main className="mx-auto max-w-3xl px-4 py-6">
        <Link href="/dashboard" className="text-sm text-slate-500 hover:text-slate-900">
          ← My reports
        </Link>

        <div className="mt-3 flex items-start justify-between gap-3">
          <div className="min-w-0">
            <h1 className="truncate text-xl font-bold tracking-tight">
              {report.title}
            </h1>
            <p className="text-sm text-slate-500">
              {report.submitterFirstName} {report.submitterLastName} ·{" "}
              {formatCurrency(total)} total
            </p>
          </div>
          <StatusBadge status={report.status} />
        </div>

        {report.status === "RETURNED" && report.adminNote && (
          <div className="mt-4 rounded-xl bg-amber-50 px-4 py-3 text-sm text-amber-900">
            <p className="font-semibold">Returned for changes</p>
            <p className="mt-0.5">{report.adminNote}</p>
          </div>
        )}

        {!editable && report.status !== "RETURNED" && (
          <div className="mt-4 rounded-xl bg-slate-100 px-4 py-3 text-sm text-slate-600">
            This report has been {report.status.toLowerCase()} and is now read-only.
          </div>
        )}

        {editable && (
          <div className="mt-5">
            <ReceiptUploader reportId={report.id} aiEnabled={aiEnabled()} />
          </div>
        )}

        <section className="mt-5 space-y-3 pb-4">
          {report.expenses.length === 0 ? (
            <p className="rounded-2xl border border-dashed border-slate-300 bg-white p-8 text-center text-sm text-slate-500">
              No receipts yet. Add some above to get started.
            </p>
          ) : (
            expenseDTOs.map((e) => (
              <ExpenseCard
                key={e.id}
                expense={e}
                editable={editable}
                duplicateWarning={warnings.get(e.id)?.message}
              />
            ))
          )}
        </section>

        {editable && (
          <DeleteReportButton reportId={report.id} />
        )}

        {editable && (
          <SubmitReportBar
            reportId={report.id}
            expenseCount={report.expenses.length}
            duplicateCount={warnings.size}
            missingFieldCount={missingFieldCount}
          />
        )}
      </main>
    </>
  );
}
