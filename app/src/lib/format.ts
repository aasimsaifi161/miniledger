export function formatRupees(amount: number): string {
  if (amount === undefined || amount === null || isNaN(amount)) {
    return "₹0";
  }

  const isNegative = amount < 0;
  const absInt = Math.abs(Math.round(amount)).toString();

  if (absInt.length <= 3) {
    return `${isNegative ? "-" : ""}₹${absInt}`;
  }

  const lastThree = absInt.slice(-3);
  const otherNumbers = absInt.slice(0, -3);
  const withCommas = otherNumbers.replace(/\B(?=(\d{2})+(?!\d))/g, ",") + "," + lastThree;

  return `${isNegative ? "-" : ""}₹${withCommas}`;
}

export function formatCalendarDate(dateIso: string): string {
  try {
    const d = new Date(dateIso);
    if (isNaN(d.getTime())) return dateIso;
    return d.toLocaleDateString("en-IN", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  } catch {
    return dateIso;
  }
}

export type DueDateStatus = "repaid" | "overdue" | "due-soon" | "future";

export interface RelativeDueDate {
  text: string;
  status: DueDateStatus;
  daysDiff: number;
}

export function formatRelativeDueDate(
  dueDateIso: string,
  isRepaid: boolean,
  repaidAtIso?: string | null
): RelativeDueDate {
  if (isRepaid) {
    if (repaidAtIso) {
      const d = new Date(repaidAtIso);
      const formatted = d.toLocaleDateString("en-IN", {
        day: "numeric",
        month: "short",
      });
      return { text: `Repaid on ${formatted}`, status: "repaid", daysDiff: 0 };
    }
    return { text: "Repaid", status: "repaid", daysDiff: 0 };
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const due = new Date(dueDateIso);
  due.setHours(0, 0, 0, 0);

  const diffTime = due.getTime() - today.getTime();
  const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24));

  if (diffDays < 0) {
    const overdueDays = Math.abs(diffDays);
    return {
      text: overdueDays === 1 ? "1 day overdue" : `${overdueDays} days overdue`,
      status: "overdue",
      daysDiff: diffDays,
    };
  }

  if (diffDays === 0) {
    return { text: "Due today", status: "due-soon", daysDiff: 0 };
  }

  if (diffDays === 1) {
    return { text: "Due tomorrow", status: "due-soon", daysDiff: 1 };
  }

  if (diffDays <= 3) {
    return { text: `Due in ${diffDays} days`, status: "due-soon", daysDiff: diffDays };
  }

  return { text: `Due in ${diffDays} days`, status: "future", daysDiff: diffDays };
}

export function getInitials(name: string): string {
  if (!name) return "?";
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

const AVATAR_COLORS = [
  "#4F46E5",
  "#7C3AED",
  "#2563EB",
  "#0891B2",
  "#0D9488",
  "#059669",
  "#D97706",
  "#E11D48",
  "#DB2777",
  "#9333EA",
];

export function getAvatarColor(name: string): string {
  if (!name) return AVATAR_COLORS[0];
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  const index = Math.abs(hash) % AVATAR_COLORS.length;
  return AVATAR_COLORS[index];
}
