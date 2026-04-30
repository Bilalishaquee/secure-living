import type { ApiActor } from "@/lib/server/authz";

const transitions: Record<string, string[]> = {
  draft: ["approved", "cancelled"],
  approved: ["in_progress", "cancelled"],
  in_progress: ["completed", "escalated", "cancelled"],
  escalated: ["in_progress", "completed", "cancelled"],
  completed: [],
  cancelled: [],
};

export function canTransitionServiceStatus(current: string, next: string): boolean {
  if (current === next) return true;
  return (transitions[current] ?? []).includes(next);
}

export function canApproveService(actor: ApiActor): boolean {
  return actor.permissions.includes("*") || actor.permissions.includes("maintenance:approve");
}

export function canEscalateService(actor: ApiActor): boolean {
  return actor.permissions.includes("*") || actor.permissions.includes("maintenance:escalate");
}
