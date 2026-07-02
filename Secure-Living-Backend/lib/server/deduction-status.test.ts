import { describe, it, expect } from "vitest";
import { statusForAction, canPerformAction } from "./deduction-status";

describe("statusForAction", () => {
  it("maps accept -> accepted", () => {
    expect(statusForAction("accept")).toBe("accepted");
  });
  it("maps dispute -> disputed", () => {
    expect(statusForAction("dispute")).toBe("disputed");
  });
  it("maps finalise -> finalised", () => {
    expect(statusForAction("finalise")).toBe("finalised");
  });
});

describe("canPerformAction — Tenant Review & Dispute state machine", () => {
  it("lets a tenant accept their own deduction", () => {
    expect(canPerformAction("accept", false, true)).toBe(true);
  });

  it("lets a tenant dispute their own deduction", () => {
    expect(canPerformAction("dispute", false, true)).toBe(true);
  });

  it("does not let a tenant finalise a deduction", () => {
    expect(canPerformAction("finalise", false, true)).toBe(false);
  });

  it("lets a landlord/staff finalise a deduction", () => {
    expect(canPerformAction("finalise", true, false)).toBe(true);
  });

  it("lets a manager accept or dispute too", () => {
    expect(canPerformAction("accept", true, false)).toBe(true);
    expect(canPerformAction("dispute", true, false)).toBe(true);
  });

  it("denies anyone who is neither the tenant nor a manager", () => {
    expect(canPerformAction("accept", false, false)).toBe(false);
    expect(canPerformAction("dispute", false, false)).toBe(false);
    expect(canPerformAction("finalise", false, false)).toBe(false);
  });
});
