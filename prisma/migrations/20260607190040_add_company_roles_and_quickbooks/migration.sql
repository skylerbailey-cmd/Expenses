-- AlterTable
ALTER TABLE "Expense" ADD COLUMN "company" TEXT;
ALTER TABLE "Expense" ADD COLUMN "qboPurchaseId" TEXT;

-- CreateTable
CREATE TABLE "QuickBooksConnection" (
    "id" TEXT NOT NULL PRIMARY KEY DEFAULT 'default',
    "realmId" TEXT NOT NULL,
    "environment" TEXT NOT NULL DEFAULT 'production',
    "accessToken" TEXT NOT NULL,
    "refreshToken" TEXT NOT NULL,
    "accessTokenExpiresAt" DATETIME NOT NULL,
    "paymentAccountId" TEXT,
    "paymentAccountName" TEXT,
    "paymentType" TEXT NOT NULL DEFAULT 'CreditCard',
    "connectedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "QboAccountMap" (
    "category" TEXT NOT NULL PRIMARY KEY,
    "accountId" TEXT NOT NULL,
    "accountName" TEXT NOT NULL
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_ExpenseReport" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "title" TEXT NOT NULL,
    "submitterFirstName" TEXT NOT NULL,
    "submitterLastName" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'DRAFT',
    "adminNote" TEXT,
    "userId" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "submittedAt" DATETIME,
    "qboSyncedAt" DATETIME,
    "qboError" TEXT,
    CONSTRAINT "ExpenseReport_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_ExpenseReport" ("adminNote", "createdAt", "id", "status", "submittedAt", "submitterFirstName", "submitterLastName", "title", "updatedAt", "userId") SELECT "adminNote", "createdAt", "id", "status", "submittedAt", "submitterFirstName", "submitterLastName", "title", "updatedAt", "userId" FROM "ExpenseReport";
DROP TABLE "ExpenseReport";
ALTER TABLE "new_ExpenseReport" RENAME TO "ExpenseReport";
CREATE INDEX "ExpenseReport_userId_idx" ON "ExpenseReport"("userId");
CREATE INDEX "ExpenseReport_status_idx" ON "ExpenseReport"("status");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
