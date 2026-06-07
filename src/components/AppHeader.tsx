import Link from "next/link";
import type { SafeUser } from "@/lib/auth";
import { isStaff } from "@/lib/auth";
import { LogoutButton } from "./LogoutButton";

export function AppHeader({ user }: { user: SafeUser }) {
  const staff = isStaff(user.role);
  return (
    <header className="sticky top-0 z-10 border-b border-slate-200 bg-white/90 backdrop-blur">
      <div className="mx-auto flex max-w-3xl items-center justify-between gap-3 px-4 py-3">
        <Link
          href={staff ? "/admin" : "/dashboard"}
          className="flex items-center gap-2 font-semibold text-slate-900"
        >
          <span className="grid h-7 w-7 place-items-center rounded-lg bg-slate-900 text-xs font-bold text-white">
            $
          </span>
          Expenses
        </Link>
        <nav className="flex items-center gap-4">
          {staff ? (
            <>
              <Link
                href="/admin"
                className="text-sm font-medium text-slate-600 hover:text-slate-900"
              >
                Reports
              </Link>
              <Link
                href="/admin/employees"
                className="text-sm font-medium text-slate-600 hover:text-slate-900"
              >
                Employees
              </Link>
              {user.role === "ADMIN" && (
                <>
                  <Link
                    href="/admin/users"
                    className="text-sm font-medium text-slate-600 hover:text-slate-900"
                  >
                    Users
                  </Link>
                  <Link
                    href="/admin/settings"
                    className="text-sm font-medium text-slate-600 hover:text-slate-900"
                  >
                    Settings
                  </Link>
                </>
              )}
            </>
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
