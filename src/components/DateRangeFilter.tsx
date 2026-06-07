"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useCallback } from "react";

export function DateRangeFilter() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const from = searchParams.get("from") ?? "";
  const to = searchParams.get("to") ?? "";

  const update = useCallback(
    (key: string, value: string) => {
      const params = new URLSearchParams(searchParams.toString());
      if (value) {
        params.set(key, value);
      } else {
        params.delete(key);
      }
      router.push(`?${params.toString()}`);
    },
    [router, searchParams]
  );

  function clear() {
    const params = new URLSearchParams(searchParams.toString());
    params.delete("from");
    params.delete("to");
    router.push(`?${params.toString()}`);
  }

  return (
    <div className="flex flex-wrap items-end gap-3">
      <label className="block">
        <span className="mb-1 block text-xs font-medium text-slate-500">
          Submitted from
        </span>
        <input
          type="date"
          value={from}
          onChange={(e) => update("from", e.target.value)}
          className="rounded-lg border border-slate-300 px-2.5 py-2 text-sm outline-none focus:border-slate-900"
        />
      </label>
      <label className="block">
        <span className="mb-1 block text-xs font-medium text-slate-500">
          Submitted to
        </span>
        <input
          type="date"
          value={to}
          onChange={(e) => update("to", e.target.value)}
          className="rounded-lg border border-slate-300 px-2.5 py-2 text-sm outline-none focus:border-slate-900"
        />
      </label>
      {(from || to) && (
        <button
          onClick={clear}
          className="rounded-lg px-3 py-2 text-sm font-medium text-slate-500 hover:text-slate-900"
        >
          Clear
        </button>
      )}
    </div>
  );
}
