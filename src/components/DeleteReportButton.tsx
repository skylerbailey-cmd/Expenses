"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export function DeleteReportButton({ reportId }: { reportId: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function remove() {
    if (!confirm("Delete this empty draft report?")) return;
    setLoading(true);
    const res = await fetch(`/api/reports/${reportId}`, { method: "DELETE" });
    if (res.ok) {
      router.replace("/dashboard");
      router.refresh();
    } else {
      setLoading(false);
    }
  }

  return (
    <button
      onClick={remove}
      disabled={loading}
      className="mt-2 text-sm font-medium text-red-600 hover:text-red-700 disabled:opacity-50"
    >
      {loading ? "Deleting…" : "Delete draft"}
    </button>
  );
}
