import { randomUUID } from "crypto";
import { z } from "zod";
import { SrStatus, ServiceRequestType, SrPriority, ServiceMode, SrCategory, RequestSource } from "@prisma/client";
import { prisma } from "@/lib/server/db";
import { appendAudit } from "@/lib/server/audit";
import { parseBody, requireActor, requirePermission, requireScope, jsonError, withErrorHandler } from "@/lib/server/http";
import { writeSrTransition, writeOutboxEvent } from "@/lib/server/sr-helpers";
import { SR_EVENT_MAP } from "@/lib/server/service-fsm";

// ── Schema ─────────────────────────────────────────────────────────────────────

const createSrSchema = z.object({
  organizationId: z.string().min(1),
  branchId: z.string().min(1),
  propertyId: z.string().optional(),
  unitId: z.string().optional(),
  tenantUserId: z.string().optional(),
  title: z.string().min(3).max(160),
  description: z.string().min(5).max(5000),
  serviceType: z.nativeEnum(ServiceRequestType).default(ServiceRequestType.MAINTENANCE),
  serviceMode: z.nativeEnum(ServiceMode).default(ServiceMode.MARKETPLACE),
  srCategory: z.nativeEnum(SrCategory).default(SrCategory.OPERATIONAL),
  srPriority: z.nativeEnum(SrPriority).default(SrPriority.NORMAL),
  requestSource: z.nativeEnum(RequestSource).default(RequestSource.MOBILE_APP),
  shortStayBookingId: z.string().optional(),
  guestId: z.string().optional(),
  bookingCheckInAt: z.string().datetime().optional(),
  bookingCheckOutAt: z.string().datetime().optional(),
  turnaroundDeadline: z.string().datetime().optional(),
  idempotencyKey: z.string().optional(),
  metadata: z.record(z.string(), z.unknown()).optional(),
  dueAt: z.string().datetime().optional(),
  // Legacy fields
  type: z.string().optional(),
  category: z.string().optional(),
  priority: z.string().optional(),
  scheduledDate: z.string().datetime().optional(),
});

// ── GET ────────────────────────────────────────────────────────────────────────

export const GET = withErrorHandler(async (req: Request) => {
  const actor = requireActor(req);
  if (actor instanceof Response) return actor;
  const denied = requirePermission(actor, "service-request:view");
  if (denied) return denied;

  const url = new URL(req.url);
  const branchId = url.searchParams.get("branchId");
  const orgId = url.searchParams.get("organizationId");
  const serviceType = url.searchParams.get("serviceType") as ServiceRequestType | null;
  const srStatus = url.searchParams.get("srStatus") as SrStatus | null;
  const srPriority = url.searchParams.get("srPriority") as SrPriority | null;
  const serviceMode = url.searchParams.get("serviceMode") as ServiceMode | null;
  const assignedToUserId = url.searchParams.get("assignedToUserId");
  const unitId = url.searchParams.get("unitId");
  const propertyId = url.searchParams.get("propertyId");
  const shortStayBookingId = url.searchParams.get("shortStayBookingId");
  const page = Math.max(1, parseInt(url.searchParams.get("page") ?? "1", 10));
  const limit = Math.min(100, Math.max(1, parseInt(url.searchParams.get("limit") ?? "20", 10)));
  const skip = (page - 1) * limit;

  const scopeFilter = actor.permissions.includes("*")
    ? {}
    : { branchId: { in: actor.branchIds }, organizationId: { in: actor.orgIds } };

  const where = {
    ...scopeFilter,
    ...(branchId ? { branchId } : {}),
    ...(orgId ? { organizationId: orgId } : {}),
    ...(serviceType ? { serviceType } : {}),
    ...(srStatus ? { srStatus } : {}),
    ...(srPriority ? { srPriority } : {}),
    ...(serviceMode ? { serviceMode } : {}),
    ...(assignedToUserId ? { assignedToUserId } : {}),
    ...(unitId ? { unitId } : {}),
    ...(propertyId ? { propertyId } : {}),
    ...(shortStayBookingId ? { shortStayBookingId } : {}),
  };

  const [total, rows] = await Promise.all([
    prisma.serviceRequest.count({ where }),
    prisma.serviceRequest.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip,
      take: limit,
      include: {
        srHistory: { orderBy: { changedAt: "desc" } },
        srAssignments: { orderBy: { assignedAt: "desc" } },
        escalations: { orderBy: { escalatedAt: "desc" } },
        quotes: { orderBy: { createdAt: "desc" } },
      },
    }),
  ]);

  return Response.json({
    data: rows,
    pagination: { page, limit, total, pages: Math.ceil(total / limit) },
  });
});

