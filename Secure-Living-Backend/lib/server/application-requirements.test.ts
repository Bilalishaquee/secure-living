import { describe, it, expect } from "vitest";
import { missingRequiredFields, type RequirementField } from "./application-requirements";

function submitted(values: Record<string, string>, files: Set<string> = new Set()) {
  return {
    hasFile: (fieldId: string) => files.has(fieldId),
    valueFor: (fieldId: string) => values[fieldId],
  };
}

describe("missingRequiredFields", () => {
  const fields: RequirementField[] = [
    { id: "f1", fieldLabel: "Letter of Employment", fieldType: "upload", isRequired: true },
    { id: "f2", fieldLabel: "6-Month M-Pesa Statement", fieldType: "upload", isRequired: true },
    { id: "f3", fieldLabel: "Full Name", fieldType: "text", isRequired: true },
    { id: "f4", fieldLabel: "Preferred Move-In Date", fieldType: "date", isRequired: false },
  ];

  it("lists every missing required field when nothing is submitted", () => {
    expect(missingRequiredFields(fields, submitted({}))).toEqual([
      "Letter of Employment",
      "6-Month M-Pesa Statement",
      "Full Name",
    ]);
  });

  it("is satisfied once all required uploads and text fields are present", () => {
    const result = missingRequiredFields(
      fields,
      submitted({ f3: "Jane Wanjiru" }, new Set(["f1", "f2"])),
    );
    expect(result).toEqual([]);
  });

  it("does not require optional fields", () => {
    const result = missingRequiredFields(
      fields,
      submitted({ f3: "Jane Wanjiru" }, new Set(["f1", "f2"])),
    );
    expect(result).not.toContain("Preferred Move-In Date");
  });

  it("treats a blank/whitespace-only text value as missing", () => {
    const result = missingRequiredFields(fields, submitted({ f3: "   " }, new Set(["f1", "f2"])));
    expect(result).toEqual(["Full Name"]);
  });

  it("ignores inactive/non-required fields entirely", () => {
    expect(missingRequiredFields([], submitted({}))).toEqual([]);
  });
});
