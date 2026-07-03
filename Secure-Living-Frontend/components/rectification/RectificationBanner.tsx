"use client";

import { useState } from "react";
import { RectificationForm } from "./RectificationForm";

export type RectificationModule = "application" | "kyc" | "dispute" | "service_request" | "professional" | "organization";

const MODULE_LABELS: Record<RectificationModule, { resource: string; action: string; instructions: string }> = {
  application:        { resource: "Application",         action: "resubmit",    instructions: "Correct the information and resubmit your application for re-review." },
  kyc:                { resource: "KYC Documents",       action: "upload",      instructions: "Upload corrected KYC documents matching the required standards." },
  dispute:            { resource: "Dispute",             action: "appeal",      instructions: "Provide additional evidence to support your dispute appeal." },
  service_request:    { resource: "Service Request",     action: "modify",      instructions: "Modify and resubmit your service request with corrected details." },
  professional:       { resource: "Professional Profile", action: "update",     instructions: "Update your professional profile with corrected information." },
  organization:       { resource: "Organization",        action: "reapply",     instructions: "Correct your organization details and reapply for verification." },
};

interface RectificationBannerProps {
  module: RectificationModule;
  resourceId: string;
  originalStatus: string;
  rejectionReason?: string;
  activeRectification?: { id: string; status: string; deadline: string } | null;
  onRectificationStarted: (rectificationId: string) => void;
}

export function RectificationBanner({
  module,
  resourceId,
  originalStatus,
  rejectionReason,
  activeRectification,
  onRectificationStarted,
}: RectificationBannerProps) {
  const [showForm, setShowForm] = useState(false);
  const labels = MODULE_LABELS[module];

  if (activeRectification) {
    const deadline = new Date(activeRectification.deadline);
    const isExpired = deadline < new Date();
    const daysLeft = Math.ceil((deadline.getTime() - Date.now()) / (1000 * 60 * 60 * 24));

    return (
      <div className="rounded-lg border border-blue-200 bg-blue-50 p-4 dark:border-blue-800 dark:bg-blue-950">
        <div className="flex items-start gap-3">
          <span className="mt-0.5 text-xl">🔄</span>
          <div className="flex-1">
            <p className="font-semibold text-blue-900 dark:text-blue-100">
              Rectification in Progress
            </p>
            <p className="mt-1 text-sm text-blue-700 dark:text-blue-300">
              Status: <span className="font-medium capitalize">{activeRectification.status.replace("_", " ")}</span>
              {isExpired
                ? " — Deadline has passed"
                : ` — ${daysLeft} day${daysLeft !== 1 ? "s" : ""} remaining`}
            </p>
            {activeRectification.status === "under_review" && (
              <p className="mt-1 text-sm text-blue-600">
                Your rectification has been submitted and is awaiting admin review.
              </p>
            )}
          </div>
        </div>
      </div>
    );
  }

  if (originalStatus !== "REJECTED" && originalStatus !== "rejected" && originalStatus !== "RESOLVED_REJECTED") {
    return null;
  }

  return (
    <div>
      <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 dark:border-amber-800 dark:bg-amber-950">
        <div className="flex items-start gap-3">
          <span className="mt-0.5 text-xl">⚠️</span>
          <div className="flex-1">
            <p className="font-semibold text-amber-900 dark:text-amber-100">
              {labels.resource} Requires Attention
            </p>
            <p className="mt-1 text-sm text-amber-700 dark:text-amber-300">
              {labels.instructions}
            </p>
            {rejectionReason && (
              <p className="mt-2 text-sm text-amber-800 dark:text-amber-200">
                <span className="font-medium">Reason: </span>
                {rejectionReason}
              </p>
            )}
          </div>
          <button
            onClick={() => setShowForm(true)}
            className="shrink-0 rounded-md bg-amber-600 px-4 py-2 text-sm font-medium text-white hover:bg-amber-700"
          >
            {labels.action === "appeal" ? "Appeal" : `Rectify & ${labels.action === "resubmit" ? "Resubmit" : "Submit"}`}
          </button>
        </div>
      </div>

      {showForm && (
        <RectificationForm
          module={module}
          resourceId={resourceId}
          onSuccess={onRectificationStarted}
          onCancel={() => setShowForm(false)}
        />
      )}
    </div>
  );
}
