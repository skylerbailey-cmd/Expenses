import "server-only";
import { prisma } from "./db";
import type { SafeUser } from "./auth";
import { isStaff } from "./auth";

/** Statuses an employee is allowed to edit. */
export const EDITABLE_BY_EMPLOYEE = new Set(["DRAFT", "RETURNED"]);

/**
 * Load a report and verify the user may access it.
 * Admins can access any report; employees only their own.
 * Returns null when not found or not permitted.
 */
export async function getReportForUser(reportId: string, user: SafeUser) {
  const report = await prisma.expenseReport.findUnique({
    where: { id: reportId },
    include: {
      expenses: {
        include: { images: true },
        orderBy: { createdAt: "asc" },
      },
      user: true,
    },
  });
  if (!report) return null;
  if (!isStaff(user.role) && report.userId !== user.id) return null;
  return report;
}

export function reportTotal(expenses: { amount: number | null }[]): number {
  return expenses.reduce((sum, e) => sum + (e.amount ?? 0), 0);
}
