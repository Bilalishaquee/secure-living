// Deduction status state machine — Secure Living Dynamic Inspection & Deposit Deduction
// System ("Tenant Review & Dispute"): proposed -> accepted | disputed -> finalised.

export type DeductionAction = "accept" | "dispute" | "finalise";
export type DeductionStatus = "proposed" | "accepted" | "disputed" | "finalised";

export function statusForAction(action: DeductionAction): DeductionStatus {
  if (action === "accept") return "accepted";
  if (action === "dispute") return "disputed";
  return "finalised";
}

// Only a landlord/staff/admin may finalise; a tenant may only accept or dispute their own charge.
export function canPerformAction(action: DeductionAction, isManager: boolean, isTenant: boolean): boolean {
  if (!isManager && !isTenant) return false;
  if (action === "finalise") return isManager;
  return isManager || isTenant;
}
