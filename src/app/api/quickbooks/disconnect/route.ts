import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { disconnect } from "@/lib/quickbooks";

export async function POST() {
  const user = await getCurrentUser();
  if (!user || user.role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  await disconnect();
  return NextResponse.json({ ok: true });
}
