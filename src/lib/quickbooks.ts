import "server-only";
import { prisma } from "./db";

// ---------------------------------------------------------------------------
// Configuration
// ---------------------------------------------------------------------------

export const QBO_SCOPE = "com.intuit.quickbooks.accounting";
const AUTH_URL = "https://appcenter.intuit.com/connect/oauth2";
const TOKEN_URL = "https://oauth.platform.intuit.com/oauth2/v1/tokens/bearer";
const REVOKE_URL = "https://developer.api.intuit.com/v2/oauth2/tokens/revoke";
const MINOR_VERSION = "73";

export function qboConfigured(): boolean {
  return Boolean(process.env.QBO_CLIENT_ID && process.env.QBO_CLIENT_SECRET);
}

export function qboEnvironment(): "sandbox" | "production" {
  return process.env.QBO_ENVIRONMENT === "sandbox" ? "sandbox" : "production";
}

function apiBase(env: string): string {
  return env === "sandbox"
    ? "https://sandbox-quickbooks.api.intuit.com"
    : "https://quickbooks.api.intuit.com";
}

/** Base URL of this app, used to build the OAuth redirect URI. */
export function appUrl(): string {
  return (process.env.APP_URL || "http://localhost:3000").replace(/\/$/, "");
}

export function redirectUri(): string {
  return `${appUrl()}/api/quickbooks/callback`;
}

// ---------------------------------------------------------------------------
// OAuth flow
// ---------------------------------------------------------------------------

export function buildAuthUrl(state: string): string {
  const params = new URLSearchParams({
    client_id: process.env.QBO_CLIENT_ID!,
    response_type: "code",
    scope: QBO_SCOPE,
    redirect_uri: redirectUri(),
    state,
  });
  return `${AUTH_URL}?${params.toString()}`;
}

function basicAuthHeader(): string {
  const creds = `${process.env.QBO_CLIENT_ID}:${process.env.QBO_CLIENT_SECRET}`;
  return `Basic ${Buffer.from(creds).toString("base64")}`;
}

interface TokenResponse {
  access_token: string;
  refresh_token: string;
  expires_in: number; // seconds
}

async function requestToken(body: URLSearchParams): Promise<TokenResponse> {
  const res = await fetch(TOKEN_URL, {
    method: "POST",
    headers: {
      Authorization: basicAuthHeader(),
      "Content-Type": "application/x-www-form-urlencoded",
      Accept: "application/json",
    },
    body,
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`QuickBooks token request failed (${res.status}): ${text}`);
  }
  return (await res.json()) as TokenResponse;
}

/** Exchange the OAuth authorization code for tokens and persist the connection. */
export async function exchangeCodeAndSave(code: string, realmId: string) {
  const tokens = await requestToken(
    new URLSearchParams({
      grant_type: "authorization_code",
      code,
      redirect_uri: redirectUri(),
    })
  );

  const expiresAt = new Date(Date.now() + tokens.expires_in * 1000);
  await prisma.quickBooksConnection.upsert({
    where: { id: "default" },
    create: {
      id: "default",
      realmId,
      environment: qboEnvironment(),
      accessToken: tokens.access_token,
      refreshToken: tokens.refresh_token,
      accessTokenExpiresAt: expiresAt,
    },
    update: {
      realmId,
      environment: qboEnvironment(),
      accessToken: tokens.access_token,
      refreshToken: tokens.refresh_token,
      accessTokenExpiresAt: expiresAt,
    },
  });
}

export async function getConnection() {
  return prisma.quickBooksConnection.findUnique({ where: { id: "default" } });
}

export async function disconnect() {
  const conn = await getConnection();
  if (conn) {
    // Best-effort token revocation.
    try {
      await fetch(REVOKE_URL, {
        method: "POST",
        headers: {
          Authorization: basicAuthHeader(),
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ token: conn.refreshToken }),
      });
    } catch {
      // ignore
    }
    await prisma.quickBooksConnection.delete({ where: { id: "default" } });
  }
}

/**
 * Return a valid access token, refreshing it (and the rotating refresh token)
 * when it is within 2 minutes of expiry.
 */
