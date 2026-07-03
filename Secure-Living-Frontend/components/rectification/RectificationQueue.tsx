"use client";

import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/lib/auth-context";
import { RectificationStatusBadge } from "./RectificationStatusBadge";

interface Rectification {
  id: string;
  module: string;
  resourceId: string;
  userId: string;
  status: string;
  reason: string;
  deadline: string;
  attempts: number;
  evidence: string;
  documents: string[];
  createdAt: string;
}

interface RectificationQueueProps {
  module: string;
}

export function RectificationQueue({ module }: RectificationQueueProps) {
  const { user } = useAuth();
  const [records, setRecords] = useState<Rectification[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [decision, setDecision] = useState<"approved" | "rejected">("approved");
  const [resolutionNotes, setResolutionNotes] = useState("");

  const authHeader = () => ({ Authorization: `Bearer ${user?.authToken ?? ""}` });

  const fetchRecords = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/v1/rectifications/batch?module=${module}`, { headers: authHeader() });
      if (res.ok) {
        const { data } = await res.json();
        setRecords(data);
      }
    } catch {
      console.error("Failed to fetch rectifications");
    } finally {
      setLoading(false);
    }
  }, [module, user?.authToken]);

  useEffect(() => {
    fetchRecords();
  }, [fetchRecords]);

  const handleComplete = async (rectificationId: string) => {
    if (!resolutionNotes.trim()) return;
    try {
      const res = await fetch(`/api/v1/rectifications/${rectificationId}/complete`, {
        method: "POST",
        headers: { "Content-Type": "application/json", ...authHeader() },
        body: JSON.stringify({ decision, resolutionNotes }),
      });
      if (res.ok) {
        setSelectedId(null);
        setResolutionNotes("");
        fetchRecords();
      }
    } catch {
      console.error("Failed to complete rectification");
    }
  };

  if (loading) {
    return <div className="py-4 text-center text-sm text-gray-500">Loading...</div>;
  }

  if (records.length === 0) {
    return (
      <div className="rounded-lg border border-gray-200 p-6 text-center text-sm text-gray-500 dark:border-gray-700">
        No rectification records found for this module.
      </div>
    );
  }

  const pendingReview = records.filter((r) => r.status === "rectified" || r.status === "appealed");

  return (
    <div className="space-y-3">
      {pendingReview.length > 0 && (
        <div className="rounded-md bg-amber-50 p-3 text-sm text-amber-800 dark:bg-amber-900/40 dark:text-amber-200">
          {pendingReview.length} rectification{pendingReview.length !== 1 ? "s" : ""} awaiting review
        </div>
      )}

      {records.map((record) => (
        <div
          key={record.id}
          className="rounded-lg border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-900"
        >
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-2">
              <RectificationStatusBadge status={record.status} />
              <span className="text-sm text-gray-500">
                {new Date(record.createdAt).toLocaleDateString()}
              </span>
            </div>
            <span className="text-xs text-gray-400">
              Attempt {record.attempts} &middot; Deadline: {new Date(record.deadline).toLocaleDateString()}
            </span>
          </div>

          <p className="mt-2 text-sm text-gray-700 dark:text-gray-300">
            <span className="font-medium">Reason:</span> {record.reason}
          </p>

          {record.evidence && (
            <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
              <span className="font-medium">Evidence:</span>{" "}
              {record.evidence.length > 200 ? record.evidence.slice(0, 200) + "..." : record.evidence}
            </p>
          )}

          {(record.status === "rectified" || record.status === "appealed") && (
            <div className="mt-3">
              {selectedId === record.id ? (
                <div className="space-y-3 rounded-md border border-gray-200 bg-gray-50 p-3 dark:border-gray-600 dark:bg-gray-800">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                      Decision
                    </label>
                    <select
                      value={decision}
                      onChange={(e) => setDecision(e.target.value as "approved" | "rejected")}
                      className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-1.5 text-sm dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100"
                    >
                      <option value="approved">Approve - Restore Original</option>
                      <option value="rejected">Reject - Keep Rejected</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                      Resolution Notes
                    </label>
                    <textarea
                      value={resolutionNotes}
                      onChange={(e) => setResolutionNotes(e.target.value)}
                      rows={2}
                      className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-1.5 text-sm dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100"
                      placeholder="Reason for decision..."
                    />
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleComplete(record.id)}
                      disabled={!resolutionNotes.trim()}
                      className="rounded-md bg-blue-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
                    >
                      Submit Decision
                    </button>
                    <button
                      onClick={() => setSelectedId(null)}
                      className="rounded-md border border-gray-300 px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:text-gray-300"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <button
                  onClick={() => setSelectedId(record.id)}
                  className="rounded-md bg-blue-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-blue-700"
                >
                  Review
                </button>
              )}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
