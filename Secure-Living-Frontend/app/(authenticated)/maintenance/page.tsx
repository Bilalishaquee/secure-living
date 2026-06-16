"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { Wrench } from "lucide-react";
import { Button } from "@/components/ui/Button";
import Link from "next/link";

export default function MaintenancePage() {
  const router = useRouter();

  // Auto-redirect after a short delay so users see the notice
  useEffect(() => {
    const t = setTimeout(() => router.replace("/service-requests"), 3000);
    return () => clearTimeout(t);
  }, [router]);

  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center gap-6 text-center">
      <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-blue-100">
        <Wrench className="h-8 w-8 text-blue-600" />
      </div>
      <div>
        <h1 className="text-2xl font-bold text-slate-800">Maintenance has moved</h1>
        <p className="mt-2 max-w-md text-sm text-slate-500">
          All maintenance and service workflows are now managed in the{" "}
          <strong>Service Requests</strong> module — with a full FSM, quoting, SLA
          enforcement, and escalations.
        </p>
      </div>
      <div className="flex items-center gap-3">
        <Button asChild>
          <Link href="/service-requests">Go to Service Requests</Link>
        </Button>
        <p className="text-xs text-slate-400">Redirecting automatically…</p>
      </div>
    </div>
  );
}
