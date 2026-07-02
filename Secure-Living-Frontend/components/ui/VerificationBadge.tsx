"use client";

import { useEffect, useState } from "react";
import { ShieldCheck, ShieldAlert, ShieldQuestion, Fingerprint } from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { Badge } from "@/components/ui/Badge";

type Props = {
  userId: string;
  /** Which compliance-number subject bucket to look up (default TENANT, matching legacy data). */
  subjectType?: "TENANT" | "PROPERTY" | "AGENT" | "USER";
  className?: string;
};

type KycSummary = { anyApproved: boolean; anyPending: boolean; anyRejected: boolean };

/**
 * Reusable profile verification indicator — shows KYC status + compliance number when
 * present (spec: "Every profile should display its verification details, e.g. KYC/QR
 * verification details"). Drop into any profile/list-row view given a userId.
 */
export function VerificationBadge({ userId, subjectType = "TENANT", className }: Props) {
  const { user } = useAuth();
  const [kyc, setKyc] = useState<KycSummary | null>(null);
  const [complianceId, setComplianceId] = useState<string | null>(null);

  useEffect(() => {
    if (!user?.authToken || !userId) return;
    let cancelled = false;
    void (async () => {
      const [kycRes, complianceRes] = await Promise.all([
        fetch(`/api/v1/kyc/documents`, { headers: { Authorization: `Bearer ${user.authToken}` } }),
        fetch(`/api/v1/compliance-numbers?subjectId=${encodeURIComponent(userId)}&subjectType=${subjectType}`, {
          headers: { Authorization: `Bearer ${user.authToken}` },
        }),
      ]);
      if (!cancelled && kycRes.ok) {
        const j = (await kycRes.json()) as { data: { userId: string; status: string }[] };
        const mine = j.data.filter((d) => d.userId === userId);
        setKyc({
          anyApproved: mine.some((d) => d.status === "approved"),
          anyPending: mine.some((d) => d.status === "pending"),
          anyRejected: mine.length > 0 && mine.every((d) => d.status === "rejected"),
        });
      }
      if (!cancelled && complianceRes.ok) {
        const j = (await complianceRes.json()) as { data: { complianceId: string; status: string }[] };
        const active = j.data.find((c) => c.status === "ACTIVE");
        setComplianceId(active?.complianceId ?? null);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [user?.authToken, userId, subjectType]);

  if (!kyc && !complianceId) return null;

  const verified = kyc?.anyApproved;
  const pending = kyc?.anyPending && !verified;

  return (
    <span className={`inline-flex flex-wrap items-center gap-1.5 ${className ?? ""}`}>
      {kyc && (
        <Badge variant={verified ? "success" : pending ? "warning" : "neutral"} className="gap-1">
          {verified ? (
            <ShieldCheck className="h-3 w-3" />
          ) : pending ? (
            <ShieldQuestion className="h-3 w-3" />
          ) : (
            <ShieldAlert className="h-3 w-3" />
          )}
          {verified ? "KYC Verified" : pending ? "KYC Pending" : "Not Verified"}
        </Badge>
      )}
      {complianceId && (
        <Badge variant="info" className="gap-1 font-mono-data">
          <Fingerprint className="h-3 w-3" />
          {complianceId}
        </Badge>
      )}
    </span>
  );
}
