"use client";

import { useState, useCallback } from "react";
import { useAuth } from "@/lib/auth-context";
import { RectificationClient, type RectificationModule, type RectificationRecord } from "./rectification-client";

interface UseRectificationOptions {
  module: RectificationModule;
  resourceId: string;
}

interface UseRectificationReturn {
  rectification: RectificationRecord | null;
  loading: boolean;
  error: string | null;
  initiate: (reason: string, evidence?: string, documents?: string[]) => Promise<void>;
  submitEvidence: (rectificationId: string, evidence: string, documents?: string[]) => Promise<void>;
  refresh: () => Promise<void>;
}

export function useRectification({ module, resourceId }: UseRectificationOptions): UseRectificationReturn {
  const { user } = useAuth();
  const [rectification, setRectification] = useState<RectificationRecord | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const client = new RectificationClient(user?.authToken);

  const authHeader = () => ({ Authorization: `Bearer ${user?.authToken ?? ""}` });

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/v1/rectifications/batch?module=${module}`, { headers: authHeader() });
      if (res.ok) {
        const { data } = await res.json();
        const active = data.find(
          (r: RectificationRecord) =>
            r.resourceId === resourceId &&
            ["initiated", "under_review", "rectified", "appealed"].includes(r.status)
        );
        setRectification(active ?? null);
      }
    } catch {
      setError("Failed to load rectification status");
    } finally {
      setLoading(false);
    }
  }, [module, resourceId, user?.authToken]);

  const initiate = useCallback(async (reason: string, evidence?: string, documents?: string[]) => {
    setLoading(true);
    setError(null);
    try {
      const { data } = await client.initiate({
        module,
        resourceId,
        reason,
        evidence,
        documents,
      });
      setRectification(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to initiate rectification");
      throw err;
    } finally {
      setLoading(false);
    }
  }, [module, resourceId, user?.authToken]);

  const submitEvidence = useCallback(async (rectificationId: string, evidence: string, documents?: string[]) => {
    setLoading(true);
    setError(null);
    try {
      const { data } = await client.submit(rectificationId, { evidence, documents });
      setRectification(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to submit evidence");
      throw err;
    } finally {
      setLoading(false);
    }
  }, [user?.authToken]);

  return { rectification, loading, error, initiate, submitEvidence, refresh };
}
