"use client";

import { useRouter } from "next/navigation";
import { useRef, useState, useCallback } from "react";

export function ReceiptUploader({
  reportId,
  aiEnabled,
}: {
  reportId: string;
  aiEnabled: boolean;
}) {
  const router = useRouter();
  const galleryRef = useRef<HTMLInputElement>(null);
  const cameraRef = useRef<HTMLInputElement>(null);
  const [staged, setStaged] = useState<File[]>([]);
  const [uploading, setUploading] = useState(false);
  const [status, setStatus] = useState<string | null>(null);
  const [errors, setErrors] = useState<string[]>([]);

  const addFiles = useCallback((files: FileList | null) => {
    if (!files || files.length === 0) return;
    setStaged((prev) => [...prev, ...Array.from(files)]);
    setStatus(null);
    setErrors([]);
  }, []);

  function removeFile(index: number) {
    setStaged((prev) => prev.filter((_, i) => i !== index));
  }

  async function submit() {
    if (staged.length === 0) return;
    setUploading(true);
    setErrors([]);
    setStatus(
      `Uploading ${staged.length} receipt${staged.length === 1 ? "" : "s"}${
        aiEnabled ? " and reading them with AI…" : "…"
      }`
    );

    const body = new FormData();
    staged.forEach((f) => body.append("files", f));

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
        setStaged([]);
        router.refresh();
      }
    } catch {
      setErrors(["Something went wrong while uploading."]);
    } finally {
      setUploading(false);
      if (galleryRef.current) galleryRef.current.value = "";
      if (cameraRef.current) cameraRef.current.value = "";
    }
  }

  return (
    <div className="rounded-2xl border-2 border-dashed border-slate-300 bg-white p-5 text-center">
      {/* Hidden file inputs */}
      <input
        ref={galleryRef}
        type="file"
        accept="image/*,application/pdf"
        multiple
        className="hidden"
        onChange={(e) => {
          addFiles(e.target.files);
          e.target.value = "";
        }}
      />
      <input
        ref={cameraRef}
        type="file"
        accept="image/*"
        capture="environment"
        className="hidden"
        onChange={(e) => {
          addFiles(e.target.files);
          e.target.value = "";
        }}
      />

      {/* Action buttons */}
      <div className="flex flex-wrap items-center justify-center gap-2">
        <button
          onClick={() => galleryRef.current?.click()}
          disabled={uploading}
          className="inline-flex items-center gap-2 rounded-xl bg-slate-900 px-5 py-3 text-sm font-semibold text-white hover:bg-slate-800 disabled:opacity-60"
        >
          🖼️ Choose photos
        </button>
        <button
          onClick={() => cameraRef.current?.click()}
          disabled={uploading}
          className="inline-flex items-center gap-2 rounded-xl bg-slate-700 px-5 py-3 text-sm font-semibold text-white hover:bg-slate-600 disabled:opacity-60"
        >
          📷 Take photo
        </button>
      </div>

      <p className="mt-2 text-xs text-slate-500">
        Add as many receipts as you need, then submit them all at once.
        {aiEnabled
          ? " AI fills in the merchant, amount and date for you."
          : " Enter the details manually after uploading."}
      </p>

      {/* Staged file previews */}
      {staged.length > 0 && (
        <div className="mt-4">
          <p className="mb-2 text-sm font-medium text-slate-700">
            {staged.length} receipt{staged.length === 1 ? "" : "s"} ready
          </p>
          <div className="flex flex-wrap justify-center gap-2">
            {staged.map((file, i) => (
              <div
                key={`${file.name}-${i}`}
                className="group relative h-20 w-20 overflow-hidden rounded-lg border border-slate-200 bg-slate-50"
              >
                {file.type.startsWith("image/") ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={URL.createObjectURL(file)}
                    alt={file.name}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center text-xs text-slate-500">
                    PDF
                  </div>
                )}
                <button
                  onClick={() => removeFile(i)}
                  className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-xs text-white shadow-sm hover:bg-red-600"
                  aria-label={`Remove ${file.name}`}
                >
                  ×
                </button>
              </div>
            ))}
          </div>

          {/* Submit button */}
          <button
            onClick={submit}
            disabled={uploading}
            className="mt-3 inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-6 py-3 text-sm font-semibold text-white hover:bg-emerald-500 disabled:opacity-60"
          >
            {uploading
              ? "Working…"
              : `Submit ${staged.length} receipt${staged.length === 1 ? "" : "s"}`}
          </button>
        </div>
      )}

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
