import Link from "next/link";
import type { SafeUser } from "@/lib/auth";
import { LogoutButton } from "./LogoutButton";

export function AppHeader({ user }: { user: SafeUser }) {
  const isAdmin = user.role === "ADMIN";
  return (
    <header className="sticky top-0 z-10 border-b border-slate-200 bg-white/90 backdrop-blur">
      <div className="mx-auto flex max-w-3xl items-center justify-between gap-3 px-4 py-3">
        <Link
          href={isAdmin ? "/admin" : "/dashboard"}
          className="flex items-center gap-2 font-semibold text-slate-900"
        >
          <span className="grid h-7 w-7 place-items-center rounded-lg bg-slate-900 text-xs font-bold text-white">
            $
          </span>
          Expenses
        </Link>
        <nav className="flex items-center gap-4">
          {isAdmin ? (
            <Link
              href="/admin"
              className="text-sm font-medium text-slate-600 hover:text-slate-900"
            >
              Admin
            </Link>
          ) : (
            <Link
              href="/dashboard"
              className="text-sm font-medium text-slate-600 hover:text-slate-900"
            >
              My reports
            </Link>
          )}
          <span className="hidden text-sm text-slate-400 sm:inline">
            {user.firstName} {user.lastName}
          </span>
          <LogoutButton />
        </nav>
      </div>
    </header>
  );
}
