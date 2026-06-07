import "server-only";
import { getIronSession, type SessionOptions } from "iron-session";
import { cookies } from "next/headers";

export interface SessionData {
  userId?: string;
  role?: "EMPLOYEE" | "MANAGER" | "ADMIN";
}

const DEV_FALLBACK = "dev-only-session-secret-change-me-please-32chars";

function getSessionOptions(): SessionOptions {
  const password = process.env.SESSION_PASSWORD || DEV_FALLBACK;

  // Enforce a real secret at runtime in production (checked here rather than at
  // module load so it never breaks the build).
  if (
    process.env.NODE_ENV === "production" &&
    (!process.env.SESSION_PASSWORD || process.env.SESSION_PASSWORD.length < 32)
  ) {
    throw new Error(
      "SESSION_PASSWORD must be set to a string of at least 32 characters in production."
    );
  }

  return {
    password,
    cookieName: "expenses_session",
    cookieOptions: {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
    },
  };
}

export async function getSession() {
  const cookieStore = await cookies();
  return getIronSession<SessionData>(cookieStore, getSessionOptions());
}
