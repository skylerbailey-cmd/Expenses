"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

interface UserRow {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: string;
  createdAt: Date;
}

const ROLE_LABELS: Record<string, string> = {
  EMPLOYEE: "Employee",
  MANAGER: "Manager",
  ADMIN: "Admin",
};

const ROLE_STYLES: Record<string, string> = {
  EMPLOYEE: "bg-gray-100 text-gray-700",
  MANAGER: "bg-blue-100 text-blue-700",
  ADMIN: "bg-violet-100 text-violet-700",
};

export function UserList({
  users,
  currentUserId,
}: {
  users: UserRow[];
  currentUserId: string;
}) {
  const router = useRouter();
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [resettingId, setResettingId] = useState<string | null>(null);
  const [newPassword, setNewPassword] = useState("");

  async function changeRole(userId: string, newRole: string) {
    setBusy(userId);
    setError(null);
    const res = await fetch(`/api/admin/users/${userId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ role: newRole }),
    });
    const data = await res.json().catch(() => ({}));
    setBusy(null);
    if (!res.ok) {
      setError(data.error ?? "Could not update role.");
      return;
    }
    router.refresh();
  }

  async function removeUser(userId: string, name: string) {
    if (
      !confirm(
        `Remove ${name}? This will permanently delete all their reports and receipts.`
      )
    )
      return;
    setBusy(userId);
    setError(null);
    const res = await fetch(`/api/admin/users/${userId}`, {
      method: "DELETE",
    });
    const data = await res.json().catch(() => ({}));
    setBusy(null);
    if (!res.ok) {
      setError(data.error ?? "Could not remove user.");
      return;
    }
    router.refresh();
  }

  async function resetPassword(userId: string) {
    if (newPassword.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }
    setBusy(userId);
    setError(null);
    const res = await fetch(`/api/admin/users/${userId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ newPassword: newPassword }),
    });
    const data = await res.json().catch(() => ({}));
    setBusy(null);
    if (!res.ok) {
      setError(data.error ?? "Could not reset password.");
      return;
    }
    setResettingId(null);
    setNewPassword("");
    setError(null);
    alert("Password has been reset.");
  }

  return (
    <div className="mt-5 space-y-3">
      {error && (
        <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
        </p>
      )}
      {users.length === 0 ? (
        <p className="rounded-2xl border border-dashed border-slate-300 bg-white p-10 text-center text-sm text-slate-500">
          No users found.
        </p>
      ) : (
        <ul className="space-y-2">
          {users.map((u) => {
            const isSelf = u.id === currentUserId;
            const loading = busy === u.id;
            return (
              <li
                key={u.id}
                className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="truncate font-semibold text-slate-900">
                      {u.firstName} {u.lastName}
                      {isSelf && (
                        <span className="ml-2 text-xs font-normal text-slate-400">
                          (you)
                        </span>
                      )}
                    </p>
                    <p className="truncate text-sm text-slate-500">{u.email}</p>
                  </div>
                  <span
                    className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ring-inset ring-transparent ${
                      ROLE_STYLES[u.role] ?? ROLE_STYLES.EMPLOYEE
                    }`}
                  >
                    {ROLE_LABELS[u.role] ?? u.role}
                  </span>
                </div>

                {!isSelf && (
                  <>
                  <div className="mt-3 flex flex-wrap items-center gap-2">
                    <span className="text-xs text-slate-400">Change role:</span>
                    {["EMPLOYEE", "MANAGER", "ADMIN"].map((role) => (
                      <button
                        key={role}
                        onClick={() => changeRole(u.id, role)}
                        disabled={loading || u.role === role}
                        className={`rounded-lg px-3 py-1.5 text-xs font-medium ring-1 ring-inset transition ${
                          u.role === role
                            ? "bg-slate-900 text-white ring-slate-900"
                            : "bg-white text-slate-600 ring-slate-200 hover:ring-slate-300 disabled:opacity-40"
                        }`}
                      >
                        {ROLE_LABELS[role]}
                      </button>
                    ))}
                    <div className="ml-auto flex items-center gap-3">
                      <button
                        onClick={() => {
                          setResettingId(resettingId === u.id ? null : u.id);
                          setNewPassword("");
                        }}
                        disabled={loading}
                        className="text-sm font-medium text-slate-600 hover:text-slate-900 disabled:opacity-40"
                      >
                        Reset password
                      </button>
                      <button
                        onClick={() =>
                          removeUser(u.id, `${u.firstName} ${u.lastName}`)
                        }
                        disabled={loading}
                        className="text-sm font-medium text-red-600 hover:text-red-700 disabled:opacity-40"
                      >
                        {loading ? "..." : "Remove"}
                      </button>
                    </div>
                  </div>

                  {resettingId === u.id && (
                    <div className="mt-3 rounded-lg border border-slate-200 bg-slate-50 p-3">
                      <label className="mb-1 block text-xs font-medium text-slate-600">
                        New password for {u.firstName}
                      </label>
                      <div className="flex gap-2">
                        <input
                          type="text"
                          value={newPassword}
                          onChange={(e) => setNewPassword(e.target.value)}
                          placeholder="Min 8 characters"
                          className="w-full rounded-lg border border-slate-300 px-2.5 py-2 text-sm outline-none focus:border-slate-900"
                        />
                        <button
                          onClick={() => resetPassword(u.id)}
                          disabled={loading || newPassword.length < 8}
                          className="shrink-0 rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-800 disabled:opacity-50"
                        >
                          {loading ? "..." : "Set"}
                        </button>
                      </div>
                    </div>
                  )}
                  </>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
