"use client";

import { useState } from "react";
import { useAuth } from "@/lib/auth-context";
import type { RectificationModule } from "./RectificationBanner";

interface RectificationFormProps {
  module: RectificationModule;
  resourceId: string;
  onSuccess: (rectificationId: string) => void;
  onCancel: () => void;
}

const MIN_EVIDENCE_LENGTHS: Record<RectificationModule, number> = {
  application: 20,
  kyc: 30,
  dispute: 50,
  service_request: 20,
  professional: 25,
  organization: 40,
};

const PLACEHOLDER_TEXTS: Record<RectificationModule, string> = {
  application: "Describe what information you have corrected and provide any additional context...",
  kyc: "Explain what documents you are uploading and how they address the rejection reason...",
  dispute: "Provide detailed reasoning and evidence for your appeal. Include specific facts and dates...",
  service_request: "Explain how you have addressed the issues that led to the rejection...",
  professional: "Describe the corrections you have made to your professional profile...",
  organization: "Provide corrected organization details and explain how they address the rejection...",
};

export function RectificationForm({ module, resourceId, onSuccess, onCancel }: RectificationFormProps) {
  const { user } = useAuth();
  const [reason, setReason] = useState("");
  const [evidence, setEvidence] = useState("");
  const [documents, setDocuments] = useState<File[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const minEvidence = MIN_EVIDENCE_LENGTHS[module];
  const placeholder = PLACEHOLDER_TEXTS[module];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (reason.length < 10) {
      setError("Please provide a detailed reason (at least 10 characters)");
      return;
    }

    if (evidence.length < minEvidence) {
      setError(`Please provide at least ${minEvidence} characters of evidence`);
      return;
    }

    setSubmitting(true);
    try {
      const body = { module, resourceId, reason, evidence, documents: [] };
      const res = await fetch("/api/v1/rectifications/initiate", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${user?.authToken ?? ""}` },
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Failed to initiate rectification");
      }

      const { data } = await res.json();
      onSuccess(data.id);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to submit rectification");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="mt-4 rounded-lg border border-gray-200 bg-white p-6 dark:border-gray-700 dark:bg-gray-900">
      <h3 className="mb-4 text-lg font-semibold text-gray-900 dark:text-white">
        Rectify & Resubmit
      </h3>

      {error && (
        <div className="mb-4 rounded-md bg-red-50 p-3 text-sm text-red-700 dark:bg-red-900/40 dark:text-red-300">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
            Reason for Rectification
          </label>
          <textarea
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            rows={2}
            className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100"
            placeholder="Why was your original submission rejected?"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
            Evidence / Explanation
          </label>
          <textarea
            value={evidence}
            onChange={(e) => setEvidence(e.target.value)}
            rows={4}
            className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100"
            placeholder={placeholder}
          />
          <p className="mt-1 text-xs text-gray-500">
            Minimum {minEvidence} characters ({evidence.length} / {minEvidence})
          </p>
        </div>

        <div className="flex items-center gap-3 pt-2">
          <button
            type="submit"
            disabled={submitting}
            className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {submitting ? "Submitting..." : "Submit Rectification"}
          </button>
          <button
            type="button"
            onClick={onCancel}
            disabled={submitting}
            className="rounded-md border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-800"
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}
