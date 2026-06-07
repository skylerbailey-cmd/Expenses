import { NextResponse } from "next/server";
import { readFile } from "fs/promises";
import path from "path";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import {
  getConnection,
  createPurchase,
  attachReceipt,
} from "@/lib/quickbooks";
import { uploadPath, CONTENT_TYPE_BY_EXT } from "@/lib/storage";

export const maxDuration = 120;

// Push every (not-yet-synced) expense in a report to QuickBooks as a Purchase,
// attaching its receipt image(s). Admin only. Idempotent: already-synced
// expenses (those with a qboPurchaseId) are skipped.
export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const user = await getCurrentUser();
  if (!user || user.role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const conn = await getConnection();
  if (!conn) {
    return NextResponse.json(
      { error: "Connect QuickBooks in Settings first." },
      { status: 409 }
    );
  }
  if (!conn.paymentAccountId) {
    return NextResponse.json(
      { error: "Choose a payment account in Settings first." },
      { status: 409 }
    );
  }

  const report = await prisma.expenseReport.findUnique({
    where: { id },
    include: { expenses: { include: { images: true } } },
  });
  if (!report) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const maps = await prisma.qboAccountMap.findMany();
  const accountByCategory = new Map(maps.map((m) => [m.category, m]));

  let synced = 0;
  const skipped: string[] = [];
  const errors: string[] = [];

  for (const expense of report.expenses) {
    if (expense.denied) {
      skipped.push(`${expense.merchant ?? "An expense"} (denied)`);
      continue;
    }
    if (expense.qboPurchaseId) {
      skipped.push(`${expense.merchant ?? "Expense"} (already in QuickBooks)`);
      continue;
    }
    if (expense.amount == null) {
      skipped.push(`${expense.merchant ?? "An expense"} (no amount)`);
      continue;
    }
    const mapping = expense.category
      ? accountByCategory.get(expense.category)
      : undefined;
    if (!mapping) {
      errors.push(
        `${expense.merchant ?? "An expense"}: no QuickBooks account mapped for category "${expense.category ?? "none"}".`
      );
      continue;
    }

    try {
      const memoParts = [
        expense.merchant,
        expense.description,
        `Report: ${report.title}`,
        `Submitted by ${report.submitterFirstName} ${report.submitterLastName}`,
      ].filter(Boolean);

      const purchaseId = await createPurchase({
        amount: expense.amount,
        expenseAccountId: mapping.accountId,
        paymentAccountId: conn.paymentAccountId,
        paymentType: conn.paymentType,
        txnDate: expense.transactionDate
          ? expense.transactionDate.toISOString().slice(0, 10)
          : null,
        memo: memoParts.join(" · "),
      });

      // Attach receipt images (best effort — a failed attachment doesn't undo
      // the purchase, which is already recorded).
      for (const img of expense.images) {
        try {
          const name = path.basename(img.path);
          const ext = path.extname(name).toLowerCase();
          const contentType = CONTENT_TYPE_BY_EXT[ext] ?? "application/octet-stream";
          const data = await readFile(uploadPath(name));
          await attachReceipt(purchaseId, { data, fileName: name, contentType });
        } catch (err) {
          console.error("Receipt attach failed:", err);
        }
      }

      await prisma.expense.update({
        where: { id: expense.id },
        data: { qboPurchaseId: purchaseId },
      });
      synced++;
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Unknown error";
      errors.push(`${expense.merchant ?? "An expense"}: ${msg}`);
    }
  }

  await prisma.expenseReport.update({
    where: { id },
    data: {
      qboSyncedAt: synced > 0 ? new Date() : report.qboSyncedAt,
      qboError: errors.length > 0 ? errors.join("\n") : null,
    },
  });

  return NextResponse.json({ ok: errors.length === 0, synced, skipped, errors });
}
