import "server-only";
import Anthropic from "@anthropic-ai/sdk";
import { CATEGORIES } from "./constants";

export interface ExtractedReceipt {
  merchant: string | null;
  amount: number | null;
  currency: string | null;
  category: string | null;
  description: string | null;
  transactionDate: string | null; // ISO YYYY-MM-DD
  confidence: "low" | "medium" | "high";
}

const MODEL = process.env.CLAUDE_MODEL || "claude-sonnet-4-6";

export function aiEnabled(): boolean {
  return Boolean(process.env.ANTHROPIC_API_KEY);
}

const SYSTEM_PROMPT = `You are a meticulous bookkeeping assistant that reads receipts and
extracts the fields needed to file a business expense. You will be given one or more
images (or a PDF) of a single receipt or transaction.

Return ONLY a JSON object with these exact keys:
- "merchant": the company/vendor name (e.g. "Uber", "SpotHero", "Shell"). null if unreadable.
- "amount": the FINAL total charged as a number (include tax & tip). No currency symbol. null if unreadable.
- "currency": ISO 4217 code (e.g. "USD"). Default "USD" if not shown.
- "category": the single best fit from this list: ${CATEGORIES.join(", ")}.
- "description": a short human description of the purchase (e.g. "Uber ride to airport").
- "transactionDate": the date of the transaction in YYYY-MM-DD format. null if unreadable.
- "confidence": "high", "medium", or "low" reflecting how sure you are overall.

Rules:
- The "amount" must be the grand total actually paid, not a subtotal or a single line item.
- If multiple images are provided, treat them as different pages/parts of the SAME receipt.
- Never invent values. Use null when a field is genuinely not present.
- Output raw JSON only. No markdown, no commentary.`;

type ImagePart = {
  base64: string;
  mediaType: string;
};

/**
 * Ask Claude to read receipt image(s) and extract structured expense fields.
 * Returns null when AI is disabled; callers fall back to manual entry.
 */
export async function extractReceipt(
  parts: ImagePart[]
): Promise<ExtractedReceipt | null> {
  if (!aiEnabled() || parts.length === 0) return null;

  const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

  const content: Anthropic.ContentBlockParam[] = parts.map((p) => {
    if (p.mediaType === "application/pdf") {
      return {
        type: "document",
        source: {
          type: "base64",
          media_type: "application/pdf",
          data: p.base64,
        },
      } as Anthropic.ContentBlockParam;
    }
    return {
      type: "image",
      source: {
        type: "base64",
        media_type: p.mediaType as
          | "image/jpeg"
          | "image/png"
          | "image/webp"
          | "image/gif",
        data: p.base64,
      },
    } as Anthropic.ContentBlockParam;
  });

  content.push({
    type: "text",
    text: "Extract the expense fields from this receipt as JSON.",
  });

  const message = await client.messages.create({
    model: MODEL,
    max_tokens: 600,
    system: SYSTEM_PROMPT,
    messages: [{ role: "user", content }],
  });

  const text = message.content
    .filter((b): b is Anthropic.TextBlock => b.type === "text")
    .map((b) => b.text)
    .join("\n")
    .trim();

  return parseExtraction(text);
}

function parseExtraction(text: string): ExtractedReceipt | null {
  // The model is told to return raw JSON, but strip code fences just in case.
  const cleaned = text
    .replace(/^```(?:json)?/i, "")
    .replace(/```$/, "")
    .trim();

  const start = cleaned.indexOf("{");
  const end = cleaned.lastIndexOf("}");
  if (start === -1 || end === -1) return null;

  try {
    const raw = JSON.parse(cleaned.slice(start, end + 1));
    const amount =
      typeof raw.amount === "number"
        ? raw.amount
        : raw.amount != null
        ? Number(String(raw.amount).replace(/[^0-9.]/g, ""))
        : null;

    const category =
      raw.category && CATEGORIES.includes(raw.category)
        ? raw.category
        : raw.category
        ? "Other"
        : null;

    return {
      merchant: raw.merchant ? String(raw.merchant) : null,
      amount: amount != null && !Number.isNaN(amount) ? amount : null,
      currency: raw.currency ? String(raw.currency).toUpperCase() : "USD",
      category,
      description: raw.description ? String(raw.description) : null,
      transactionDate: normalizeDate(raw.transactionDate),
      confidence: ["low", "medium", "high"].includes(raw.confidence)
        ? raw.confidence
        : "medium",
    };
  } catch {
    return null;
  }
}

function normalizeDate(value: unknown): string | null {
  if (!value) return null;
  const d = new Date(String(value));
  if (Number.isNaN(d.getTime())) return null;
  return d.toISOString().slice(0, 10);
}
