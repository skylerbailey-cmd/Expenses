import { NextResponse } from "next/server";
import { randomBytes } from "crypto";
import { getCurrentUser } from "@/lib/auth";
import { buildAuthUrl, qboConfigured, appUrl } from "@/lib/quickbooks";

// Kicks off the QuickBooks OAuth flow (admin only).
export async function GET() {
  const user = await getCurrentUser();
  if (!user || user.role !== "ADMIN") {
    return NextResponse.redirect(`${appUrl()}/login`);
  }
  if (!qboConfigured()) {
    return NextResponse.redirect(`${appUrl()}/admin/settings?qbo=notconfigured`);
  }

  const state = randomBytes(16).toString("hex");
  const res = NextResponse.redirect(buildAuthUrl(state));
  res.cookies.set("qbo_oauth_state", state, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 600,
  });
  return res;
}
