import "server-only";
import { redirect } from "next/navigation";
import { prisma } from "./db";
import { getSession } from "./session";

export type Role = "EMPLOYEE" | "MANAGER" | "ADMIN";

export type SafeUser = {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: Role;
};

/** Returns the logged-in user, or null if not authenticated. */
export async function getCurrentUser(): Promise<SafeUser | null> {
  const session = await getSession();
  if (!session.userId) return null;

  const user = await prisma.user.findUnique({ where: { id: session.userId } });
  if (!user) return null;

  return {
    id: user.id,
    email: user.email,
    firstName: user.firstName,
    lastName: user.lastName,
    role: user.role as Role,
  };
}

/** Use in pages: redirects to /login when not authenticated. */
export async function requireUser(): Promise<SafeUser> {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  return user;
}

/** Returns true when the role has access to the admin / manager console. */
export function isStaff(role: Role): boolean {
  return role === "ADMIN" || role === "MANAGER";
}

/** Use in pages: redirects non-staff (employees) away. */
export async function requireAdmin(): Promise<SafeUser> {
  const user = await requireUser();
  if (!isStaff(user.role)) redirect("/dashboard");
  return user;
}
