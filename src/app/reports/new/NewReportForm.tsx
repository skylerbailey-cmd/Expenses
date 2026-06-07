"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export function NewReportForm({
  defaultFirstName,
  defaultLastName,
}: {
  defaultFirstName: string;
  defaultLastName: string;
}) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    const form = new FormData(e.currentTarget);
    const res = await fetch("/api/reports", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title: form.get("title"),
        firstName: form.get("firstName"),
        lastName: form.get("lastName"),
      }),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      setError(data.error ?? "Could not create report.");
      setLoading(false);
      return;
    }
    router.replace(`/reports/${data.id}`);
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <Field label="Report title" name="title" placeholder="e.g. June client visit" required />
      <div className="grid grid-cols-2 gap-3">
        <Field label="First name" name="firstName" defaultValue={defaultFirstName} required />
        <Field label="Last name" name="lastName" defaultValue={defaultLastName} required />
      </div>
      {error && (
        <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>
      )}
      <button
        type="submit"
        disabled={loading}
        className="w-full rounded-xl bg-slate-900 px-4 py-3 text-sm font-semibold text-white hover:bg-slate-800 disabled:opacity-60"
      >
        {loading ? "Creating…" : "Create & add receipts"}
      </button>
    </form>
  );
}

function Field({
  label,
  ...props
}: { label: string } & React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <label className="block">
      <span className="mb-1 block text-sm font-medium text-slate-700">{label}</span>
      <input
        {...props}
        className="w-full rounded-xl border border-slate-300 px-3 py-2.5 outline-none focus:border-slate-900 focus:ring-2 focus:ring-slate-900/10"
      />
    </label>
  );
}
