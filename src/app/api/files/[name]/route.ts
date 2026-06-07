import { NextResponse } from "next/server";
import { readFile } from "fs/promises";
import path from "path";
import { getCurrentUser } from "@/lib/auth";
import { uploadPath, CONTENT_TYPE_BY_EXT } from "@/lib/storage";

// Serves an uploaded receipt. Only signed-in users can view receipts.
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ name: string }> }
) {
  const user = await getCurrentUser();
  if (!user) return new NextResponse("Unauthorized", { status: 401 });

  const { name } = await params;
  const safeName = path.basename(name); // prevent path traversal
  const ext = path.extname(safeName).toLowerCase();
  const contentType = CONTENT_TYPE_BY_EXT[ext];
  if (!contentType) return new NextResponse("Not found", { status: 404 });

  try {
    const data = await readFile(uploadPath(safeName));
    return new NextResponse(new Uint8Array(data), {
      headers: {
        "Content-Type": contentType,
        "Cache-Control": "private, max-age=3600",
      },
    });
  } catch {
    return new NextResponse("Not found", { status: 404 });
  }
}
