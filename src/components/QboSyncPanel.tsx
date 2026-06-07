"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

interface SyncResult {
  synced: number;
  skipped: string[];
  errors: string[];
}

export function QboSyncPanel({
  reportId,
  syncedCount,
  totalCount,
  needsSetup,
}: {
  reportId: string;
  syncedCount: number;
  totalCount: number;
  needsSetup: boolean;
}) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<SyncResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const allSynced = totalCount > 0 && syncedCount === totalCount;

  async function send() {
    setBusy(true);
    setError(null);
    setResult(null);
    const res = await fetch(`/api/admin/reports/${reportId}/quickbooks`, {
      method: "POST",
    });
    const data = await res.json().catch(() => ({}));
    setBusy(false);
    if (!res.ok) {
      setError(data.error ?? "Sync failed.");
      return;
    }
    setResult(data);
    router.refresh();
  }

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h2 className="font-semibold text-slate-900">QuickBooks</h2>
          <p className="text-sm text-slate-500">
            {allSynced
              ? "All expenses are in QuickBooks."
              : syncedCount > 0
              ? `${syncedCount} of ${totalCount} expenses synced.`
              : "Post these expenses to QuickBooks as purchases."}
          </p>
        </div>
        {needsSetup ? (
          <a
            href="/admin/settings"
            className="rounded-xl border border-slate-300 px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50"
          >
            Set up
          </a>
        ) : (
          <button
            onClick={send}
            disabled={busy || allSynced}
            className="rounded-xl bg-[#2CA01C] px-4 py-2.5 text-sm font-semibold text-white hover:opacity-90 disabled:opacity-50"
          >
            {busy
              ? "Sending…"
              : syncedCount > 0
              ? "Sync remaining"
              : "Send to QuickBooks"}
          </button>
        )}
      </div>

      {error && (
        <p className="mt-3 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>
      )}

      {result && (
        <div className="mt-3 space-y-2 text-sm">
          {result.synced > 0 && (
            <p className="rounded-lg bg-emerald-50 px-3 py-2 text-emerald-800">
              Sent {result.synced} expense{result.synced === 1 ? "" : "s"} to
              QuickBooks.
            </p>
          )}
          {result.errors.length > 0 && (
            <ul className="rounded-lg bg-red-50 px-3 py-2 text-red-700">
              {result.errors.map((e, i) => (
                <li key={i}>• {e}</li>
              ))}
            </ul>
          )}
          {result.skipped.length > 0 && (
            <ul className="rounded-lg bg-slate-50 px-3 py-2 text-slate-500">
              {result.skipped.map((s, i) => (
                <li key={i}>• Skipped: {s}</li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
