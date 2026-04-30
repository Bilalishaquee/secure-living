import { randomUUID } from "crypto";
import { prisma } from "@/lib/server/db";

export async function appendAudit(input: {
  userId: string;
  role: string;
  action: string;
  resourceType: string;
  resourceId: string;
  branchId?: string | null;
  orgId?: string | null;
  beforeJson?: unknown;
  afterJson?: unknown;
}) {
  await prisma.auditLog.create({
    data: {
      id: randomUUID(),
      userId: input.userId,
      role: input.role,
      action: input.action,
      resourceType: input.resourceType,
      resourceId: input.resourceId,
      branchId: input.branchId ?? null,
      orgId: input.orgId ?? null,
      beforeJson: input.beforeJson ? JSON.stringify(input.beforeJson) : null,
      afterJson: input.afterJson ? JSON.stringify(input.afterJson) : null,
    },
  });
}
