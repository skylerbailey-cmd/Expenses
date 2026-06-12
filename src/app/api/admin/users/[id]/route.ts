import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { deleteUpload } from "@/lib/storage";

const patchSchema = z.object({
  role: z.enum(["EMPLOYEE", "MANAGER", "ADMIN"]).optional(),
  newPassword: z.string().min(8).optional(),
});

// Change a user's role (admin only).
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const user = await getCurrentUser();
  if (!user || user.role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  if (id === user.id) {
    return NextResponse.json(
      { error: "You cannot change your own role." },
      { status: 400 }
    );
  }

  const body = await request.json().catch(() => null);
  const parsed = patchSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid role" }, { status: 400 });
  }

  const target = await prisma.user.findUnique({ where: { id } });
  if (!target) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  const updateData: Record<string, string> = {};
  if (parsed.data.role) updateData.role = parsed.data.role;
  if (parsed.data.newPassword) {
    updateData.passwordHash = await bcrypt.hash(parsed.data.newPassword, 10);
  }

  if (Object.keys(updateData).length === 0) {
    return NextResponse.json({ error: "Nothing to update" }, { status: 400 });
  }

  await prisma.user.update({
    where: { id },
    data: updateData,
  });

  return NextResponse.json({ ok: true });
}

// Delete a user and their data (admin only).
export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const user = await getCurrentUser();
  if (!user || user.role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  if (id === user.id) {
    return NextResponse.json(
      { error: "You cannot delete yourself." },
      { status: 400 }
    );
  }

  const target = await prisma.user.findUnique({
    where: { id },
    include: {
      reports: {
        include: { expenses: { include: { images: true } } },
      },
    },
  });
  if (!target) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  // Clean up uploaded files.
  for (const report of target.reports) {
    for (const expense of report.expenses) {
      await Promise.all(expense.images.map((img) => deleteUpload(img.path)));
    }
  }

  // Cascade will remove reports, expenses, and images.
  await prisma.user.delete({ where: { id } });

  return NextResponse.json({ ok: true });
}
