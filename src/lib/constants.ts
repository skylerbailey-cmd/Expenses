// Companies / business entities that expenses can be assigned to.
export const COMPANIES = ["Glow SF", "Desert Wellness"] as const;
export type Company = (typeof COMPANIES)[number];

// Expense categories tuned for the kinds of things employees commonly submit.
export const CATEGORIES = [
  "Rideshare", // Uber, Lyft, taxi
  "Parking",
  "Tolls",
  "Fuel",
  "Public Transit",
  "Flights",
  "Lodging",
  "Meals",
  "Office Supplies",
  "Software",
  "Other",
] as const;

export type Category = (typeof CATEGORIES)[number];

export const REPORT_STATUSES = [
  "DRAFT",
  "SUBMITTED",
  "RETURNED",
  "APPROVED",
  "PAID",
] as const;

export type ReportStatus = (typeof REPORT_STATUSES)[number];

export const STATUS_LABELS: Record<ReportStatus, string> = {
  DRAFT: "Draft",
  SUBMITTED: "Submitted",
  RETURNED: "Returned",
  APPROVED: "Approved",
  PAID: "Paid",
};

// Tailwind classes for status badges.
export const STATUS_STYLES: Record<ReportStatus, string> = {
  DRAFT: "bg-gray-100 text-gray-700 ring-gray-200",
  SUBMITTED: "bg-blue-100 text-blue-700 ring-blue-200",
  RETURNED: "bg-amber-100 text-amber-800 ring-amber-200",
  APPROVED: "bg-emerald-100 text-emerald-700 ring-emerald-200",
  PAID: "bg-violet-100 text-violet-700 ring-violet-200",
};
