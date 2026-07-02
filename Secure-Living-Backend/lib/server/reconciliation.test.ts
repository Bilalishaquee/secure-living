import { describe, it, expect } from "vitest";
import { evaluateConditionChange, isDeductible, calculateRefund } from "./reconciliation";

describe("evaluateConditionChange — the Condition Difference Engine", () => {
  it("flags no action when condition is unchanged", () => {
    expect(evaluateConditionChange("Good", "Good")).toEqual({ flag: "NO_ACTION", changed: false });
  });

  it("flags a potential deduction for Good -> Damaged (spec worked example)", () => {
    expect(evaluateConditionChange("Good", "Damaged")).toEqual({ flag: "POTENTIAL_DEDUCTION", changed: true });
  });

  it("flags a potential deduction when an item goes missing", () => {
    expect(evaluateConditionChange("Good", "Missing")).toEqual({ flag: "POTENTIAL_DEDUCTION", changed: true });
  });

  it("flags review required for a one-step decline (Excellent -> Good)", () => {
    expect(evaluateConditionChange("Excellent", "Good")).toEqual({ flag: "REVIEW_REQUIRED", changed: true });
  });

  it("flags a potential deduction for a two-step decline (Excellent -> Fair)", () => {
    expect(evaluateConditionChange("Excellent", "Fair")).toEqual({ flag: "POTENTIAL_DEDUCTION", changed: true });
  });

  it("does not flag an improvement (Fair -> Good)", () => {
    expect(evaluateConditionChange("Fair", "Good")).toEqual({ flag: "NO_ACTION", changed: false });
  });

  it("ignores comparisons involving Not Applicable", () => {
    expect(evaluateConditionChange("Not Applicable", "Damaged")).toEqual({ flag: "POTENTIAL_DEDUCTION", changed: true });
    expect(evaluateConditionChange("Good", "Not Applicable")).toEqual({ flag: "NO_ACTION", changed: false });
  });

  it("treats missing statusIn/statusOut as no action", () => {
    expect(evaluateConditionChange(null, "Good")).toEqual({ flag: "NO_ACTION", changed: false });
    expect(evaluateConditionChange("Good", null)).toEqual({ flag: "NO_ACTION", changed: false });
  });
});

describe("isDeductible", () => {
  it("is deductible when there's a charge and the tenant is responsible", () => {
    expect(isDeductible({ chargeKes: 1000, responsibility: "TENANT" })).toBe(true);
  });

  it("is not deductible when the landlord is responsible", () => {
    expect(isDeductible({ chargeKes: 1000, responsibility: "LANDLORD" })).toBe(false);
  });

  it("is not deductible for normal wear and tear", () => {
    expect(isDeductible({ chargeKes: 1000, responsibility: "WEAR_TEAR" })).toBe(false);
  });

  it("is not deductible when there's no charge", () => {
    expect(isDeductible({ chargeKes: 0, responsibility: "TENANT" })).toBe(false);
    expect(isDeductible({ chargeKes: null, responsibility: "TENANT" })).toBe(false);
  });
});

describe("calculateRefund — Automated Deposit Calculation", () => {
  it("matches the spec's worked example (20,000 - 6,000 = 14,000)", () => {
    expect(calculateRefund(20000, 6000)).toBe(14000);
  });

  it("matches the spec's advantage example (30,000 - 8,500 = 21,500)", () => {
    expect(calculateRefund(30000, 8500)).toBe(21500);
  });

  it("never returns a negative refund when deductions exceed the deposit", () => {
    expect(calculateRefund(5000, 8000)).toBe(0);
  });
});
