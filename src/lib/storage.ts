import "server-only";
import { mkdir, writeFile, unlink } from "fs/promises";
import path from "path";
import { randomUUID } from "crypto";

// Where uploaded receipts are stored on disk.
// - Local dev: <project>/uploads
// - Railway/containers: set UPLOAD_DIR to a path on a persistent Volume,
//   e.g. /app/data/uploads (RAILWAY_VOLUME_MOUNT_PATH is also honored).
export const UPLOAD_DIR =
  process.env.UPLOAD_DIR ||
  (process.env.RAILWAY_VOLUME_MOUNT_PATH
    ? path.join(process.env.RAILWAY_VOLUME_MOUNT_PATH, "uploads")
    : path.join(process.cwd(), "uploads"));

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

export const CONTENT_TYPE_BY_EXT: Record<string, string> = {
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".png": "image/png",
  ".webp": "image/webp",
  ".heic": "image/heic",
  ".heif": "image/heif",
  ".pdf": "application/pdf",
};

export const MAX_FILE_BYTES = 15 * 1024 * 1024; // 15 MB per file

export function isAllowedType(type: string): boolean {
  return ALLOWED_TYPES.has(type);
}

/** Absolute path on disk for a stored file name (guards against traversal). */
export function uploadPath(name: string): string {
  return path.join(UPLOAD_DIR, path.basename(name));
}

/**
 * Persist an uploaded file and return the URL the app uses to serve it back.
 * Files are served through /api/files/<name> rather than statically, so the
 * storage directory can live anywhere (including a mounted volume).
 */
export async function saveUpload(file: File): Promise<string> {
  await mkdir(UPLOAD_DIR, { recursive: true });
  const ext = EXT_BY_TYPE[file.type] ?? ".bin";
  const name = `${randomUUID()}${ext}`;
  const buffer = Buffer.from(await file.arrayBuffer());
  await writeFile(uploadPath(name), buffer);
  return `/api/files/${name}`;
}

/** Best-effort delete of a stored upload given its served URL. */
export async function deleteUpload(fileUrl: string): Promise<void> {
  const name = path.basename(fileUrl);
  if (!name) return;
  try {
    await unlink(uploadPath(name));
  } catch {
    // File may already be gone; ignore.
  }
}
