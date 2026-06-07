import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { getCurrentUser, isStaff } from "@/lib/auth";
import { getReportForUser, EDITABLE_BY_EMPLOYEE } from "@/lib/reports";
import { deleteUpload } from "@/lib/storage";

const patchSchema = z.object({
  title: z.string().trim().min(1).max(120).optional(),
  firstName: z.string().trim().min(1).max(60).optional(),
  lastName: z.string().trim().min(1).max(60).optional(),
});

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const report = await getReportForUser(id, user);
  if (!report) return NextResponse.json({ error: "Not found" }, { status: 404 });

  if (!isStaff(user.role) && !EDITABLE_BY_EMPLOYEE.has(report.status)) {
    return NextResponse.json(
      { error: "This report can no longer be edited." },
      { status: 409 }
    );
  }

  const body = await request.json().catch(() => null);
  const parsed = patchSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid input" }, { status: 400 });
  }

  const d = parsed.data;
  await prisma.expenseReport.update({
    where: { id },
    data: {
      ...(d.title !== undefined ? { title: d.title } : {}),
      ...(d.firstName !== undefined ? { submitterFirstName: d.firstName } : {}),
      ...(d.lastName !== undefined ? { submitterLastName: d.lastName } : {}),
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

  const report = await getReportForUser(id, user);
  if (!report) return NextResponse.json({ error: "Not found" }, { status: 404 });

  // Only draft reports can be deleted, and only by their owner (or an admin).
  if (report.status !== "DRAFT") {
    return NextResponse.json(
      { error: "Only draft reports can be deleted." },
      { status: 409 }
    );
  }

  for (const expense of report.expenses) {
    await Promise.all(expense.images.map((img) => deleteUpload(img.path)));
  }
  await prisma.expenseReport.delete({ where: { id } });

  return NextResponse.json({ ok: true });
}