// ── POST ───────────────────────────────────────────────────────────────────────

export const POST = withErrorHandler(async (req: Request) => {
  const actor = requireActor(req);
  if (actor instanceof Response) return actor;
  const denied = requirePermission(actor, "service-request:create");
  if (denied) return denied;

  const parsed = await parseBody(req, createSrSchema);
  if (!parsed.ok) return parsed.response;
  const body = parsed.data;

  const scoped = requireScope(actor, body.organizationId, body.branchId);
  if (scoped) return scoped;

  // CUSTOM type must have a registered CustomTypeDefinition
  if (body.serviceType === ServiceRequestType.CUSTOM) {
    const customDef = await prisma.customTypeDefinition.findFirst({
      where: { isActive: true },
    });
    if (!customDef) {
      return jsonError(422, "Cannot create a CUSTOM service request: no active CustomTypeDefinition exists. Please register a custom type first.");
    }
  }

  // Idempotency check
  if (body.idempotencyKey) {
    const existing = await prisma.serviceRequest.findUnique({
      where: { idempotencyKey: body.idempotencyKey },
      include: {
        srHistory: { orderBy: { changedAt: "desc" } },
        srAssignments: { orderBy: { assignedAt: "desc" } },
        escalations: { orderBy: { escalatedAt: "desc" } },
        quotes: { orderBy: { createdAt: "desc" } },
      },
    });
    if (existing) return Response.json({ data: existing }, { status: 200 });
  }

  const id = randomUUID();

  const row = await prisma.$transaction(async (tx) => {
    const sr = await tx.serviceRequest.create({
      data: {
        id,
        organizationId: body.organizationId,
        branchId: body.branchId,
        propertyId: body.propertyId ?? null,
        unitId: body.unitId ?? null,
        tenantUserId: body.tenantUserId ?? null,
        title: body.title,
        description: body.description,
        serviceType: body.serviceType,
        serviceMode: body.serviceMode,
        srCategory: body.srCategory,
        srPriority: body.srPriority,
        requestSource: body.requestSource,
        srStatus: SrStatus.DRAFT,
        status: "DRAFT",
        type: body.type ?? "maintenance",
        category: body.category ?? "other",
        priority: body.priority ?? "low",
        idempotencyKey: body.idempotencyKey ?? null,
        metadata: body.metadata ? (body.metadata as import("@prisma/client").Prisma.InputJsonValue) : undefined,
        dueAt: body.dueAt ? new Date(body.dueAt) : null,
        shortStayBookingId: body.shortStayBookingId ?? null,
        guestId: body.guestId ?? null,
        bookingCheckInAt: body.bookingCheckInAt ? new Date(body.bookingCheckInAt) : null,
        bookingCheckOutAt: body.bookingCheckOutAt ? new Date(body.bookingCheckOutAt) : null,
        turnaroundDeadline: body.turnaroundDeadline ? new Date(body.turnaroundDeadline) : null,
        scheduledDate: body.scheduledDate ? new Date(body.scheduledDate) : null,
        createdBy: actor.userId,
      },
    });

    await writeSrTransition(tx, sr.id, actor.userId, SrStatus.DRAFT, SrStatus.DRAFT, "Created");
    await writeOutboxEvent(tx, "request.created", { serviceRequestId: sr.id, actorId: actor.userId }, sr.id);

    return sr;
  });

  await appendAudit({
    userId: actor.userId,
    role: actor.role,
    action: "service_request.created",
    resourceType: "service_request",
    resourceId: row.id,
    orgId: row.organizationId,
    branchId: row.branchId,
    afterJson: row,
  });

  return Response.json({ data: row }, { status: 201 });
});
