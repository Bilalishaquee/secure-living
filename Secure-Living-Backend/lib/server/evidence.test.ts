import { describe, it, expect } from "vitest";
import { missingEvidence, isEvidenceComplete, hasSignedChecklistPair } from "./evidence";

describe("missingEvidence — DAMAGE", () => {
  it("requires both before and after photos", () => {
    expect(missingEvidence({ category: "DAMAGE", responsibility: "TENANT" })).toEqual([
      "Before photo is required for damage deductions",
      "After photo is required for damage deductions",
    ]);
  });

  it("is satisfied once both photos are present", () => {
    const d = { category: "DAMAGE", responsibility: "TENANT", beforePhotoUrl: "a.jpg", afterPhotoUrl: "b.jpg" };
    expect(missingEvidence(d)).toEqual([]);
    expect(isEvidenceComplete(d)).toBe(true);
  });

  it("flags only the missing side when one photo is present", () => {
    expect(missingEvidence({ category: "DAMAGE", responsibility: "TENANT", beforePhotoUrl: "a.jpg" })).toEqual([
      "After photo is required for damage deductions",
    ]);
  });
});

describe("missingEvidence — UTILITY_BALANCE", () => {
  it("requires a bill reference or invoice", () => {
    expect(missingEvidence({ category: "UTILITY_BALANCE", responsibility: "TENANT" })).toEqual([
      "A bill reference, meter reading, or invoice is required for utility balance deductions",
    ]);
  });

  it("accepts a meter/bill reference alone", () => {
    expect(missingEvidence({ category: "UTILITY_BALANCE", responsibility: "TENANT", billOrMeterRef: "NCWSC-123" })).toEqual([]);
  });

  it("accepts an invoice URL alone", () => {
    expect(missingEvidence({ category: "UTILITY_BALANCE", responsibility: "TENANT", invoiceUrl: "inv.pdf" })).toEqual([]);
  });
});

describe("missingEvidence — CLEANING", () => {
  it("requires an inspector note", () => {
    expect(missingEvidence({ category: "CLEANING", responsibility: "TENANT" })).toEqual([
      "An inspector note is required for cleaning deductions",
    ]);
  });

  it("is satisfied with a note", () => {
    expect(missingEvidence({ category: "CLEANING", responsibility: "TENANT", inspectorNote: "Grease on hood" })).toEqual([]);
  });
});

describe("missingEvidence — MISSING_ITEM", () => {
  it("has no field-level requirement (checked structurally, see hasSignedChecklistPair)", () => {
    expect(missingEvidence({ category: "MISSING_ITEM", responsibility: "TENANT" })).toEqual([]);
  });
});

describe("missingEvidence — LEASE_VIOLATION", () => {
  it("requires photo evidence or an inspector note", () => {
    expect(missingEvidence({ category: "LEASE_VIOLATION", responsibility: "TENANT" })).toEqual([
      "Photo evidence or an inspector note is required for lease violation deductions",
    ]);
  });

  it("accepts a generic photoUrl", () => {
    expect(missingEvidence({ category: "LEASE_VIOLATION", responsibility: "TENANT", photoUrl: "x.jpg" })).toEqual([]);
  });
});

describe("missingEvidence — charge-exempt responsibilities", () => {
  it("skips validation when the landlord is responsible", () => {
    expect(missingEvidence({ category: "DAMAGE", responsibility: "LANDLORD" })).toEqual([]);
  });

  it("skips validation for normal wear and tear", () => {
    expect(missingEvidence({ category: "UTILITY_BALANCE", responsibility: "WEAR_TEAR" })).toEqual([]);
  });

  it("still validates for an unassigned/unknown responsibility", () => {
    expect(missingEvidence({ category: "CLEANING", responsibility: "UNKNOWN" })).toEqual([
      "An inspector note is required for cleaning deductions",
    ]);
  });
});

describe("hasSignedChecklistPair", () => {
  function fakePrisma(moveInCount: number, moveOutCount: number) {
    return {
      tenantChecklist: {
        count: async (args: { where: { type: string } }) =>
          args.where.type === "MOVE_IN" ? moveInCount : moveOutCount,
      },
    };
  }

  it("is true only when both a signed move-in and move-out checklist exist", async () => {
    expect(await hasSignedChecklistPair(fakePrisma(1, 1), "lease-1")).toBe(true);
  });

  it("is false when the move-out checklist is missing", async () => {
    expect(await hasSignedChecklistPair(fakePrisma(1, 0), "lease-1")).toBe(false);
  });

  it("is false when the move-in checklist is missing", async () => {
    expect(await hasSignedChecklistPair(fakePrisma(0, 1), "lease-1")).toBe(false);
  });

  it("is false when neither exists", async () => {
    expect(await hasSignedChecklistPair(fakePrisma(0, 0), "lease-1")).toBe(false);
  });
});
