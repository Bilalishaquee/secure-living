import { randomUUID } from "crypto";
import { prisma } from "@/lib/server/db";
import { requireActor, jsonError, withErrorHandler } from "@/lib/server/http";

export const POST = withErrorHandler(async (req: Request) => {
  const actor = requireActor(req);
  if (actor instanceof Response) return actor;

  const body = (await req.json().catch(() => null)) as {
    fileName?: string;
    fileFormat?: string;
    records?: Array<{
      tenantId: string;
      unitId: string;
      propertyId?: string;
      periodYear: number;
      periodMonth: number;
      rentAmountKes: number;
      paidAmountKes?: number;
      balanceKes?: number;
      dueDate?: string;
      paidDate?: string;
      paymentMethod?: string;
      mpesaReference?: string;
      notes?: string;
    }>;
  } | null;
  if (!body || !body.records || !Array.isArray(body.records)) {
    return jsonError(400, "Body must include 'records' array");
  }

  const organizationId = actor.orgIds?.[0];
  if (!organizationId) return jsonError(400, "Actor has no organization");

  const importJob = await prisma.dataImportJob.create({
    data: {
      id: randomUUID(),
      organizationId,
      importType: "past_rent",
      fileName: body.fileName ?? "upload.csv",
      fileFormat: body.fileFormat ?? "csv",
      recordCount: body.records.length,
      successCount: 0,
      errorCount: 0,
      status: "PROCESSING",
      createdBy: actor.userId,
    },
  });

  let successCount = 0;
  let errorCount = 0;
  const errors: Array<{ index: number; error: string }> = [];

  for (let i = 0; i < body.records.length; i++) {
    const r = body.records[i];
    try {
      await prisma.pastRentRecord.create({
        data: {
          id: randomUUID(),
          organizationId,
          tenantId: r.tenantId,
          unitId: r.unitId,
          propertyId: r.propertyId ?? null,
          periodYear: r.periodYear,
          periodMonth: r.periodMonth,
          rentAmountKes: r.rentAmountKes,
          paidAmountKes: r.paidAmountKes ?? 0,
          balanceKes: r.balanceKes ?? Math.max(0, r.rentAmountKes - (r.paidAmountKes ?? 0)),
          dueDate: r.dueDate ? new Date(r.dueDate) : null,
          paidDate: r.paidDate ? new Date(r.paidDate) : null,
          paymentMethod: r.paymentMethod ?? null,
          mpesaReference: r.mpesaReference ?? null,
          notes: r.notes ?? null,
          importJobId: importJob.id,
        },
      });
      successCount++;
    } catch (err) {
      errorCount++;
      errors.push({ index: i, error: err instanceof Error ? err.message : "Unknown error" });
    }
  }

  const finalJob = await prisma.dataImportJob.update({
    where: { id: importJob.id },
    data: {
      successCount,
      errorCount,
      errorsJson: errors as unknown as import("@prisma/client").Prisma.InputJsonValue,
      status: errorCount === 0 ? "COMPLETED" : (successCount === 0 ? "FAILED" : "COMPLETED"),
      completedAt: new Date(),
    },
  });

  return Response.json({ data: finalJob }, { status: 201 });
});