async function getValidAccessToken(): Promise<{ token: string; realmId: string; env: string }> {
  const conn = await getConnection();
  if (!conn) throw new Error("QuickBooks is not connected.");

  const stale = conn.accessTokenExpiresAt.getTime() - Date.now() < 2 * 60 * 1000;
  if (!stale) {
    return { token: conn.accessToken, realmId: conn.realmId, env: conn.environment };
  }

  const tokens = await requestToken(
    new URLSearchParams({
      grant_type: "refresh_token",
      refresh_token: conn.refreshToken,
    })
  );
  const expiresAt = new Date(Date.now() + tokens.expires_in * 1000);
  const updated = await prisma.quickBooksConnection.update({
    where: { id: "default" },
    data: {
      accessToken: tokens.access_token,
      // Intuit rotates refresh tokens; persist the new one when provided.
      refreshToken: tokens.refresh_token || conn.refreshToken,
      accessTokenExpiresAt: expiresAt,
    },
  });
  return { token: updated.accessToken, realmId: updated.realmId, env: updated.environment };
}

// ---------------------------------------------------------------------------
// API calls
// ---------------------------------------------------------------------------

async function qboFetch(path: string, init: RequestInit = {}) {
  const { token, realmId, env } = await getValidAccessToken();
  const url = `${apiBase(env)}/v3/company/${realmId}${path}`;
  const res = await fetch(url, {
    ...init,
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: "application/json",
      ...(init.headers || {}),
    },
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`QuickBooks API ${path} failed (${res.status}): ${text}`);
  }
  return res.json();
}

export interface QboAccount {
  id: string;
  name: string;
  accountType: string;
  classification: string;
}

/** Fetch the chart of accounts (used to populate the mapping dropdowns). */
export async function listAccounts(): Promise<QboAccount[]> {
  const query = "select Id, Name, AccountType, Classification from Account where Active = true MAXRESULTS 1000";
  const data = await qboFetch(
    `/query?query=${encodeURIComponent(query)}&minorversion=${MINOR_VERSION}`
  );
  const accounts = data?.QueryResponse?.Account ?? [];
  return accounts.map((a: Record<string, unknown>) => ({
    id: String(a.Id),
    name: String(a.Name),
    accountType: String(a.AccountType ?? ""),
    classification: String(a.Classification ?? ""),
  }));
}

interface PurchaseInput {
  amount: number;
  expenseAccountId: string;
  paymentAccountId: string;
  paymentType: string;
  txnDate: string | null; // YYYY-MM-DD
  memo: string;
}

/** Create a Purchase (expense) in QuickBooks; returns the new Purchase id. */
export async function createPurchase(input: PurchaseInput): Promise<string> {
  const body: Record<string, unknown> = {
    AccountRef: { value: input.paymentAccountId },
    PaymentType: input.paymentType,
    Line: [
      {
        Amount: Number(input.amount.toFixed(2)),
        DetailType: "AccountBasedExpenseLineDetail",
        AccountBasedExpenseLineDetail: {
          AccountRef: { value: input.expenseAccountId },
        },
      },
    ],
    PrivateNote: input.memo,
  };
  if (input.txnDate) body.TxnDate = input.txnDate;

  const data = await qboFetch(`/purchase?minorversion=${MINOR_VERSION}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  return String(data?.Purchase?.Id);
}

/** Upload a receipt file and attach it to a Purchase via the /upload endpoint. */
export async function attachReceipt(
  purchaseId: string,
  file: { data: Buffer; fileName: string; contentType: string }
): Promise<void> {
  const metadata = {
    AttachableRef: [
      {
        EntityRef: { type: "Purchase", value: purchaseId },
        IncludeOnSend: false,
      },
    ],
    FileName: file.fileName,
    ContentType: file.contentType,
  };

  const form = new FormData();
  form.append(
    "file_metadata_01",
    new Blob([JSON.stringify(metadata)], { type: "application/json" })
  );
  form.append(
    "file_content_01",
    new Blob([new Uint8Array(file.data)], { type: file.contentType }),
    file.fileName
  );

  // multipart boundary is set automatically by fetch when given FormData.
  await qboFetch(`/upload?minorversion=${MINOR_VERSION}`, {
    method: "POST",
    body: form,
  });
}
