// Evidence requirements for deposit deductions — Secure Living Dynamic Inspection
// & Deposit Deduction System spec ("Evidence Requirements" section).
//
// Required evidence is only enforced for tenant-attributable charges (responsibility
// TENANT or UNKNOWN) — deductions billed to the landlord/wear-and-tear/contractor are
// exempt since they are not being taken out of the tenant's deposit.

export const DEDUCTION_CATEGORIES = [
  "DAMAGE",
  "MISSING_ITEM",
  "CLEANING",
  "UTILITY_BALANCE",
  "LEASE_VIOLATION",
] as const;

export type DeductionCategory = (typeof DEDUCTION_CATEGORIES)[number];

export type DeductionEvidenceInput = {
  category?: string | null;
  responsibility?: string | null;
  photoUrl?: string | null;
  beforePhotoUrl?: string | null;
  afterPhotoUrl?: string | null;
  repairQuoteUrl?: string | null;
  invoiceUrl?: string | null;
  inspectorNote?: string | null;
  billOrMeterRef?: string | null;
};

const CHARGE_EXEMPT_RESPONSIBILITIES = new Set(["LANDLORD", "WEAR_TEAR"]);

/**
 * Returns the list of missing-evidence messages for a deduction. Empty array = evidence
 * requirements satisfied (or category doesn't require any / responsibility is exempt).
 */
export function missingEvidence(d: DeductionEvidenceInput): string[] {
  if (d.responsibility && CHARGE_EXEMPT_RESPONSIBILITIES.has(d.responsibility)) return [];

  const missing: string[] = [];
  switch (d.category) {
    case "DAMAGE":
      if (!d.beforePhotoUrl) missing.push("Before photo is required for damage deductions");
      if (!d.afterPhotoUrl) missing.push("After photo is required for damage deductions");
      break;
    case "MISSING_ITEM":
      // Move-in/move-out checklist evidence is enforced structurally by the caller via
      // hasSignedChecklistPair() below (requires DB access, so it can't run in this pure check).
      break;
    case "UTILITY_BALANCE":
      if (!d.billOrMeterRef && !d.invoiceUrl) {
        missing.push("A bill reference, meter reading, or invoice is required for utility balance deductions");
      }
      break;
    case "CLEANING":
      if (!d.inspectorNote) missing.push("An inspector note is required for cleaning deductions");
      break;
    case "LEASE_VIOLATION":
      if (!d.photoUrl && !d.beforePhotoUrl && !d.afterPhotoUrl && !d.inspectorNote) {
        missing.push("Photo evidence or an inspector note is required for lease violation deductions");
      }
      break;
    default:
      break;
  }
  return missing;
}

export function isEvidenceComplete(d: DeductionEvidenceInput): boolean {
  return missingEvidence(d).length === 0;
}

/**
 * Structural evidence check for MISSING_ITEM deductions: the tenant must have a signed
 * move-in checklist AND a signed move-out checklist on file for the lease before a
 * missing-item charge can be raised (spec: "Missing Item — Required: move-in checklist,
 * move-out checklist").
 */
export async function hasSignedChecklistPair(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  prisma: { tenantChecklist: { count: (args: any) => Promise<number> } },
  leaseId: string,
): Promise<boolean> {
  const [moveIn, moveOut] = await Promise.all([
    prisma.tenantChecklist.count({ where: { leaseId, type: "MOVE_IN", status: "SIGNED" } }),
    prisma.tenantChecklist.count({ where: { leaseId, type: "MOVE_OUT", status: "SIGNED" } }),
  ]);
  return moveIn > 0 && moveOut > 0;
}
