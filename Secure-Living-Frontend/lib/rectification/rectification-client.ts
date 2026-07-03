export type RectificationModule = "application" | "kyc" | "dispute" | "service_request" | "professional" | "organization";

export interface InitiateRectificationInput {
  module: RectificationModule;
  resourceId: string;
  reason: string;
  evidence?: string;
  documents?: string[];
}

export interface SubmitRectificationInput {
  evidence: string;
  documents?: string[];
  adminNotes?: string;
}

export interface CompleteRectificationInput {
  decision: "approved" | "rejected";
  resolutionNotes: string;
}

export interface AppealRectificationInput {
  reason: string;
  evidence: string;
  documents?: string[];
}

export interface RectificationRecord {
  id: string;
  module: RectificationModule;
  resourceId: string;
  userId: string;
  status: "initiated" | "under_review" | "rectified" | "rejected_final" | "appealed" | "completed" | "expired";
  reason: string;
  deadline: string;
  attempts: number;
  documents: string[];
  evidence: string;
  adminNotes?: string;
  resolutionNotes?: string;
  createdAt: string;
  updatedAt: string;
}

export class RectificationClient {
  private base = "/api/v1/rectifications";
  private token: string;

  constructor(token: string = "") {
    this.token = token;
  }

  private headers(extra: Record<string, string> = {}): Record<string, string> {
    const h: Record<string, string> = { "Content-Type": "application/json", ...extra };
    if (this.token) h["Authorization"] = `Bearer ${this.token}`;
    return h;
  }

  async initiate(input: InitiateRectificationInput): Promise<{ data: RectificationRecord }> {
    const res = await fetch(`${this.base}/initiate`, {
      method: "POST",
      headers: this.headers(),
      body: JSON.stringify(input),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: "Request failed" }));
      throw new Error(err.error || "Failed to initiate rectification");
    }
    return res.json();
  }

  async submit(rectificationId: string, input: SubmitRectificationInput): Promise<{ data: RectificationRecord }> {
    const res = await fetch(`${this.base}/${rectificationId}/submit`, {
      method: "POST",
      headers: this.headers(),
      body: JSON.stringify(input),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: "Request failed" }));
      throw new Error(err.error || "Failed to submit rectification");
    }
    return res.json();
  }

  async status(rectificationId: string): Promise<{ data: RectificationRecord }> {
    const res = await fetch(`${this.base}/${rectificationId}/status`, { headers: this.headers() });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: "Request failed" }));
      throw new Error(err.error || "Failed to get rectification status");
    }
    return res.json();
  }

  async complete(rectificationId: string, input: CompleteRectificationInput): Promise<{ data: RectificationRecord }> {
    const res = await fetch(`${this.base}/${rectificationId}/complete`, {
      method: "POST",
      headers: this.headers(),
      body: JSON.stringify(input),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: "Request failed" }));
      throw new Error(err.error || "Failed to complete rectification");
    }
    return res.json();
  }

  async appeal(rectificationId: string, input: AppealRectificationInput): Promise<{ data: RectificationRecord }> {
    const res = await fetch(`${this.base}/${rectificationId}/appeal`, {
      method: "POST",
      headers: this.headers(),
      body: JSON.stringify(input),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: "Request failed" }));
      throw new Error(err.error || "Failed to appeal rectification");
    }
    return res.json();
  }

  async listByModule(module: RectificationModule, status?: string): Promise<{ data: RectificationRecord[] }> {
    const params = new URLSearchParams({ module });
    if (status) params.set("status", status);
    const res = await fetch(`${this.base}/batch?${params}`, { headers: this.headers() });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: "Request failed" }));
      throw new Error(err.error || "Failed to list rectifications");
    }
    return res.json();
  }
}

export const rectificationClient = new RectificationClient();
