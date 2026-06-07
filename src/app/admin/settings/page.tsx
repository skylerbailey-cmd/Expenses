import Link from "next/link";
import { redirect } from "next/navigation";
import { requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { AppHeader } from "@/components/AppHeader";
import {
  qboConfigured,
  qboEnvironment,
  getConnection,
  listAccounts,
  redirectUri,
  type QboAccount,
} from "@/lib/quickbooks";
import { CATEGORIES } from "@/lib/constants";
import { QboSettingsForm } from "./QboSettingsForm";

export const dynamic = "force-dynamic";

const BANNERS: Record<string, { text: string; tone: "ok" | "warn" }> = {
  connected: { text: "QuickBooks connected successfully.", tone: "ok" },
  denied: { text: "QuickBooks authorization was cancelled.", tone: "warn" },
  badstate: { text: "Connection failed (security check). Please try again.", tone: "warn" },
  error: { text: "Could not complete the QuickBooks connection.", tone: "warn" },
  notconfigured: { text: "QuickBooks API keys are not set on the server yet.", tone: "warn" },
};

export default async function SettingsPage({
  searchParams,
}: {
  searchParams: Promise<{ qbo?: string }>;
}) {
  const user = await requireAdmin();
  // QuickBooks settings are admin-only (managers can review reports but not
  // manage integrations).
  if (user.role !== "ADMIN") redirect("/admin");
  const { qbo } = await searchParams;
  const banner = qbo ? BANNERS[qbo] : undefined;

  const configured = qboConfigured();
  const connection = configured ? await getConnection() : null;

  let accounts: QboAccount[] = [];
  let accountsError: string | null = null;
  if (connection) {
    try {
      accounts = await listAccounts();
    } catch (err) {
      accountsError =
        err instanceof Error ? err.message : "Could not load QuickBooks accounts.";
    }
  }

  const existingMaps = connection ? await prisma.qboAccountMap.findMany() : [];

  // Split accounts into the two roles we need.
  const paymentAccounts = accounts.filter((a) =>
    ["Bank", "Credit Card"].includes(a.accountType)
  );
  const expenseAccounts = accounts.filter(
    (a) => a.classification === "Expense"
  );

  return (
    <>
      <AppHeader user={user} />
      <main className="mx-auto max-w-3xl px-4 py-6">
        <h1 className="text-xl font-bold tracking-tight">Settings</h1>
        <p className="mb-5 text-sm text-slate-500">
          Connect QuickBooks Online so approved expenses post automatically.
        </p>

        {banner && (
          <div
            className={`mb-5 rounded-xl px-4 py-3 text-sm ${
              banner.tone === "ok"
                ? "bg-emerald-50 text-emerald-800"
                : "bg-amber-50 text-amber-800"
            }`}
          >
            {banner.text}
          </div>
        )}

        <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <h2 className="font-semibold text-slate-900">QuickBooks Online</h2>
            <span
              className={`rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ring-inset ${
                connection
                  ? "bg-emerald-100 text-emerald-700 ring-emerald-200"
                  : "bg-slate-100 text-slate-600 ring-slate-200"
              }`}
            >
              {connection ? "Connected" : "Not connected"}
            </span>
          </div>

          {!configured ? (
            <div className="mt-4 space-y-2 text-sm text-slate-600">
              <p>
                To enable this, set these environment variables on the server and
                redeploy:
              </p>
              <ul className="list-inside list-disc rounded-lg bg-slate-50 p-3 font-mono text-xs">
                <li>QBO_CLIENT_ID</li>
                <li>QBO_CLIENT_SECRET</li>
                <li>QBO_ENVIRONMENT (sandbox or production)</li>
                <li>APP_URL (this app&apos;s public URL)</li>
              </ul>
              <p>
                Get the keys from your app at{" "}
                <a
                  className="underline"
                  href="https://developer.intuit.com"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  developer.intuit.com
                </a>
                . Register this exact redirect URI on that app:
              </p>
              <code className="block rounded-lg bg-slate-900 px-3 py-2 text-xs text-white">
                {redirectUri()}
              </code>
            </div>
          ) : !connection ? (
            <div className="mt-4 space-y-3 text-sm text-slate-600">
              <p>
                Environment: <strong>{qboEnvironment()}</strong>. Make sure this
                redirect URI is registered on your Intuit app:
              </p>
              <code className="block rounded-lg bg-slate-900 px-3 py-2 text-xs text-white">
                {redirectUri()}
              </code>
              <a
                href="/api/quickbooks/connect"
                className="inline-block rounded-xl bg-[#2CA01C] px-5 py-2.5 text-sm font-semibold text-white hover:opacity-90"
              >
                Connect to QuickBooks
              </a>
            </div>
          ) : (
            <div className="mt-4">
              <p className="text-sm text-slate-600">
                Connected to company <strong>{connection.realmId}</strong> (
                {connection.environment}).
              </p>
              {accountsError ? (
                <p className="mt-3 rounded-lg bg-amber-50 px-3 py-2 text-sm text-amber-800">
                  Couldn&apos;t load your chart of accounts: {accountsError} Try
                  reconnecting.
                </p>
              ) : (
                <QboSettingsForm
                  paymentAccounts={paymentAccounts}
                  expenseAccounts={expenseAccounts}
                  categories={[...CATEGORIES]}
                  initial={{
                    paymentAccountId: connection.paymentAccountId,
                    paymentType: connection.paymentType,
                    mappings: Object.fromEntries(
                      existingMaps.map((m) => [m.category, m.accountId])
                    ),
                  }}
                />
              )}
            </div>
          )}
        </section>

        <p className="mt-4 text-center text-sm text-slate-400">
          <Link href="/admin" className="hover:text-slate-600">
            ← Back to reports
          </Link>
        </p>
      </main>
    </>
  );
}
