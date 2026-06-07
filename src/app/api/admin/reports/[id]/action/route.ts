import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { getCurrentUser, isStaff } from "@/lib/auth";

const schema = z.object({
  action: z.enum(["approve", "return", "pay"]),
  note: z.string().trim().max(1000).optional(),
});

// Staff state transitions for a submitted report.
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const user = await getCurrentUser();
  if (!user || !isStaff(user.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await request.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  }

  const report = await prisma.expenseReport.findUnique({ where: { id } });
  if (!report) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const { action, note } = parsed.data;

  // Managers can approve and return but cannot mark as paid.
  if (action === "pay" && user.role !== "ADMIN") {
    return NextResponse.json(
      { error: "Only admins can mark reports as paid." },
      { status: 403 }
    );
  }

  // Validate the transition.
  const transitions: Record<string, string[]> = {
    approve: ["SUBMITTED"],
    return: ["SUBMITTED", "APPROVED"],
    pay: ["APPROVED"],
  };
  if (!transitions[action].includes(report.status)) {
    return NextResponse.json(
      { error: `Cannot ${action} a report that is ${report.status}.` },
      { status: 409 }
    );
  }

  if (action === "return" && !note) {
    return NextResponse.json(
      { error: "Add a note so the employee knows what to fix." },
      { status: 400 }
    );
  }

  const status =
    action === "approve" ? "APPROVED" : action === "pay" ? "PAID" : "RETURNED";

  await prisma.expenseReport.update({
    where: { id },
    data: {
      status,
      adminNote: action === "return" ? note ?? null : null,
    },
  });

  return NextResponse.json({ ok: true, status });
}
