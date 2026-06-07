import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { getCurrentUser } from "@/lib/auth";
import { exchangeCodeAndSave, appUrl } from "@/lib/quickbooks";

// OAuth redirect target. Intuit sends ?code=...&state=...&realmId=...
export async function GET(request: Request) {
  const user = await getCurrentUser();
  if (!user || user.role !== "ADMIN") {
    return NextResponse.redirect(`${appUrl()}/login`);
  }

  const url = new URL(request.url);
  const settings = (q: string) => `${appUrl()}/admin/settings?qbo=${q}`;

  if (url.searchParams.get("error")) {
    return NextResponse.redirect(settings("denied"));
  }

  const code = url.searchParams.get("code");
  const realmId = url.searchParams.get("realmId");
  const state = url.searchParams.get("state");

  const cookieStore = await cookies();
  const expectedState = cookieStore.get("qbo_oauth_state")?.value;

  if (!code || !realmId || !state || state !== expectedState) {
    return NextResponse.redirect(settings("badstate"));
  }

  try {
    await exchangeCodeAndSave(code, realmId);
  } catch (err) {
    console.error("QuickBooks token exchange failed:", err);
    return NextResponse.redirect(settings("error"));
  }

  const res = NextResponse.redirect(settings("connected"));
  res.cookies.delete("qbo_oauth_state");
  return res;
}
