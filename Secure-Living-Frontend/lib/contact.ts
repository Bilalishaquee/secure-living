/**
 * Contact URLs for marketing CTAs. Override with env in production.
 */

const DEFAULT_WHATSAPP_E164 = "254700000000";
const DEFAULT_CONSULTATION_EMAIL = "hello@secureliving.com";

function digitsOnly(s: string): string {
  return s.replace(/\D/g, "");
}

/** E.164 without + for wa.me */
export function getWhatsAppDigits(): string {
  const fromEnv =
    typeof process !== "undefined"
      ? process.env.NEXT_PUBLIC_WHATSAPP_E164?.trim()
      : undefined;
  const raw = fromEnv && digitsOnly(fromEnv).length >= 9 ? fromEnv : DEFAULT_WHATSAPP_E164;
  return digitsOnly(raw) || DEFAULT_WHATSAPP_E164;
}

export function getWhatsAppHref(prefillMessage?: string): string {
  const digits = getWhatsAppDigits();
  const text = encodeURIComponent(
    prefillMessage ??
      "Hello Secure Living — I'd like to discuss verified listings / secure property in Kenya."
  );
  return `https://wa.me/${digits}?text=${text}`;
}

export function getConsultationMailto(): string {
  const email =
    (typeof process !== "undefined" && process.env.NEXT_PUBLIC_CONSULTATION_EMAIL?.trim()) ||
    DEFAULT_CONSULTATION_EMAIL;
  const subject = encodeURIComponent("Free property consultation — Secure Living");
  return `mailto:${email}?subject=${subject}`;
}

export function getValuationMailto(): string {
  const email =
    (typeof process !== "undefined" && process.env.NEXT_PUBLIC_CONSULTATION_EMAIL?.trim()) ||
    DEFAULT_CONSULTATION_EMAIL;
  const subject = encodeURIComponent("Request free property valuation");
  const body = encodeURIComponent(
    "Hello,\n\nI would like to request a free property valuation.\n\nProperty location:\nMy name:\nPhone / WhatsApp:\n\nThank you."
  );
  return `mailto:${email}?subject=${subject}&body=${body}`;
}
