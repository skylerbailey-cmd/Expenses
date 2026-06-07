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

## Notes for production

- Uploaded receipts are stored on disk in `public/uploads`. For serverless or
  multi-instance hosting, move these to object storage (S3, R2, etc.).
- SQLite is great for a single small-business instance. For higher volume,
  switch the Prisma `datasource` to PostgreSQL and update `DATABASE_URL`.
- Always set a strong `SESSION_PASSWORD` in production.
