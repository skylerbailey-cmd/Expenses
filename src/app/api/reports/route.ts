import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";

const schema = z.object({
  title: z.string().trim().min(1, "Give the report a title").max(120),
  firstName: z.string().trim().min(1, "First name is required").max(60),
  lastName: z.string().trim().min(1, "Last name is required").max(60),
});

export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Invalid input" },
      { status: 400 }
    );
  }

  const report = await prisma.expenseReport.create({
    data: {
      title: parsed.data.title,
      submitterFirstName: parsed.data.firstName,
      submitterLastName: parsed.data.lastName,
      userId: user.id,
      status: "DRAFT",
    },
  });

  return NextResponse.json({ ok: true, id: report.id });
}
