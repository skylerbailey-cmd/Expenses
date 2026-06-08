import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/db";

export async function POST(request: Request) {
  const { email, password, secret } = await request.json().catch(() => ({} as Record<string, string>));

  if (secret !== process.env.RESET_SECRET) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  if (!email || !password) {
    return NextResponse.json({ error: "Email and password required" }, { status: 400 });
  }

  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  const passwordHash = await bcrypt.hash(password, 10);
  await prisma.user.update({ where: { email }, data: { passwordHash } });

  return NextResponse.json({ ok: true });
}
