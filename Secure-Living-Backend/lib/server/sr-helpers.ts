import { SrStatus, Prisma } from "@prisma/client";
import { randomUUID } from "crypto";

// Type alias for the Prisma interactive transaction client
export type PrismaTransactionClient = Omit<
  import("@prisma/client").PrismaClient,
  "$connect" | "$disconnect" | "$on" | "$transaction" | "$use" | "$extends"
>;

export async function writeSrTransition(
  tx: PrismaTransactionClient,
  serviceRequestId: string,
  changedBy: string,
  fromStatus: SrStatus,
  toStatus: SrStatus,
  note?: string
): Promise<void> {
  await tx.serviceRequestHistory.create({
    data: {
      id: randomUUID(),
      serviceRequestId,
      changedBy,
      fromStatus,
      toStatus,
      note: note ?? null,
    },
  });
}

export async function writeOutboxEvent(
  tx: PrismaTransactionClient,
  eventType: string,
  payload: Record<string, unknown>,
  serviceRequestId?: string
): Promise<void> {
  await tx.outboxEvent.create({
    data: {
      id: randomUUID(),
      eventType,
      payload: payload as Prisma.InputJsonValue,
      processed: false,
      serviceRequestId: serviceRequestId ?? null,
    },
  });
}
