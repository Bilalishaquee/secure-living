"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { Button } from "@/components/ui/Button";
import { useAuth } from "@/lib/auth-context";
import { useToast } from "@/lib/toast-context";

export default function NewPropertyPage() {
  const router = useRouter();
  const { user } = useAuth();
  const { toast } = useToast();
  const [step, setStep] = useState(1);
  const [f, setF] = useState({
    name: "",
    propertyCode: "",
    propertyType: "Apartment Block",
    category: "residential",
    ownershipType: "Owned",
    status: "active",
    descriptionNotes: "",
    shortTermRentalPlatform: "",
    listingUrl: "",
    addressLine1: "",
    addressLine2: "",
    city: "",
    county: "",
    subCounty: "",
    ward: "",
    country: "Kenya",
    postalCode: "",
    gpsLatitude: "",
    gpsLongitude: "",
    yearBuilt: "",
    totalUnits: "",
    totalSqft: "",
    lotSizeSqft: "",
    totalBathrooms: "",
    totalParkingSpaces: "",
    landReferenceNumber: "",
    titleDeedNumber: "",
    managementMode: "self_managed",
    purchasePriceKes: "",
    acquisitionDate: "",
    currentValueKes: "",
    marketRentEstimateKes: "",
    noiEstimateKes: "",
    capRateEstimate: "",
    hasMortgage: false,
    mortgageLender: "",
    mortgageInterestRate: "",
    mortgageLoanTermMonths: "",
    mortgageMonthlyPaymentKes: "",
    mortgageStartDate: "",
    mortgageMaturityDate: "",
    mortgageBalanceKes: "",
    propertyTaxAnnualKes: "",
    insuranceProvider: "",
    insurancePremiumAnnualKes: "",
    insurancePolicyNumber: "",
    insuranceExpiryDate: "",
    hoaFeeMonthlyKes: "",
  });

  const progress = useMemo(() => Math.round((step / 4) * 100), [step]);

  function validateCurrentStep() {
    if (step === 1 && (!f.name.trim() || !f.propertyType || !f.category)) return "Complete basic info fields";
    if (step === 2 && !f.addressLine1.trim()) return "Address line 1 is required";
    if (step === 3 && !f.managementMode) return "Select management mode";
    return null;
  }

  async function submit() {
    if (!user?.id) {
      toast("Please login first", "error");
      return;
    }
    const res = await fetch("/api/v1/properties", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${user.authToken ?? ""}`,
      },
      body: JSON.stringify({
        organizationId: user.organizationId,
        branchId: user.branchId,
        ownerUserId: user.id,
        managerUserId: user.id,
        name: f.name.trim(),
        propertyCode: f.propertyCode || undefined,
        propertyType: f.propertyType as "Apartment Block",
        category: f.category as "residential",
        ownershipType: f.ownershipType as "Owned",
        addressLine1: f.addressLine1.trim(),
        addressLine2: f.addressLine2 || undefined,
        city: f.city || undefined,
        county: f.county || undefined,
        subCounty: f.subCounty || undefined,
        ward: f.ward || undefined,
        country: f.country || "Kenya",
        postalCode: f.postalCode || undefined,
        gpsLatitude: f.gpsLatitude ? Number(f.gpsLatitude) : undefined,
        gpsLongitude: f.gpsLongitude ? Number(f.gpsLongitude) : undefined,
        yearBuilt: f.yearBuilt ? Number(f.yearBuilt) : undefined,
        totalUnits: f.totalUnits ? Number(f.totalUnits) : undefined,
        totalSqft: f.totalSqft ? Number(f.totalSqft) : undefined,
        lotSizeSqft: f.lotSizeSqft ? Number(f.lotSizeSqft) : undefined,
        totalBathrooms: f.totalBathrooms ? Number(f.totalBathrooms) : undefined,
        totalParkingSpaces: f.totalParkingSpaces ? Number(f.totalParkingSpaces) : undefined,
        landReferenceNumber: f.landReferenceNumber || undefined,
        titleDeedNumber: f.titleDeedNumber || undefined,
        managementMode: f.managementMode as "self_managed",
        descriptionNotes: f.descriptionNotes || undefined,
        shortTermRentalPlatform: f.shortTermRentalPlatform || undefined,
        listingUrl: f.listingUrl || undefined,
        purchasePriceKes: f.purchasePriceKes ? Number(f.purchasePriceKes) : undefined,
        acquisitionDate: f.acquisitionDate ? new Date(f.acquisitionDate).toISOString() : undefined,
        currentValueKes: f.currentValueKes ? Number(f.currentValueKes) : undefined,
        marketRentEstimateKes: f.marketRentEstimateKes ? Number(f.marketRentEstimateKes) : undefined,
        noiEstimateKes: f.noiEstimateKes ? Number(f.noiEstimateKes) : undefined,
        capRateEstimate: f.capRateEstimate ? Number(f.capRateEstimate) : undefined,
        mortgageLender: f.hasMortgage ? f.mortgageLender || undefined : undefined,
        mortgageInterestRate: f.hasMortgage && f.mortgageInterestRate ? Number(f.mortgageInterestRate) : undefined,
        mortgageLoanTermMonths: f.hasMortgage && f.mortgageLoanTermMonths ? Number(f.mortgageLoanTermMonths) : undefined,
        mortgageMonthlyPaymentKes: f.hasMortgage && f.mortgageMonthlyPaymentKes ? Number(f.mortgageMonthlyPaymentKes) : undefined,
        mortgageStartDate: f.hasMortgage && f.mortgageStartDate ? new Date(f.mortgageStartDate).toISOString() : undefined,
        mortgageMaturityDate: f.hasMortgage && f.mortgageMaturityDate ? new Date(f.mortgageMaturityDate).toISOString() : undefined,
        mortgageBalanceKes: f.hasMortgage && f.mortgageBalanceKes ? Number(f.mortgageBalanceKes) : undefined,
        propertyTaxAnnualKes: f.propertyTaxAnnualKes ? Number(f.propertyTaxAnnualKes) : undefined,
        insuranceProvider: f.insuranceProvider || undefined,
        insurancePremiumAnnualKes: f.insurancePremiumAnnualKes ? Number(f.insurancePremiumAnnualKes) : undefined,
        insurancePolicyNumber: f.insurancePolicyNumber || undefined,
        insuranceExpiryDate: f.insuranceExpiryDate ? new Date(f.insuranceExpiryDate).toISOString() : undefined,
        hoaFeeMonthlyKes: f.hoaFeeMonthlyKes ? Number(f.hoaFeeMonthlyKes) : undefined,
        status: f.status as "active",
      }),
    });
    if (!res.ok) {
      const j = (await res.json().catch(() => ({ error: "Failed to create property" }))) as { error?: string };
      toast(j.error ?? "Failed to create property", "error");
      return;
    }
    toast("Property created", "success");
    const j = (await res.json()) as { data: { id: string } };
    router.push(`/properties/${j.data.id}`);
  }

  return (
    <div className="mx-auto w-full max-w-3xl space-y-8">
      <Button variant="ghost" size="sm" asChild className="-ml-2">
        <Link href="/properties">← Back to properties</Link>
      </Button>
      <div className="app-page-toolbar">
        <div className="min-w-0">
          <h1 className="app-page-title">Add property</h1>
          <p className="app-page-lead">Step {step} of 4</p>
        </div>
      </div>
      <div className="h-2 w-full overflow-hidden rounded-full bg-slate-200">
        <div className="h-full bg-brand-blue transition-all" style={{ width: `${progress}%` }} />
      </div>
      <div className="app-glass-panel space-y-4 p-6">
        {step === 1 ? (
          <>
            <div className="grid gap-4 sm:grid-cols-2">
              <input className="rounded-xl border border-surface-border px-3 py-2 text-sm" placeholder="Property name" value={f.name} onChange={(e)=>setF((v)=>({ ...v, name: e.target.value }))} />
              <input className="rounded-xl border border-surface-border px-3 py-2 text-sm" placeholder="Property code" value={f.propertyCode} onChange={(e)=>setF((v)=>({ ...v, propertyCode: e.target.value }))} />
              <select className="rounded-xl border border-surface-border px-3 py-2 text-sm" value={f.propertyType} onChange={(e)=>setF((v)=>({ ...v, propertyType: e.target.value }))}>
                {["Apartment Block","Maisonette","Bungalow","Bedsitter","Studio","Commercial","Mixed Use","Short-Term Rental","Airbnb"].map((t)=><option key={t}>{t}</option>)}
              </select>
              <select className="rounded-xl border border-surface-border px-3 py-2 text-sm" value={f.category} onChange={(e)=>setF((v)=>({ ...v, category: e.target.value }))}>
                <option value="residential">Residential</option><option value="commercial">Commercial</option><option value="industrial">Industrial</option><option value="mixed_use">Mixed Use</option>
              </select>
              <select className="rounded-xl border border-surface-border px-3 py-2 text-sm" value={f.ownershipType} onChange={(e)=>setF((v)=>({ ...v, ownershipType: e.target.value }))}>
                {["Owned","Managed (Third Party)","Joint Ownership","Company Owned"].map((t)=><option key={t}>{t}</option>)}
              </select>
              <select className="rounded-xl border border-surface-border px-3 py-2 text-sm" value={f.status} onChange={(e)=>setF((v)=>({ ...v, status: e.target.value }))}>
                <option value="active">active</option><option value="inactive">inactive</option><option value="draft">draft</option><option value="archived">archived</option>
              </select>
            </div>
            <textarea className="w-full rounded-xl border border-surface-border px-3 py-2 text-sm" rows={3} placeholder="Description notes" value={f.descriptionNotes} onChange={(e)=>setF((v)=>({ ...v, descriptionNotes: e.target.value }))} />
            {(f.propertyType === "Airbnb" || f.propertyType === "Short-Term Rental") ? (
              <input className="w-full rounded-xl border border-surface-border px-3 py-2 text-sm" placeholder="Short term rental platform" value={f.shortTermRentalPlatform} onChange={(e)=>setF((v)=>({ ...v, shortTermRentalPlatform: e.target.value }))} />
            ) : null}
            <input className="w-full rounded-xl border border-surface-border px-3 py-2 text-sm" placeholder="Listing URL" value={f.listingUrl} onChange={(e)=>setF((v)=>({ ...v, listingUrl: e.target.value }))} />
          </>
        ) : null}

        {step === 2 ? (
          <>
            <div className="grid gap-4 sm:grid-cols-2">
              <input className="rounded-xl border border-surface-border px-3 py-2 text-sm sm:col-span-2" placeholder="Address line 1" value={f.addressLine1} onChange={(e)=>setF((v)=>({ ...v, addressLine1: e.target.value }))} />
              <input className="rounded-xl border border-surface-border px-3 py-2 text-sm sm:col-span-2" placeholder="Address line 2" value={f.addressLine2} onChange={(e)=>setF((v)=>({ ...v, addressLine2: e.target.value }))} />
              <input className="rounded-xl border border-surface-border px-3 py-2 text-sm" placeholder="City" value={f.city} onChange={(e)=>setF((v)=>({ ...v, city: e.target.value }))} />
              <input className="rounded-xl border border-surface-border px-3 py-2 text-sm" placeholder="County" value={f.county} onChange={(e)=>setF((v)=>({ ...v, county: e.target.value }))} />
              <input className="rounded-xl border border-surface-border px-3 py-2 text-sm" placeholder="Sub County" value={f.subCounty} onChange={(e)=>setF((v)=>({ ...v, subCounty: e.target.value }))} />
              <input className="rounded-xl border border-surface-border px-3 py-2 text-sm" placeholder="Ward" value={f.ward} onChange={(e)=>setF((v)=>({ ...v, ward: e.target.value }))} />
              <input className="rounded-xl border border-surface-border px-3 py-2 text-sm" placeholder="Country" value={f.country} onChange={(e)=>setF((v)=>({ ...v, country: e.target.value }))} />
              <input className="rounded-xl border border-surface-border px-3 py-2 text-sm" placeholder="Postal Code" value={f.postalCode} onChange={(e)=>setF((v)=>({ ...v, postalCode: e.target.value }))} />
              <input className="rounded-xl border border-surface-border px-3 py-2 text-sm" placeholder="GPS Latitude" value={f.gpsLatitude} onChange={(e)=>setF((v)=>({ ...v, gpsLatitude: e.target.value }))} />
              <input className="rounded-xl border border-surface-border px-3 py-2 text-sm" placeholder="GPS Longitude" value={f.gpsLongitude} onChange={(e)=>setF((v)=>({ ...v, gpsLongitude: e.target.value }))} />
            </div>
            <p className="text-xs text-[var(--text-secondary)]">GPS coordinates help tenants find the property.</p>
          </>
        ) : null}

        {step === 3 ? (
          <div className="grid gap-4 sm:grid-cols-2">
            <input className="rounded-xl border border-surface-border px-3 py-2 text-sm" placeholder="Year Built" value={f.yearBuilt} onChange={(e)=>setF((v)=>({ ...v, yearBuilt: e.target.value }))} />
            <input className="rounded-xl border border-surface-border px-3 py-2 text-sm" placeholder="Total Units" value={f.totalUnits} onChange={(e)=>setF((v)=>({ ...v, totalUnits: e.target.value }))} />
            <input className="rounded-xl border border-surface-border px-3 py-2 text-sm" placeholder="Total Sqft" value={f.totalSqft} onChange={(e)=>setF((v)=>({ ...v, totalSqft: e.target.value }))} />
            <input className="rounded-xl border border-surface-border px-3 py-2 text-sm" placeholder="Lot Size Sqft" value={f.lotSizeSqft} onChange={(e)=>setF((v)=>({ ...v, lotSizeSqft: e.target.value }))} />
            <input className="rounded-xl border border-surface-border px-3 py-2 text-sm" placeholder="Total Bathrooms" value={f.totalBathrooms} onChange={(e)=>setF((v)=>({ ...v, totalBathrooms: e.target.value }))} />
            <input className="rounded-xl border border-surface-border px-3 py-2 text-sm" placeholder="Parking Spaces" value={f.totalParkingSpaces} onChange={(e)=>setF((v)=>({ ...v, totalParkingSpaces: e.target.value }))} />
            <input className="rounded-xl border border-surface-border px-3 py-2 text-sm" placeholder="Land Reference Number" value={f.landReferenceNumber} onChange={(e)=>setF((v)=>({ ...v, landReferenceNumber: e.target.value }))} />
            <input className="rounded-xl border border-surface-border px-3 py-2 text-sm" placeholder="Title Deed Number" value={f.titleDeedNumber} onChange={(e)=>setF((v)=>({ ...v, titleDeedNumber: e.target.value }))} />
            <div className="sm:col-span-2 flex gap-4">
              <label className="flex items-center gap-2 text-sm"><input type="radio" checked={f.managementMode === "self_managed"} onChange={()=>setF((v)=>({ ...v, managementMode: "self_managed" }))} />Self-Managed</label>
              <label className="flex items-center gap-2 text-sm"><input type="radio" checked={f.managementMode === "full_service"} onChange={()=>setF((v)=>({ ...v, managementMode: "full_service" }))} />Full Service</label>
            </div>
          </div>
        ) : null}

        {step === 4 ? (
          <div className="space-y-4">
            <h3 className="text-sm font-semibold">Valuation</h3>
            <div className="grid gap-4 sm:grid-cols-3">
              <input className="rounded-xl border border-surface-border px-3 py-2 text-sm" placeholder="Purchase Price KES" value={f.purchasePriceKes} onChange={(e)=>setF((v)=>({ ...v, purchasePriceKes: e.target.value }))} />
              <input type="date" className="rounded-xl border border-surface-border px-3 py-2 text-sm" value={f.acquisitionDate} onChange={(e)=>setF((v)=>({ ...v, acquisitionDate: e.target.value }))} />
              <input className="rounded-xl border border-surface-border px-3 py-2 text-sm" placeholder="Current Value KES" value={f.currentValueKes} onChange={(e)=>setF((v)=>({ ...v, currentValueKes: e.target.value }))} />
              <input className="rounded-xl border border-surface-border px-3 py-2 text-sm" placeholder="Market Rent Estimate KES" value={f.marketRentEstimateKes} onChange={(e)=>setF((v)=>({ ...v, marketRentEstimateKes: e.target.value }))} />
              <input className="rounded-xl border border-surface-border px-3 py-2 text-sm" placeholder="NOI Estimate KES" value={f.noiEstimateKes} onChange={(e)=>setF((v)=>({ ...v, noiEstimateKes: e.target.value }))} />
              <input className="rounded-xl border border-surface-border px-3 py-2 text-sm" placeholder="Cap Rate %" value={f.capRateEstimate} onChange={(e)=>setF((v)=>({ ...v, capRateEstimate: e.target.value }))} />
            </div>
            <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={f.hasMortgage} onChange={(e)=>setF((v)=>({ ...v, hasMortgage: e.target.checked }))} />Has Mortgage</label>
            {f.hasMortgage ? (
              <div className="grid gap-4 sm:grid-cols-3">
                <input className="rounded-xl border border-surface-border px-3 py-2 text-sm" placeholder="Mortgage Lender" value={f.mortgageLender} onChange={(e)=>setF((v)=>({ ...v, mortgageLender: e.target.value }))} />
                <input className="rounded-xl border border-surface-border px-3 py-2 text-sm" placeholder="Interest Rate %" value={f.mortgageInterestRate} onChange={(e)=>setF((v)=>({ ...v, mortgageInterestRate: e.target.value }))} />
                <input className="rounded-xl border border-surface-border px-3 py-2 text-sm" placeholder="Loan Term Months" value={f.mortgageLoanTermMonths} onChange={(e)=>setF((v)=>({ ...v, mortgageLoanTermMonths: e.target.value }))} />
                <input className="rounded-xl border border-surface-border px-3 py-2 text-sm" placeholder="Monthly Payment KES" value={f.mortgageMonthlyPaymentKes} onChange={(e)=>setF((v)=>({ ...v, mortgageMonthlyPaymentKes: e.target.value }))} />
                <input type="date" className="rounded-xl border border-surface-border px-3 py-2 text-sm" value={f.mortgageStartDate} onChange={(e)=>setF((v)=>({ ...v, mortgageStartDate: e.target.value }))} />
                <input type="date" className="rounded-xl border border-surface-border px-3 py-2 text-sm" value={f.mortgageMaturityDate} onChange={(e)=>setF((v)=>({ ...v, mortgageMaturityDate: e.target.value }))} />
                <input className="rounded-xl border border-surface-border px-3 py-2 text-sm" placeholder="Mortgage Balance KES" value={f.mortgageBalanceKes} onChange={(e)=>setF((v)=>({ ...v, mortgageBalanceKes: e.target.value }))} />
              </div>
            ) : null}
            <h3 className="text-sm font-semibold">Running Costs</h3>
            <div className="grid gap-4 sm:grid-cols-3">
              <input className="rounded-xl border border-surface-border px-3 py-2 text-sm" placeholder="Annual Tax KES" value={f.propertyTaxAnnualKes} onChange={(e)=>setF((v)=>({ ...v, propertyTaxAnnualKes: e.target.value }))} />
              <input className="rounded-xl border border-surface-border px-3 py-2 text-sm" placeholder="Insurance Provider" value={f.insuranceProvider} onChange={(e)=>setF((v)=>({ ...v, insuranceProvider: e.target.value }))} />
              <input className="rounded-xl border border-surface-border px-3 py-2 text-sm" placeholder="Insurance Premium KES" value={f.insurancePremiumAnnualKes} onChange={(e)=>setF((v)=>({ ...v, insurancePremiumAnnualKes: e.target.value }))} />
              <input className="rounded-xl border border-surface-border px-3 py-2 text-sm" placeholder="Insurance Policy Number" value={f.insurancePolicyNumber} onChange={(e)=>setF((v)=>({ ...v, insurancePolicyNumber: e.target.value }))} />
              <input type="date" className="rounded-xl border border-surface-border px-3 py-2 text-sm" value={f.insuranceExpiryDate} onChange={(e)=>setF((v)=>({ ...v, insuranceExpiryDate: e.target.value }))} />
              <input className="rounded-xl border border-surface-border px-3 py-2 text-sm" placeholder="HOA Monthly KES" value={f.hoaFeeMonthlyKes} onChange={(e)=>setF((v)=>({ ...v, hoaFeeMonthlyKes: e.target.value }))} />
            </div>
          </div>
        ) : null}

        <div className="flex flex-wrap gap-3 pt-2">
          {step > 1 ? <Button type="button" variant="outline" onClick={() => setStep((s) => s - 1)}>Back</Button> : null}
          {step < 4 ? (
            <Button
              type="button"
              onClick={() => {
                const err = validateCurrentStep();
                if (err) {
                  toast(err, "error");
                  return;
                }
                setStep((s) => s + 1);
              }}
            >
              Next
            </Button>
          ) : (
            <Button type="button" onClick={() => { void submit(); }}>Save Property</Button>
          )}
          <Button type="button" variant="outline" asChild>
            <Link href="/properties">Cancel</Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
