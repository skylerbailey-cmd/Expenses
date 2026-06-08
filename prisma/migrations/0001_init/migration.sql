-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "firstName" TEXT NOT NULL,
    "lastName" TEXT NOT NULL,
    "role" TEXT NOT NULL DEFAULT 'EMPLOYEE',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "ExpenseReport" (
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

-- CreateTable
CREATE TABLE "Expense" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "reportId" TEXT NOT NULL,
    "company" TEXT,
    "merchant" TEXT,
    "amount" REAL,
    "currency" TEXT NOT NULL DEFAULT 'USD',
    "category" TEXT,
    "description" TEXT,
    "transactionDate" DATETIME,
    "aiRaw" TEXT,
    "aiConfidence" TEXT,
    "needsReview" BOOLEAN NOT NULL DEFAULT false,
    "receiptFlagged" BOOLEAN NOT NULL DEFAULT false,
    "receiptWarning" TEXT,
    "denied" BOOLEAN NOT NULL DEFAULT false,
    "deniedReason" TEXT,
    "qboPurchaseId" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Expense_reportId_fkey" FOREIGN KEY ("reportId") REFERENCES "ExpenseReport" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "ExpenseImage" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "expenseId" TEXT NOT NULL,
    "path" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "ExpenseImage_expenseId_fkey" FOREIGN KEY ("expenseId") REFERENCES "Expense" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

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

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE INDEX "ExpenseReport_userId_idx" ON "ExpenseReport"("userId");

-- CreateIndex
CREATE INDEX "ExpenseReport_status_idx" ON "ExpenseReport"("status");

-- CreateIndex
CREATE INDEX "Expense_reportId_idx" ON "Expense"("reportId");

-- CreateIndex
CREATE INDEX "ExpenseImage_expenseId_idx" ON "ExpenseImage"("expenseId");

