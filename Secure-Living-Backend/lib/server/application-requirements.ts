// Application requirement checking — Update-2.md: "landlord gives the tenant an
// application form which outlines the requirements... tenants submit the requirements
// and the form (optionally)". A landlord's ApplicationCustomField list mixes required
// document uploads (fieldType "upload") with personal-info form fields.

export type RequirementField = {
  id: string;
  fieldLabel: string;
  fieldType: string;
  isRequired: boolean;
};

export type SubmittedValues = {
  hasFile: (fieldId: string) => boolean;
  valueFor: (fieldId: string) => string | undefined;
};

/**
 * Returns the labels of required fields that are missing from the submission. Empty
 * array = all required documents/answers were supplied.
 */
export function missingRequiredFields(fields: RequirementField[], submitted: SubmittedValues): string[] {
  const missing: string[] = [];
  for (const field of fields) {
    if (!field.isRequired) continue;
    if (field.fieldType === "upload") {
      if (!submitted.hasFile(field.id)) missing.push(field.fieldLabel);
    } else if (!submitted.valueFor(field.id)?.trim()) {
      missing.push(field.fieldLabel);
    }
  }
  return missing;
}
