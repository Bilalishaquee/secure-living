import { SrStatus } from "@prisma/client";
import type { ApiActor } from "@/lib/server/authz";

// All valid FSM transitions
export const SR_TRANSITIONS: Record<string, SrStatus[]> = {
  [SrStatus.DRAFT]: [SrStatus.SUBMITTED],
  [SrStatus.SUBMITTED]: [SrStatus.APPROVED, SrStatus.REJECTED],
  [SrStatus.APPROVED]: [SrStatus.QUOTING, SrStatus.ASSIGNED],
  [SrStatus.QUOTING]: [SrStatus.AWAITING_FUNDING, SrStatus.APPROVED],
  [SrStatus.AWAITING_FUNDING]: [SrStatus.FUNDED],
  [SrStatus.FUNDED]: [SrStatus.ASSIGNED],
  [SrStatus.ASSIGNED]: [SrStatus.SCHEDULING_PENDING, SrStatus.IN_PROGRESS],
  [SrStatus.SCHEDULING_PENDING]: [SrStatus.IN_PROGRESS, SrStatus.ASSIGNED],
  [SrStatus.IN_PROGRESS]: [SrStatus.BLOCKED, SrStatus.COMPLETED],
  [SrStatus.BLOCKED]: [SrStatus.IN_PROGRESS],
  [SrStatus.COMPLETED]: [SrStatus.DISPUTED],
  [SrStatus.CANCELLED]: [],
  [SrStatus.DISPUTED]: [],
  [SrStatus.REJECTED]: [],
};

// Terminal states that cannot be cancelled
const TERMINAL_STATES: SrStatus[] = [SrStatus.COMPLETED, SrStatus.CANCELLED];

export function canSrTransition(current: string, next: string): boolean {
  if (current === next) return false;
  // Any non-terminal state can be cancelled
  if (next === SrStatus.CANCELLED && !TERMINAL_STATES.includes(current as SrStatus)) {
    return true;
  }
  return (SR_TRANSITIONS[current] ?? []).includes(next as SrStatus);
}

// Maps a destination status to its outbox event type
export const SR_EVENT_MAP: Record<string, string> = {
  [SrStatus.SUBMITTED]: "request.submitted",
  [SrStatus.APPROVED]: "request.approved",
  [SrStatus.REJECTED]: "request.rejected",
  [SrStatus.QUOTING]: "request.quoting",
  [SrStatus.AWAITING_FUNDING]: "request.awaiting_funding",
  [SrStatus.FUNDED]: "request.funded",
  [SrStatus.ASSIGNED]: "request.assigned",
  [SrStatus.SCHEDULING_PENDING]: "request.scheduling_pending",
  [SrStatus.IN_PROGRESS]: "request.in_progress",
  [SrStatus.BLOCKED]: "request.blocked",
  [SrStatus.COMPLETED]: "request.completed",
  [SrStatus.CANCELLED]: "request.cancelled",
  [SrStatus.DISPUTED]: "request.disputed",
};

export function canManageSr(actor: ApiActor): boolean {
  return (
    actor.permissions.includes("*") ||
    actor.permissions.includes("service-request:manage")
  );
}

export function canExecuteSr(actor: ApiActor): boolean {
  return (
    actor.permissions.includes("*") ||
    actor.permissions.includes("service-request:execute")
  );
}

export function canDisputeSr(actor: ApiActor): boolean {
  return (
    actor.permissions.includes("*") ||
    actor.permissions.includes("service-request:dispute")
  );
}
