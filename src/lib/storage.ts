import "server-only";
import { mkdir, writeFile, unlink } from "fs/promises";
import path from "path";
import { randomUUID } from "crypto";

const UPLOAD_DIR = path.join(process.cwd(), "public", "uploads");

const ALLOWED_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/heic",
  "image/heif",
  "application/pdf",
]);

const EXT_BY_TYPE: Record<string, string> = {
  "image/jpeg": ".jpg",
  "image/png": ".png",
  "image/webp": ".webp",
  "image/heic": ".heic",
  "image/heif": ".heif",
  "application/pdf": ".pdf",
};

export const MAX_FILE_BYTES = 15 * 1024 * 1024; // 15 MB per file

export function isAllowedType(type: string): boolean {
  return ALLOWED_TYPES.has(type);
}

/**
 * Persist an uploaded file to /public/uploads and return its public web path.
 */
export async function saveUpload(file: File): Promise<string> {
  await mkdir(UPLOAD_DIR, { recursive: true });
  const ext = EXT_BY_TYPE[file.type] ?? ".bin";
  const name = `${randomUUID()}${ext}`;
  const buffer = Buffer.from(await file.arrayBuffer());
  await writeFile(path.join(UPLOAD_DIR, name), buffer);
  return `/uploads/${name}`;
}

/** Best-effort delete of a stored upload given its public path. */
export async function deleteUpload(webPath: string): Promise<void> {
  if (!webPath.startsWith("/uploads/")) return;
  const filename = path.basename(webPath);
  try {
    await unlink(path.join(UPLOAD_DIR, filename));
  } catch {
    // File may already be gone; ignore.
  }
}
