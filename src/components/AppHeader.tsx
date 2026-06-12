"use client";

import Link from "next/link";
import { useState } from "react";
import { LogoutButton } from "./LogoutButton";

interface AppHeaderUser {
  firstName: string;
  lastName: string;
  role: string;
}

export function AppHeader({ user }: { user: AppHeaderUser }) {
  const staff = user.role === "ADMIN" || user.role === "MANAGER";
  const [open, setOpen] = useState(false);

  const linkClass =
    "block text-sm font-medium text-slate-600 hover:text-slate-900 py-2 sm:py-0";

  const navLinks = staff ? (
    <>
      <Link href="/admin" className={linkClass} onClick={() => setOpen(false)}>
        Reports
      </Link>
      <Link href="/admin/employees" className={linkClass} onClick={() => setOpen(false)}>
        Employees
      </Link>
      {user.role === "ADMIN" && (
        <>
          <Link href="/admin/users" className={linkClass} onClick={() => setOpen(false)}>
            Users
          </Link>
          <Link href="/admin/settings" className={linkClass} onClick={() => setOpen(false)}>
            Settings
          </Link>
        </>
      )}
      <Link href="/dashboard" className={linkClass} onClick={() => setOpen(false)}>
        My Expenses
      </Link>
    </>
  ) : (
    <Link href="/dashboard" className={linkClass} onClick={() => setOpen(false)}>
      My reports
    </Link>
  );

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

        {/* Desktop nav */}
        <nav className="hidden items-center gap-4 sm:flex">
          {navLinks}
          <span className="text-sm text-slate-400">
            {user.firstName} {user.lastName}
          </span>
          <LogoutButton />
        </nav>

        {/* Mobile hamburger */}
        <button
          onClick={() => setOpen(!open)}
          className="grid h-9 w-9 place-items-center rounded-lg text-slate-600 hover:bg-slate-100 sm:hidden"
          aria-label="Toggle menu"
        >
          {open ? (
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <line x1="4" y1="4" x2="16" y2="16" />
              <line x1="16" y1="4" x2="4" y2="16" />
            </svg>
          ) : (
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <line x1="3" y1="5" x2="17" y2="5" />
              <line x1="3" y1="10" x2="17" y2="10" />
              <line x1="3" y1="15" x2="17" y2="15" />
            </svg>
          )}
        </button>
      </div>

      {/* Mobile dropdown */}
      {open && (
        <nav className="border-t border-slate-200 px-4 pb-3 sm:hidden">
          <div className="flex flex-col gap-1 pt-2">
            {navLinks}
            <div className="mt-2 flex items-center justify-between border-t border-slate-100 pt-3">
              <span className="text-sm text-slate-400">
                {user.firstName} {user.lastName}
              </span>
              <LogoutButton />
            </div>
          </div>
        </nav>
      )}
    </header>
  );
}
