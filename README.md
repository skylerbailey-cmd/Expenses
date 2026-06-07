# Expenses

A mobile-friendly expense app for small businesses. Employees snap photos of
receipts (Uber, parking, meals, etc.), AI reads each receipt and fills in the
merchant, total, date and category, and the employee reviews and submits a
report. Admins approve, edit, return, or mark reports paid.

## Features

- 📷 **Snap & extract** — upload one or many photos/PDFs at once; Claude reads
  each receipt and pre-fills the merchant, total amount, date, category and a
  short description.
- ✅ **Review before submit** — every field is editable; low-confidence
  extractions are flagged for a second look.
- ⚠️ **Duplicate warnings** — likely duplicate receipts are flagged (within a
  report and against the employee's history) but **never block** submission.
- 👤 **Named reports** — each report carries the submitter's first and last name.
- 🔐 **Roles** — employees submit; admins approve / edit / return / mark paid.
- 📒 **QuickBooks Online sync** — approved expenses post to QuickBooks as
  Purchases with their receipt images attached (optional).
- 📱 **Mobile-first** UI that also works great on desktop.

## Tech stack

- Next.js 16 (App Router) + React 19 + TypeScript
- Tailwind CSS v4
- Prisma + SQLite (swap to Postgres for scale)
- Anthropic Claude (vision) for receipt extraction
- iron-session for cookie sessions, bcrypt for passwords

## Getting started

```bash
npm install
cp .env.example .env      # then fill in the values
npm run db:push           # create the SQLite database
npm run dev               # http://localhost:3000
```

### Environment variables

| Variable            | Required | Purpose                                                        |
| ------------------- | -------- | -------------------------------------------------------------- |
| `DATABASE_URL`      | yes      | Database connection (default: local SQLite file).              |
| `SESSION_PASSWORD`  | yes\*    | ≥32-char secret for session cookies (`openssl rand -base64 32`). Required in production. |
| `ANTHROPIC_API_KEY` | no       | Enables AI receipt extraction. Without it, fields are entered manually. |
| `CLAUDE_MODEL`      | no       | Model for extraction (default `claude-sonnet-4-6`).            |
| `ADMIN_EMAIL`       | no       | The first user who registers with this email becomes an admin. |

### Creating the admin account

Either set `ADMIN_EMAIL` before that person registers, or promote an existing
user afterwards:

```bash
npm run make-admin -- you@example.com
```

## Workflow

```
Employee:  DRAFT --submit--> SUBMITTED --> (RETURNED <-> SUBMITTED) --> APPROVED --> PAID
Admin:                       approve / return / edit              mark paid
```

## Deploying to Railway

This app runs as a normal long-lived Node server, so it deploys cleanly to
Railway. The database (SQLite) and uploaded receipts both live on a **Railway
Volume** so they survive restarts and redeploys.

1. **Create the project**: in Railway, _New Project → Deploy from GitHub repo_
   and pick this repository / branch. Railway auto-detects Next.js (Nixpacks)
   and uses `railway.json` for the build and start commands.

2. **Add a Volume** to the service (service → _Variables/Settings → Volumes_).
   Set the **mount path to `/app/data`**.

3. **Set environment variables** on the service:

   | Variable            | Value                                                        |
   | ------------------- | ------------------------------------------------------------ |
   | `DATABASE_URL`      | `file:/app/data/prod.db`                                     |
   | `UPLOAD_DIR`        | `/app/data/uploads`                                          |
   | `SESSION_PASSWORD`  | a 32+ char random string (`openssl rand -base64 32`)         |
   | `ANTHROPIC_API_KEY` | your Anthropic API key (enables AI receipt reading)          |
   | `ADMIN_EMAIL`       | your email — that account becomes admin on first registration |
   | `CLAUDE_MODEL`      | optional, defaults to `claude-sonnet-4-6`                    |

   > If your service runs as a non-root user and hits volume permission errors,
   > also set `RAILWAY_RUN_UID=0`.

4. **Deploy.** On boot the start command runs `prisma migrate deploy` against
   the volume database, then starts the server. Migrations run at start (not
   build) because Railway only mounts the volume at runtime.

5. **Generate a domain** (service → _Settings → Networking → Generate Domain_),
   register with your `ADMIN_EMAIL`, and you're live.

To promote an admin later: open the service shell and run
`npm run make-admin -- you@example.com`.

## QuickBooks Online integration (optional)

When connected, the admin can push an approved report's expenses into QuickBooks
Online — each expense becomes a **Purchase** (with the receipt image attached),
posted to the expense account you map its category to.

**One-time setup:**

1. Go to [developer.intuit.com](https://developer.intuit.com), create an app,
   and add the **Accounting** scope. Copy the app's **Client ID** and
   **Client Secret** (use the *Development* keys with `sandbox`, or *Production*
   keys when going live).
2. In the Intuit app's OAuth settings, add this **Redirect URI** (it's also
   shown on the in-app Settings page):
   `https://YOUR-APP-URL/api/quickbooks/callback`
3. Set these environment variables and redeploy:

   | Variable           | Value                                            |
   | ------------------ | ------------------------------------------------ |
   | `QBO_CLIENT_ID`     | from your Intuit app                             |
   | `QBO_CLIENT_SECRET` | from your Intuit app                             |
   | `QBO_ENVIRONMENT`   | `sandbox` while testing, `production` when live  |
   | `APP_URL`           | your app's public URL (e.g. the Railway domain)  |

4. In the app, sign in as admin → **Settings → Connect to QuickBooks**, approve
   the connection, then pick the **payment account** and map each expense
   **category** to a QuickBooks expense account.

**Using it:** open an **Approved** (or Paid) report → **Send to QuickBooks**.
Already-synced expenses are skipped, so it's safe to click again. Unmapped
categories are reported and skipped rather than failing the whole report.

## Notes for production

- The database and uploaded receipts persist via the Railway Volume mounted at
  `/app/data`. Take periodic volume backups for safety.
- SQLite is great for a single small-business instance. For higher volume,
  switch the Prisma `datasource` to PostgreSQL (e.g. Railway's managed Postgres)
  and update `DATABASE_URL`.
- Receipts are served through an authenticated route (`/api/files/...`), so only
  signed-in users can view them.
- Always set a strong `SESSION_PASSWORD` in production.
