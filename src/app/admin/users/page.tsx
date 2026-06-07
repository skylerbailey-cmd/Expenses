import { requireAdmin } from "@/lib/auth";
import { redirect } from "next/navigation";
import { AppHeader } from "@/components/AppHeader";
import { UserList } from "@/components/UserList";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

export default async function UsersPage() {
  const user = await requireAdmin();

  // Only full admins can manage users.
  if (user.role !== "ADMIN") redirect("/admin");

  const users = await prisma.user.findMany({
    select: {
      id: true,
      email: true,
      firstName: true,
      lastName: true,
      role: true,
      createdAt: true,
    },
    orderBy: { createdAt: "desc" },
  });

  return (
    <>
      <AppHeader user={user} />
      <main className="mx-auto max-w-3xl px-4 py-6">
        <h1 className="text-xl font-bold tracking-tight">Users</h1>
        <p className="mt-1 text-sm text-slate-500">
          Manage user roles and accounts.
        </p>
        <UserList users={users} currentUserId={user.id} />
      </main>
    </>
  );
}
