"use client";

import { useRouter } from "next/navigation";
import { useRef, useState } from "react";

export function ReceiptUploader({
  reportId,
  aiEnabled,
}: {
  reportId: string;
  aiEnabled: boolean;
}) {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [status, setStatus] = useState<string | null>(null);
  const [errors, setErrors] = useState<string[]>([]);

  async function upload(files: FileList | null) {
    if (!files || files.length === 0) return;
    setUploading(true);
    setErrors([]);
    setStatus(
      `Uploading ${files.length} receipt${files.length === 1 ? "" : "s"}${
        aiEnabled ? " and reading them with AI…" : "…"
      }`
    );

    const body = new FormData();
    Array.from(files).forEach((f) => body.append("files", f));

    try {
      const res = await fetch(`/api/reports/${reportId}/expenses`, {
        method: "POST",
        body,
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setErrors([data.error ?? "Upload failed."]);
      } else {
        setStatus(
          `Added ${data.created} expense${data.created === 1 ? "" : "s"}.` +
            (data.aiEnabled ? "" : " Add the details manually below.")
        );
        if (Array.isArray(data.errors)) setErrors(data.errors);
        router.refresh();
      }
    } catch {
      setErrors(["Something went wrong while uploading."]);
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  return (
    <div className="rounded-2xl border-2 border-dashed border-slate-300 bg-white p-5 text-center">
      <input
        ref={inputRef}
        type="file"
        accept="image/*,application/pdf"
        capture="environment"
        multiple
        className="hidden"
        onChange={(e) => upload(e.target.files)}
      />
      <button
        onClick={() => inputRef.current?.click()}
        disabled={uploading}
        className="inline-flex items-center gap-2 rounded-xl bg-slate-900 px-5 py-3 text-sm font-semibold text-white hover:bg-slate-800 disabled:opacity-60"
      >
        {uploading ? "Working…" : "📷 Add receipts"}
      </button>
      <p className="mt-2 text-xs text-slate-500">
        Take a photo or choose one or more images / PDFs.
        {aiEnabled
          ? " AI fills in the merchant, amount and date for you."
          : " Enter the details manually after uploading."}
      </p>
      {status && !uploading && (
        <p className="mt-3 text-sm text-emerald-700">{status}</p>
      )}
      {uploading && status && (
        <p className="mt-3 animate-pulse text-sm text-slate-600">{status}</p>
      )}
      {errors.length > 0 && (
        <ul className="mt-2 space-y-1 text-left text-xs text-red-600">
          {errors.map((e, i) => (
            <li key={i}>• {e}</li>
          ))}
        </ul>
      )}
    </div>
  );
}
