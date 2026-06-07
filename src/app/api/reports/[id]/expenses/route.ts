import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { getReportForUser, EDITABLE_BY_EMPLOYEE } from "@/lib/reports";
import { saveUpload, isAllowedType, MAX_FILE_BYTES } from "@/lib/storage";
import { extractReceipt, aiEnabled } from "@/lib/ai";
import { prisma } from "@/lib/db";

export const maxDuration = 120; // allow time for AI extraction

// Each uploaded file is treated as one receipt -> one expense line item.
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const report = await getReportForUser(id, user);
  if (!report) return NextResponse.json({ error: "Not found" }, { status: 404 });

  // Employees may only add to draft/returned reports.
  if (user.role !== "ADMIN" && !EDITABLE_BY_EMPLOYEE.has(report.status)) {
    return NextResponse.json(
      { error: "This report can no longer be edited." },
      { status: 409 }
    );
  }

  const form = await request.formData().catch(() => null);
  if (!form) {
    return NextResponse.json({ error: "Invalid upload" }, { status: 400 });
  }

  const files = form.getAll("files").filter((f): f is File => f instanceof File);
  if (files.length === 0) {
    return NextResponse.json({ error: "No files uploaded" }, { status: 400 });
  }

  const results = await Promise.all(
    files.map((file) => processFile(file, report.id))
  );

  const created = results.filter((r) => r.ok).map((r) => r.expenseId);
  const errors = results.filter((r) => !r.ok).map((r) => r.error);

  await prisma.expenseReport.update({
    where: { id: report.id },
    data: { updatedAt: new Date() },
  });

  return NextResponse.json({
    ok: true,
    created: created.length,
    errors,
    aiEnabled: aiEnabled(),
  });
}

async function processFile(
  file: File,
  reportId: string
): Promise<{ ok: true; expenseId: string } | { ok: false; error: string }> {
  if (!isAllowedType(file.type)) {
    return { ok: false, error: `${file.name}: unsupported file type` };
  }
  if (file.size > MAX_FILE_BYTES) {
    return { ok: false, error: `${file.name}: file is too large (max 15MB)` };
  }

  let webPath: string;
  try {
    webPath = await saveUpload(file);
  } catch {
    return { ok: false, error: `${file.name}: could not be saved` };
  }

  // Run AI extraction; never let an AI failure block the upload.
  let extracted = null;
  let aiRaw: string | null = null;
  try {
    const base64 = Buffer.from(await file.arrayBuffer()).toString("base64");
    extracted = await extractReceipt([{ base64, mediaType: file.type }]);
    if (extracted) aiRaw = JSON.stringify(extracted);
  } catch (err) {
    console.error("AI extraction failed:", err);
  }

  const needsReview =
    !extracted ||
    extracted.amount == null ||
    !extracted.merchant ||
    extracted.confidence === "low";

  const expense = await prisma.expense.create({
    data: {
      reportId,
      merchant: extracted?.merchant ?? null,
      amount: extracted?.amount ?? null,
      currency: extracted?.currency ?? "USD",
      category: extracted?.category ?? null,
      description: extracted?.description ?? null,
      transactionDate: extracted?.transactionDate
        ? new Date(extracted.transactionDate)
        : null,
      aiRaw,
      aiConfidence: extracted?.confidence ?? null,
      needsReview,
      images: { create: { path: webPath } },
    },
  });

  return { ok: true, expenseId: expense.id };
}
