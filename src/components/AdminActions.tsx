"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export function AdminActions({
  reportId,
  status,
  userRole = "ADMIN",
}: {
  reportId: string;
  status: string;
  userRole?: string;
}) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [returning, setReturning] = useState(false);
  const [note, setNote] = useState("");

  async function act(action: "approve" | "return" | "pay", noteText?: string) {
    setBusy(true);
    setError(null);
    const res = await fetch(`/api/admin/reports/${reportId}/action`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action, note: noteText }),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      setError(data.error ?? "Action failed.");
      setBusy(false);
      return;
    }
    setReturning(false);
    setNote("");
    router.refresh();
  }

  const canApprove = status === "SUBMITTED";
  const canPay = status === "APPROVED" && userRole === "ADMIN";
  const canReturn = status === "SUBMITTED" || status === "APPROVED";

  if (status === "PAID") {
    return (
      <div className="rounded-xl bg-violet-50 px-4 py-3 text-sm font-medium text-violet-700">
        This report has been paid. ✓
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {error && (
        <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>
      )}

      {returning ? (
        <div className="rounded-xl border border-amber-200 bg-amber-50 p-3">
          <label className="mb-1 block text-sm font-medium text-amber-900">
            Why are you returning this report?
          </label>
          <textarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            rows={3}
            placeholder="e.g. The parking receipt is missing the amount."
            className="w-full rounded-lg border border-amber-300 px-3 py-2 text-sm outline-none focus:border-amber-500"
          />
          <div className="mt-2 flex justify-end gap-2">
            <button
              onClick={() => setReturning(false)}
              className="rounded-lg px-3 py-2 text-sm font-medium text-slate-600"
            >
              Cancel
            </button>
            <button
              onClick={() => act("return", note)}
              disabled={busy || !note.trim()}
              className="rounded-lg bg-amber-600 px-4 py-2 text-sm font-semibold text-white hover:bg-amber-700 disabled:opacity-50"
            >
              {busy ? "Returning…" : "Send back to employee"}
            </button>
          </div>
        </div>
      ) : (
        <div className="flex flex-wrap gap-2">
          {canApprove && (
            <button
              onClick={() => act("approve")}
              disabled={busy}
              className="rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-emerald-700 disabled:opacity-50"
            >
              Approve
            </button>
          )}
          {canPay && (
            <button
              onClick={() => act("pay")}
              disabled={busy}
              className="rounded-xl bg-violet-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-violet-700 disabled:opacity-50"
            >
              Submit for payment
            </button>
          )}
          {canReturn && (
            <button
              onClick={() => setReturning(true)}
              disabled={busy}
              className="rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50"
            >
              Return to employee
            </button>
          )}
        </div>
      )}
    </div>
  );
}
