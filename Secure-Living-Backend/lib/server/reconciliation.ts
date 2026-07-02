// Condition Difference Engine — Secure Living Dynamic Inspection & Deposit Deduction System.
// Compares move-in vs. move-out condition and flags whether a deduction review is warranted.

export const CONDITION_RANK: Record<string, number> = {
  New: 5,
  Excellent: 4,
  Good: 3,
  Fair: 2,
  Poor: 1,
  Damaged: 0,
  Broken: 0,
  Missing: -1,
  "Not Applicable": 99,
};

export type ReconciliationFlag = "NO_ACTION" | "REVIEW_REQUIRED" | "POTENTIAL_DEDUCTION";

export function evaluateConditionChange(
  statusIn: string | null,
  statusOut: string | null,
): { flag: ReconciliationFlag; changed: boolean } {
  const inRank = statusIn != null ? CONDITION_RANK[statusIn] ?? 3 : null;
  const outRank = statusOut != null ? CONDITION_RANK[statusOut] ?? 3 : null;

  if (statusOut === "Missing") return { flag: "POTENTIAL_DEDUCTION", changed: true };
  if (statusOut === "Damaged" || statusOut === "Broken") return { flag: "POTENTIAL_DEDUCTION", changed: true };

  if (inRank == null || outRank == null || inRank === 99 || outRank === 99) {
    return { flag: "NO_ACTION", changed: false };
  }
  if (outRank < inRank - 1) return { flag: "POTENTIAL_DEDUCTION", changed: true };
  if (outRank < inRank) return { flag: "REVIEW_REQUIRED", changed: true };
  return { flag: "NO_ACTION", changed: false };
}

export type ReconciliationEntry = {
  chargeKes: number | null;
  responsibility: string | null;
};

export function isDeductible(entry: ReconciliationEntry): boolean {
  const charge = entry.chargeKes ?? 0;
  return charge > 0 && entry.responsibility !== "LANDLORD" && entry.responsibility !== "WEAR_TEAR";
}

// Deposit − tenant-attributable deductions = refund due (spec: "Automated Deposit Calculation").
export function calculateRefund(depositAmount: number, totalDeductions: number): number {
  return Math.max(0, depositAmount - totalDeductions);
}
