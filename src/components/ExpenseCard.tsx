"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { CATEGORIES } from "@/lib/constants";
import { formatCurrency, formatDate } from "@/lib/format";
import { ReceiptLightbox } from "./ReceiptLightbox";

export interface ExpenseDTO {
  id: string;
  merchant: string | null;
  amount: number | null;
  currency: string;
  category: string | null;
  description: string | null;
  transactionDate: string | null; // YYYY-MM-DD
  needsReview: boolean;
  aiConfidence: string | null;
  images: { id: string; path: string }[];
}

export function ExpenseCard({
  expense,
  editable,
  duplicateWarning,
}: {
  expense: ExpenseDTO;
  editable: boolean;
  duplicateWarning?: string;
}) {
  const router = useRouter();
  const [merchant, setMerchant] = useState(expense.merchant ?? "");
  const [amount, setAmount] = useState(
    expense.amount != null ? String(expense.amount) : ""
  );
  const [date, setDate] = useState(expense.transactionDate ?? "");
  const [category, setCategory] = useState(expense.category ?? "");
  const [description, setDescription] = useState(expense.description ?? "");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const dirty =
    merchant !== (expense.merchant ?? "") ||
    amount !== (expense.amount != null ? String(expense.amount) : "") ||
    date !== (expense.transactionDate ?? "") ||
    category !== (expense.category ?? "") ||
    description !== (expense.description ?? "");

  async function save() {
    setSaving(true);
    setError(null);
    setSaved(false);
    const res = await fetch(`/api/expenses/${expense.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        merchant: merchant.trim() || null,
        amount: amount.trim() ? Number(amount) : null,
        category: category || null,
        description: description.trim() || null,
        transactionDate: date || null,
      }),
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

  async function remove() {
    if (!confirm("Remove this expense and its receipt?")) return;
    const res = await fetch(`/api/expenses/${expense.id}`, { method: "DELETE" });
    if (res.ok) router.refresh();
  }

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
      {duplicateWarning && (
        <p className="mb-3 flex items-start gap-2 rounded-lg bg-amber-50 px-3 py-2 text-sm text-amber-800">
          <span aria-hidden>⚠️</span>
          <span>{duplicateWarning}</span>
        </p>
      )}
      {editable && expense.needsReview && (
        <p className="mb-3 rounded-lg bg-blue-50 px-3 py-2 text-xs text-blue-700">
          AI couldn&apos;t read everything confidently — please double-check the
          fields below.
        </p>
      )}

      {/* Receipt thumbnails — tap to zoom */}
      <div className="flex gap-2 overflow-x-auto pb-2 sm:pb-0">
        {expense.images.map((img) => (
          <ReceiptLightbox key={img.id} src={img.path}>
            <span className="block h-20 w-20 shrink-0 overflow-hidden rounded-lg border border-slate-200 bg-slate-50">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={img.path}
                alt="Receipt"
                className="h-full w-full object-cover"
              />
            </span>
          </ReceiptLightbox>
        ))}
      </div>

      <div className="min-w-0">
          {editable ? (
            <div className="space-y-3">
              {/* Merchant — full width */}
              <Labeled label="Merchant / vendor">
                <input
                  value={merchant}
                  onChange={(e) => setMerchant(e.target.value)}
                  placeholder="e.g. Uber"
                  className="w-full rounded-lg border border-slate-300 px-2.5 py-2 text-sm outline-none focus:border-slate-900"
                />
              </Labeled>

              {/* Amount + Date: stacked on tiny screens, side by side on sm+ */}
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <Labeled label="Amount">
                  <input
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    inputMode="decimal"
                    placeholder="0.00"
                    className="w-full rounded-lg border border-slate-300 px-2.5 py-2 text-sm outline-none focus:border-slate-900"
                  />
                </Labeled>
                <Labeled label="Date">
                  <input
                    type="date"
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    className="w-full rounded-lg border border-slate-300 px-2.5 py-2 text-sm outline-none focus:border-slate-900"
                  />
                </Labeled>
              </div>

              {/* Category — full width */}
              <Labeled label="Category">
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full rounded-lg border border-slate-300 bg-white px-2.5 py-2 text-sm outline-none focus:border-slate-900"
                >
                  <option value="">Select…</option>
                  {CATEGORIES.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </Labeled>

              <Labeled label="Description">
                <input
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="What was this for?"
                  className="w-full rounded-lg border border-slate-300 px-2.5 py-2 text-sm outline-none focus:border-slate-900"
                />
              </Labeled>

              {error && <p className="text-sm text-red-600">{error}</p>}

              <div className="flex items-center justify-between">
                <button
                  onClick={remove}
                  className="text-sm font-medium text-red-600 hover:text-red-700"
                >
                  Remove
                </button>
                <div className="flex items-center gap-3">
                  {saved && !dirty && (
                    <span className="text-xs text-emerald-600">Saved</span>
                  )}
                  <button
                    onClick={save}
                    disabled={saving || !dirty}
                    className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-800 disabled:opacity-40"
                  >
                    {saving ? "Saving…" : "Save"}
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <ReadOnlyExpense expense={expense} />
          )}
        </div>
    </div>
  );
}

function ReadOnlyExpense({ expense }: { expense: ExpenseDTO }) {
  return (
    <dl className="space-y-1 text-sm">
      <div className="flex justify-between">
        <dt className="text-slate-500">Merchant</dt>
        <dd className="font-medium text-slate-900">{expense.merchant ?? "—"}</dd>
      </div>
      <div className="flex justify-between">
        <dt className="text-slate-500">Amount</dt>
        <dd className="font-semibold text-slate-900">
          {formatCurrency(expense.amount, expense.currency)}
        </dd>
      </div>
      <div className="flex justify-between">
        <dt className="text-slate-500">Date</dt>
        <dd className="text-slate-900">{formatDate(expense.transactionDate)}</dd>
      </div>
      <div className="flex justify-between">
        <dt className="text-slate-500">Category</dt>
        <dd className="text-slate-900">{expense.category ?? "—"}</dd>
      </div>
      {expense.description && (
        <div className="flex justify-between gap-4">
          <dt className="text-slate-500">Description</dt>
          <dd className="text-right text-slate-900">{expense.description}</dd>
        </div>
      )}
    </dl>
  );
}

function Labeled({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <span className="mb-1 block text-xs font-medium text-slate-500">{label}</span>
      {children}
    </label>
  );
}
