"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export function DeleteReportButton({ reportId }: { reportId: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function remove() {
    if (!confirm("Delete this report and all its receipts? This cannot be undone.")) return;
    setLoading(true);
    const res = await fetch(`/api/reports/${reportId}`, { method: "DELETE" });
    if (res.ok) {
      router.replace("/dashboard");
      router.refresh();
    } else {
      const data = await res.json().catch(() => ({}));
      alert(data.error ?? "Could not delete report.");
      setLoading(false);
    }
  }

  return (
    <button
      onClick={remove}
      disabled={loading}
      className="text-sm font-medium text-red-600 hover:text-red-700 disabled:opacity-50"
    >
      {loading ? "Deleting…" : "Delete report"}
    </button>
  );
}
