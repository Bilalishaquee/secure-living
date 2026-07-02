import { describe, it, expect } from "vitest";
import { findContactLeaks, assertNoContactLeaks } from "./listing-content-policy";

describe("findContactLeaks", () => {
  it("returns nothing for clean text", () => {
    expect(findContactLeaks("Spacious 2BR apartment in Westlands with parking.")).toEqual([]);
  });

  it("returns nothing for null/undefined", () => {
    expect(findContactLeaks(null)).toEqual([]);
    expect(findContactLeaks(undefined)).toEqual([]);
  });

  it("flags a Kenyan phone number with +254 prefix", () => {
    expect(findContactLeaks("Call me on +254712345678")).toEqual(["phone number"]);
  });

  it("flags a Kenyan phone number with leading 0", () => {
    expect(findContactLeaks("Call 0712 345 678 for viewing")).toEqual(["phone number"]);
  });

  it("flags a generic phone-shaped number", () => {
    expect(findContactLeaks("Reach us at 123-456-7890")).toEqual(["phone number"]);
  });

  it("flags a WhatsApp link (and the phone number embedded in it)", () => {
    expect(findContactLeaks("Message us on wa.me/254712345678")).toEqual(["phone number", "social media handle/link"]);
  });

  it("flags a WhatsApp link with no digits as a social handle only", () => {
    expect(findContactLeaks("Message us on whatsapp for details")).toEqual(["social media handle/link"]);
  });

  it("flags an Instagram handle", () => {
    expect(findContactLeaks("Follow @secureliving_ke for more")).toEqual(["social media handle/link"]);
  });

  it("flags both a phone number and a social handle together", () => {
    expect(findContactLeaks("Call 0712345678 or DM @secureliving_ke")).toEqual([
      "phone number",
      "social media handle/link",
    ]);
  });
});

describe("assertNoContactLeaks", () => {
  it("returns no errors when all fields are clean", () => {
    expect(assertNoContactLeaks({ title: "2BR Apartment", description: "Great location, no pets." })).toEqual([]);
  });

  it("names the offending field in the error message", () => {
    const errors = assertNoContactLeaks({ title: "2BR Apartment", description: "Call 0712345678 now" });
    expect(errors).toHaveLength(1);
    expect(errors[0]).toContain("description");
    expect(errors[0]).toContain("phone number");
  });

  it("reports every offending field", () => {
    const errors = assertNoContactLeaks({
      title: "Call 0712345678",
      description: "DM @secureliving_ke",
    });
    expect(errors).toHaveLength(2);
  });
});
