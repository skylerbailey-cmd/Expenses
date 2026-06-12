"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export function SubmitReportBar({
  reportId,
  expenseCount,
  duplicateCount,
  missingFieldCount,
}: {
  reportId: string;
  expenseCount: number;
  duplicateCount: number;
  missingFieldCount: number;
}) {
  const router = useRouter();
  const [confirming, setConfirming] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit() {
    setSubmitting(true);
    setError(null);
    const res = await fetch(`/api/reports/${reportId}/submit`, { method: "POST" });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      setError(data.error ?? "Could not submit.");
      setSubmitting(false);
      setConfirming(false);
      return;
    }
    router.refresh();
  }

  function onClick() {
    if (duplicateCount > 0 || missingFieldCount > 0) {
      setConfirming(true);
    } else {
      submit();
    }
  }

  return (
    <>
      <div className="sticky bottom-0 -mx-4 border-t border-slate-200 bg-white/95 px-4 py-3 backdrop-blur">
        <div className="mx-auto flex max-w-3xl items-center justify-between gap-3">
          <p className="text-sm text-slate-500">
            {expenseCount} expense{expenseCount === 1 ? "" : "s"} ready
          </p>
          <div className="flex items-center gap-2">
            <button
              onClick={() => router.push("/dashboard")}
              className="rounded-xl border border-slate-300 bg-white px-5 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50"
            >
              Save &amp; close
            </button>
            <button
              onClick={onClick}
              disabled={submitting || expenseCount === 0}
              className="rounded-xl bg-emerald-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-emerald-700 disabled:opacity-50"
            >
              {submitting ? "Submitting…" : "Submit for approval"}
            </button>
          </div>
        </div>
        {error && (
          <p className="mx-auto mt-2 max-w-3xl text-sm text-red-600">{error}</p>
        )}
      </div>

      {confirming && (
        <div className="fixed inset-0 z-20 flex items-end justify-center bg-black/40 p-4 sm:items-center">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl">
            <h2 className="text-lg font-bold">Submit this report?</h2>
            <ul className="mt-3 space-y-2 text-sm">
              {duplicateCount > 0 && (
                <li className="rounded-lg bg-amber-50 px-3 py-2 text-amber-800">
                  ⚠️ {duplicateCount} expense{duplicateCount === 1 ? "" : "s"} look
                  like possible duplicates. You can still submit.
                </li>
              )}
              {missingFieldCount > 0 && (
                <li className="rounded-lg bg-blue-50 px-3 py-2 text-blue-700">
                  {missingFieldCount} expense{missingFieldCount === 1 ? "" : "s"}{" "}
                  {missingFieldCount === 1 ? "is" : "are"} missing a merchant or
                  amount.
                </li>
              )}
            </ul>
            <p className="mt-3 text-sm text-slate-500">
              Submitting locks the report until your admin reviews it.
            </p>
            <div className="mt-5 flex justify-end gap-3">
              <button
                onClick={() => setConfirming(false)}
                className="rounded-xl px-4 py-2.5 text-sm font-semibold text-slate-600 hover:text-slate-900"
              >
                Keep editing
              </button>
              <button
                onClick={submit}
                disabled={submitting}
                className="rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-emerald-700 disabled:opacity-50"
              >
                {submitting ? "Submitting…" : "Submit anyway"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
