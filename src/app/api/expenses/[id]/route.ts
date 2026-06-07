import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { getCurrentUser, isStaff } from "@/lib/auth";
import { EDITABLE_BY_EMPLOYEE } from "@/lib/reports";
import { CATEGORIES, COMPANIES } from "@/lib/constants";
import { deleteUpload } from "@/lib/storage";

const patchSchema = z.object({
  company: z.enum(COMPANIES).nullable().optional(),
  merchant: z.string().trim().max(120).nullable().optional(),
  amount: z.number().nonnegative().nullable().optional(),
  currency: z.string().trim().max(8).optional(),
  category: z.enum(CATEGORIES).nullable().optional(),
  description: z.string().trim().max(500).nullable().optional(),
  transactionDate: z.string().nullable().optional(), // YYYY-MM-DD
  denied: z.boolean().optional(),
  deniedReason: z.string().trim().max(500).nullable().optional(),
});

async function loadExpenseFor(expenseId: string, userId: string, isAdmin: boolean) {
  const expense = await prisma.expense.findUnique({
    where: { id: expenseId },
    include: { report: true, images: true },
  });
  if (!expense) return null;
  if (!isAdmin && expense.report.userId !== userId) return null;
  return expense;
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const expense = await loadExpenseFor(id, user.id, isStaff(user.role));
  if (!expense) return NextResponse.json({ error: "Not found" }, { status: 404 });

  // Employees can only edit while draft/returned; staff can edit submitted/approved.
  if (!isStaff(user.role) && !EDITABLE_BY_EMPLOYEE.has(expense.report.status)) {
    return NextResponse.json(
      { error: "This report can no longer be edited." },
      { status: 409 }
    );
  }

  const body = await request.json().catch(() => null);
  const parsed = patchSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Invalid input" },
      { status: 400 }
    );
  }

  const d = parsed.data;

  // Only staff can deny/restore expenses.
  if (d.denied !== undefined && !isStaff(user.role)) {
    return NextResponse.json(
      { error: "Only managers and admins can deny expenses." },
      { status: 403 }
    );
  }

  await prisma.expense.update({
    where: { id },
    data: {
      ...(d.company !== undefined ? { company: d.company } : {}),
      ...(d.merchant !== undefined ? { merchant: d.merchant } : {}),
      ...(d.amount !== undefined ? { amount: d.amount } : {}),
      ...(d.currency !== undefined ? { currency: d.currency } : {}),
      ...(d.category !== undefined ? { category: d.category } : {}),
      ...(d.description !== undefined ? { description: d.description } : {}),
      ...(d.transactionDate !== undefined
        ? {
            transactionDate: d.transactionDate
              ? new Date(d.transactionDate)
              : null,
          }
        : {}),
      ...(d.denied !== undefined ? { denied: d.denied } : {}),
      ...(d.deniedReason !== undefined ? { deniedReason: d.deniedReason } : {}),
      // Clear denied reason when restoring.
      ...(d.denied === false ? { deniedReason: null } : {}),
      // A human has reviewed this line.
      needsReview: false,
    },
  });

  return NextResponse.json({ ok: true });
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const expense = await loadExpenseFor(id, user.id, isStaff(user.role));
  if (!expense) return NextResponse.json({ error: "Not found" }, { status: 404 });

  if (user.role !== "ADMIN" && !EDITABLE_BY_EMPLOYEE.has(expense.report.status)) {
    return NextResponse.json(
      { error: "This report can no longer be edited." },
      { status: 409 }
    );
  }

  // Remove stored image files, then the row (cascade deletes ExpenseImage).
  await Promise.all(expense.images.map((img) => deleteUpload(img.path)));
  await prisma.expense.delete({ where: { id } });

  return NextResponse.json({ ok: true });
}
