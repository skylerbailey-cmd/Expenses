import "server-only";
import { getIronSession, type SessionOptions } from "iron-session";
import { cookies } from "next/headers";

export interface SessionData {
  userId?: string;
  role?: "EMPLOYEE" | "ADMIN";
}

const password =
  process.env.SESSION_PASSWORD ||
  "dev-only-session-secret-change-me-please-32chars";

if (
  process.env.NODE_ENV === "production" &&
  (!process.env.SESSION_PASSWORD || process.env.SESSION_PASSWORD.length < 32)
) {
  // Fail loudly in production rather than silently using an insecure default.
  throw new Error(
    "SESSION_PASSWORD must be set to a string of at least 32 characters in production."
  );
}

export const sessionOptions: SessionOptions = {
  password,
  cookieName: "expenses_session",
  cookieOptions: {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
  },
};

export async function getSession() {
  const cookieStore = await cookies();
  return getIronSession<SessionData>(cookieStore, sessionOptions);
}
