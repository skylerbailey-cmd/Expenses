import { STATUS_LABELS, STATUS_STYLES, type ReportStatus } from "@/lib/constants";

export function StatusBadge({ status }: { status: string }) {
  const s = (status as ReportStatus) in STATUS_LABELS ? (status as ReportStatus) : "DRAFT";
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ring-inset ${STATUS_STYLES[s]}`}
    >
      {STATUS_LABELS[s]}
    </span>
  );
}
