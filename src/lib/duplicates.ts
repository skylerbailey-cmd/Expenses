// Duplicate detection. We WARN about likely duplicates but never block submission.

export interface DupCandidate {
  id: string;
  merchant: string | null;
  amount: number | null;
  transactionDate: Date | string | null;
  reportId: string;
  reportTitle?: string;
}

export interface DuplicateWarning {
  expenseId: string;
  message: string;
  // The other expense(s) this one resembles.
  matches: { id: string; reportId: string; reportTitle?: string }[];
}

function normMerchant(m: string | null): string {
  return (m ?? "").toLowerCase().replace(/[^a-z0-9]/g, "");
}

function dayKey(d: Date | string | null): string {
  if (!d) return "";
  const date = typeof d === "string" ? new Date(d) : d;
  if (Number.isNaN(date.getTime())) return "";
  return date.toISOString().slice(0, 10);
}

function amountsClose(a: number | null, b: number | null): boolean {
  if (a == null || b == null) return false;
  return Math.abs(a - b) < 0.01;
}

/**
 * Two expenses are "likely duplicates" when the amount matches and at least one
 * of {merchant, date} also matches. This catches re-uploaded receipts while
 * tolerating slightly different OCR results.
 */
function isLikelyDuplicate(a: DupCandidate, b: DupCandidate): boolean {
  if (!amountsClose(a.amount, b.amount)) return false;
  const sameMerchant =
    normMerchant(a.merchant) !== "" &&
    normMerchant(a.merchant) === normMerchant(b.merchant);
  const sameDay = dayKey(a.transactionDate) !== "" &&
    dayKey(a.transactionDate) === dayKey(b.transactionDate);
  return sameMerchant || sameDay;
}

/**
 * Compare the expenses in the current report (`current`) against each other and
 * against `existing` expenses (e.g. the same employee's other reports).
 */
export function findDuplicateWarnings(
  current: DupCandidate[],
  existing: DupCandidate[] = []
): Map<string, DuplicateWarning> {
  const warnings = new Map<string, DuplicateWarning>();

  const addMatch = (
    expenseId: string,
    other: DupCandidate,
    sameReport: boolean
  ) => {
    const existingWarn = warnings.get(expenseId);
    const where = sameReport ? "in this report" : `in "${other.reportTitle ?? "another report"}"`;
    const message = `Looks like a possible duplicate ${where}.`;
    if (existingWarn) {
      existingWarn.matches.push({
        id: other.id,
        reportId: other.reportId,
        reportTitle: other.reportTitle,
      });
    } else {
      warnings.set(expenseId, {
        expenseId,
        message,
        matches: [
          { id: other.id, reportId: other.reportId, reportTitle: other.reportTitle },
        ],
      });
    }
  };

  // Within the current report.
  for (let i = 0; i < current.length; i++) {
    for (let j = i + 1; j < current.length; j++) {
      if (isLikelyDuplicate(current[i], current[j])) {
        addMatch(current[i].id, current[j], true);
        addMatch(current[j].id, current[i], true);
      }
    }
  }

  // Against the employee's other expenses.
  for (const cur of current) {
    for (const ex of existing) {
      if (ex.id === cur.id) continue;
      if (isLikelyDuplicate(cur, ex)) {
        addMatch(cur.id, ex, false);
      }
    }
  }

  return warnings;
}
