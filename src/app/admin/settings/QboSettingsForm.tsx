"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import type { QboAccount } from "@/lib/quickbooks";

interface Props {
  paymentAccounts: QboAccount[];
  expenseAccounts: QboAccount[];
  categories: string[];
  initial: {
    paymentAccountId: string | null;
    paymentType: string;
    mappings: Record<string, string>; // category -> accountId
  };
}

export function QboSettingsForm({
  paymentAccounts,
  expenseAccounts,
  categories,
  initial,
}: Props) {
  const router = useRouter();
  const [paymentAccountId, setPaymentAccountId] = useState(
    initial.paymentAccountId ?? ""
  );
  const [paymentType, setPaymentType] = useState(initial.paymentType ?? "CreditCard");
  const [mappings, setMappings] = useState<Record<string, string>>(initial.mappings);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [disconnecting, setDisconnecting] = useState(false);

  function nameOf(list: QboAccount[], idval: string) {
    return list.find((a) => a.id === idval)?.name ?? "";
  }

  async function save() {
    setError(null);
    setSaved(false);
    if (!paymentAccountId) {
      setError("Choose a payment account.");
      return;
    }
    setSaving(true);
    const body = {
      paymentAccountId,
      paymentAccountName: nameOf(paymentAccounts, paymentAccountId),
      paymentType,
      mappings: Object.fromEntries(
        Object.entries(mappings)
          .filter(([, accId]) => accId)
          .map(([cat, accId]) => [
            cat,
            { accountId: accId, accountName: nameOf(expenseAccounts, accId) },
          ])
      ),
    };
    const res = await fetch("/api/admin/quickbooks/settings", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    const data = await res.json().catch(() => ({}));
    setSaving(false);
    if (!res.ok) {
      setError(data.error ?? "Could not save.");
      return;
    }
    setSaved(true);
    router.refresh();
  }

  async function disconnect() {
    if (!confirm("Disconnect QuickBooks? Synced expenses stay in QuickBooks.")) return;
    setDisconnecting(true);
    await fetch("/api/quickbooks/disconnect", { method: "POST" });
    router.refresh();
  }

  return (
    <div className="mt-4 space-y-5">
      <div className="grid gap-3 sm:grid-cols-2">
        <label className="block">
          <span className="mb-1 block text-sm font-medium text-slate-700">
            Pay expenses from
          </span>
          <select
            value={paymentAccountId}
            onChange={(e) => setPaymentAccountId(e.target.value)}
            className="w-full rounded-lg border border-slate-300 bg-white px-2.5 py-2 text-sm"
          >
            <option value="">Select an account…</option>
            {paymentAccounts.map((a) => (
              <option key={a.id} value={a.id}>
                {a.name} ({a.accountType})
              </option>
            ))}
          </select>
        </label>
        <label className="block">
          <span className="mb-1 block text-sm font-medium text-slate-700">
            Payment type
          </span>
          <select
            value={paymentType}
            onChange={(e) => setPaymentType(e.target.value)}
            className="w-full rounded-lg border border-slate-300 bg-white px-2.5 py-2 text-sm"
          >
            <option value="CreditCard">Credit Card</option>
            <option value="Cash">Cash</option>
            <option value="Check">Check</option>
          </select>
        </label>
      </div>

      <div>
        <h3 className="mb-2 text-sm font-semibold text-slate-700">
          Map categories to QuickBooks accounts
        </h3>
        <div className="space-y-2">
          {categories.map((cat) => (
            <div key={cat} className="flex items-center gap-3">
              <span className="w-32 shrink-0 text-sm text-slate-600">{cat}</span>
              <select
                value={mappings[cat] ?? ""}
                onChange={(e) =>
                  setMappings((m) => ({ ...m, [cat]: e.target.value }))
                }
                className="min-w-0 flex-1 rounded-lg border border-slate-300 bg-white px-2.5 py-2 text-sm"
              >
                <option value="">Not mapped (skip)</option>
                {expenseAccounts.map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.name}
                  </option>
                ))}
              </select>
            </div>
          ))}
        </div>
        <p className="mt-2 text-xs text-slate-400">
          Unmapped categories are skipped during sync (you&apos;ll be told which).
        </p>
      </div>

      {error && (
        <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>
      )}

      <div className="flex items-center justify-between">
        <button
          onClick={disconnect}
          disabled={disconnecting}
          className="text-sm font-medium text-red-600 hover:text-red-700 disabled:opacity-50"
        >
          {disconnecting ? "Disconnecting…" : "Disconnect"}
        </button>
        <div className="flex items-center gap-3">
          {saved && <span className="text-xs text-emerald-600">Saved</span>}
          <button
            onClick={save}
            disabled={saving}
            className="rounded-xl bg-slate-900 px-5 py-2.5 text-sm font-semibold text-white hover:bg-slate-800 disabled:opacity-50"
          >
            {saving ? "Saving…" : "Save settings"}
          </button>
        </div>
      </div>
    </div>
  );
}
