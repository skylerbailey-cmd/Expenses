import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { CATEGORIES } from "@/lib/constants";

const schema = z.object({
  paymentAccountId: z.string().min(1),
  paymentAccountName: z.string().min(1),
  paymentType: z.enum(["Cash", "Check", "CreditCard"]),
  mappings: z.record(
    z.string(),
    z.object({ accountId: z.string().min(1), accountName: z.string().min(1) })
  ),
});

// Saves the payment account + category->expense-account mapping (admin only).
export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!user || user.role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const conn = await prisma.quickBooksConnection.findUnique({
    where: { id: "default" },
  });
  if (!conn) {
    return NextResponse.json({ error: "QuickBooks is not connected." }, { status: 409 });
  }

  const body = await request.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid settings" }, { status: 400 });
  }

  const { paymentAccountId, paymentAccountName, paymentType, mappings } = parsed.data;

  await prisma.quickBooksConnection.update({
    where: { id: "default" },
    data: { paymentAccountId, paymentAccountName, paymentType },
  });

  // Upsert only mappings for known categories.
  const ops = Object.entries(mappings)
    .filter(([category]) => (CATEGORIES as readonly string[]).includes(category))
    .map(([category, m]) =>
      prisma.qboAccountMap.upsert({
        where: { category },
        create: { category, accountId: m.accountId, accountName: m.accountName },
        update: { accountId: m.accountId, accountName: m.accountName },
      })
    );
  await prisma.$transaction(ops);

  return NextResponse.json({ ok: true });
}
