// Listing content policy — Secure Living UPDATE.md: "images should not have phone number
// or social media handles, then payment is done for one to see the contact." Contact
// details must only be revealed through the paid unlock flow, not leaked in free text.

const KE_PHONE_RE = /(?:\+?254|0)\s*7\d{2}[\s-]?\d{3}[\s-]?\d{3}/;
const GENERIC_PHONE_RE = /\b\d{3}[\s-]?\d{3}[\s-]?\d{4}\b/;
const SOCIAL_HANDLE_RE = /(wa\.me\/|whatsapp|instagram\.com|facebook\.com|fb\.com|twitter\.com|x\.com|@[a-zA-Z0-9_]{3,})/i;

export function findContactLeaks(text: string | null | undefined): string[] {
  if (!text) return [];
  const leaks: string[] = [];
  if (KE_PHONE_RE.test(text) || GENERIC_PHONE_RE.test(text)) leaks.push("phone number");
  if (SOCIAL_HANDLE_RE.test(text)) leaks.push("social media handle/link");
  return leaks;
}

export function assertNoContactLeaks(fields: Record<string, string | null | undefined>): string[] {
  const errors: string[] = [];
  for (const [field, value] of Object.entries(fields)) {
    const leaks = findContactLeaks(value);
    if (leaks.length > 0) errors.push(`${field} appears to contain a ${leaks.join(" and a ")} — contact details must only be shared via the paid contact-unlock flow`);
  }
  return errors;
}
