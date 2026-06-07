import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { getReportForUser, EDITABLE_BY_EMPLOYEE } from "@/lib/reports";

// Employee submits a report for admin approval.
// Duplicates are only WARNED about in the UI; submission is never blocked here.
export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const report = await getReportForUser(id, user);
  if (!report) return NextResponse.json({ error: "Not found" }, { status: 404 });

  if (report.userId !== user.id) {
    return NextResponse.json(
      { error: "Only the report owner can submit it." },
      { status: 403 }
    );
  }

  if (!EDITABLE_BY_EMPLOYEE.has(report.status)) {
    return NextResponse.json(
      { error: "This report has already been submitted." },
      { status: 409 }
    );
  }

  if (report.expenses.length === 0) {
    return NextResponse.json(
      { error: "Add at least one expense before submitting." },
      { status: 400 }
    );
  }

  await prisma.expenseReport.update({
    where: { id },
    data: { status: "SUBMITTED", submittedAt: new Date(), adminNote: null },
  });

  return NextResponse.json({ ok: true });
}
