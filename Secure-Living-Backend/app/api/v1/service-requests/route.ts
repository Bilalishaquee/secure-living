import { randomUUID } from "crypto";
import { z } from "zod";
import { SrStatus, ServiceRequestType, SrPriority, ServiceMode, SrCategory, RequestSource } from "@prisma/client";
import { prisma } from "@/lib/server/db";
import { appendAudit } from "@/lib/server/audit";
import { parseBody, requireActor, requirePermission, requireScope, jsonError, withErrorHandler } from "@/lib/server/http";
import { writeSrTransition, writeOutboxEvent } from "@/lib/server/sr-helpers";
import { isServiceTypeBlocked } from "@/lib/server/service-access";
import { notify } from "@/lib/server/notify";

// ── Service Request Ownership Rules (UPDATE.md: "Service Request Ownership") ────
//
// Who receives a request: on creation, if the request is tied to a property that
// has a managerUserId set, it is auto-assigned to that property manager as the
// first responsible party (see `initialAssigneeUserId` below). If the property has
// no manager on file, the request stays unassigned and lands in the org's shared
// queue (GET /service-requests with no assignedToUserId filter) for any staff
// member with service-request:manage to triage manually via POST .../assign.
//
// Assignment rules: the auto-assignment above is a lightweight "first responder"
// assignment (plain assignedToUserId, no ServiceRequestAssignment row, no provider
// vetting) so the property manager can triage. The separate POST .../assign route
// is for the later, distinct step of assigning an actual ServiceProvider to execute
// the work — it enforces provider category rules (INTERNAL vs VERIFIED_MARKETPLACE)
// that don't apply to a manager doing initial triage.
//
// Resolution workflow: the SrStatus enum transitions (see lib/server/service-fsm.ts)
// from SUBMITTED through APPROVED/QUOTING/ASSIGNED/IN_PROGRESS to COMPLETED.
//
// Escalation workflow: modeled as its own ServiceRequestEscalation record (see
// POST .../escalate), not a status value — escalating doesn't change srStatus, it
// records who escalated to whom and why, for SLA/oversight purposes.
//
// Closure process: COMPLETED (work done) or CANCELLED (withdrawn) are the terminal
// srStatus values — see canSrTransition in service-fsm.ts for the exact allowed
// terminal transitions.
//
// Notification rule: every ownership-relevant event (auto-assign, manual assign,
// escalate, status change) is written to AuditLog via appendAudit AND fanned out
// via lib/server/notify.ts to the assignee directly (or Super Admin/Admin when
// unassigned) — see the notify() calls below and in assign/escalate/complete/block.

// ── Schema ─────────────────────────────────────────────────────────────────────

const createSrSchema = z.object({
  organizationId: z.string().min(1).optional(),
  branchId: z.string().min(1).optional(),
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
  customTypeId: z.string().optional(),
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
  const tenantUserId = url.searchParams.get("tenantUserId");
  const unitId = url.searchParams.get("unitId");
  const propertyId = url.searchParams.get("propertyId");
  const shortStayBookingId = url.searchParams.get("shortStayBookingId");
  const page = Math.max(1, parseInt(url.searchParams.get("page") ?? "1", 10));
  const limit = Math.min(100, Math.max(1, parseInt(url.searchParams.get("limit") ?? "20", 10)));
  const skip = (page - 1) * limit;

  const scopeFilter = actor.permissions.includes("*")
    ? {}
    : { branchId: { in: actor.branchIds }, organizationId: { in: actor.orgIds } };

  const tenantOwnFilter = actor.role === "tenant"
    ? { OR: [{ tenantUserId: actor.userId }, { createdBy: actor.userId }] }
    : {};

  const where = {
    ...scopeFilter,
    ...tenantOwnFilter,
    ...(branchId ? { branchId } : {}),
    ...(orgId ? { organizationId: orgId } : {}),
    ...(serviceType ? { serviceType } : {}),
    ...(srStatus ? { srStatus } : {}),
    ...(srPriority ? { srPriority } : {}),
    ...(serviceMode ? { serviceMode } : {}),
    ...(assignedToUserId ? { assignedToUserId } : {}),
    ...(tenantUserId ? { tenantUserId } : {}),
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

  const property = body.propertyId
    ? await prisma.property.findFirst({
        where: {
          id: body.propertyId,
          ...(actor.permissions.includes("*") ? {} : { organizationId: { in: actor.orgIds } }),
        },
        select: { id: true, organizationId: true, branchId: true, managerUserId: true },
      })
    : null;
  if (body.propertyId && !property) return jsonError(404, "Property not found or out of scope");

  const unit = body.unitId
    ? await prisma.unit.findFirst({
        where: {
          id: body.unitId,
          ...(body.propertyId ? { propertyId: body.propertyId } : {}),
          ...(actor.permissions.includes("*") ? {} : { organizationId: { in: actor.orgIds }, branchId: { in: actor.branchIds } }),
        },
        select: { id: true, organizationId: true, branchId: true, propertyId: true },
      })
    : null;
  if (body.unitId && !unit) return jsonError(404, "Unit not found or out of scope");

  const organizationId = body.organizationId ?? property?.organizationId ?? unit?.organizationId ?? actor.orgIds[0];
  const branchId = body.branchId ?? property?.branchId ?? unit?.branchId ?? actor.branchIds[0];
  if (!organizationId || !branchId) {
    return jsonError(400, "Unable to determine organization or branch for this service request");
  }

  if (property && (property.organizationId !== organizationId || property.branchId !== branchId)) {
    return jsonError(400, "Property does not match the selected organization or branch");
  }
  if (unit && (unit.organizationId !== organizationId || unit.branchId !== branchId)) {
    return jsonError(400, "Unit does not match the selected organization or branch");
  }

  const scoped = requireScope(actor, organizationId, branchId);
  if (scoped) return scoped;

  const restriction = await isServiceTypeBlocked(body.serviceType, {
    userId: actor.userId,
    organizationId: body.organizationId,
  });
  if (restriction.blocked) {
    return jsonError(403, restriction.reason ?? `Access to "${body.serviceType}" service requests has been restricted by an administrator.`);
  }

  // Phase 3: CUSTOM type must reference a specific registered CustomTypeDefinition
  if (body.serviceType === ServiceRequestType.CUSTOM) {
    if (!body.customTypeId) {
      return jsonError(422, "Cannot create a CUSTOM service request: customTypeId is required. Specify which custom type definition to use.");
    }
    const customDef = await prisma.customTypeDefinition.findFirst({
      where: { id: body.customTypeId, isActive: true },
    });
    if (!customDef) {
      return jsonError(422, "Cannot create a CUSTOM service request: the specified CustomTypeDefinition does not exist or is inactive.");
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

  // ── Package-based service request gating ──────────────────────────────────
  const subscription = await prisma.userPackageSubscription.findFirst({
    where: { userId: actor.userId, status: { in: ["active", "trial", "trialing"] } },
    include: { package: true },
    orderBy: { startedAt: "desc" },
  });

  if (subscription) {
    const pkg = subscription.package;

    // Listing-Only packages: no service requests at all
    if (pkg.isListingOnly || !pkg.hasServiceRequests) {
      return Response.json(
        { error: "Your current plan does not include service requests. Upgrade to Starter or higher." },
        { status: 403 }
      );
    }

    // Free tier: monthly limit (default 3)
    if (pkg.serviceRequestMonthlyLimit !== null) {
      // Reset counter if new month
      const now = new Date();
      const counterReset = new Date(subscription.srCounterResetAt);
      const isSameMonth = now.getFullYear() === counterReset.getFullYear() && now.getMonth() === counterReset.getMonth();
      let usedCount = isSameMonth ? subscription.srUsedThisMonth : 0;

      if (!isSameMonth) {
        await prisma.userPackageSubscription.update({
          where: { id: subscription.id },
          data: { srUsedThisMonth: 0, srCounterResetAt: now },
        });
        usedCount = 0;
      }

      if (usedCount >= pkg.serviceRequestMonthlyLimit) {
        return Response.json(
          {
            error: `You have used your ${pkg.serviceRequestMonthlyLimit} free service requests this month. Upgrade to Starter to unlock unlimited requests.`,
            srUsed: usedCount,
            srLimit: pkg.serviceRequestMonthlyLimit,
          },
          { status: 403 }
        );
      }
    }
  }

  const id = randomUUID();

  const initialAssigneeUserId = property?.managerUserId ?? null;

  const row = await prisma.$transaction(async (tx) => {
    const sr = await tx.serviceRequest.create({
      data: {
        id,
        organizationId,
        branchId,
        propertyId: body.propertyId ?? null,
        unitId: body.unitId ?? null,
        tenantUserId: body.tenantUserId ?? (actor.role === "tenant" ? actor.userId : null),
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
        assignedToUserId: initialAssigneeUserId,
        metadata: body.customTypeId
          ? { ...((body.metadata as Record<string, unknown>) ?? {}), customTypeId: body.customTypeId } as import("@prisma/client").Prisma.InputJsonValue
          : body.metadata ? (body.metadata as import("@prisma/client").Prisma.InputJsonValue) : undefined,
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

  if (initialAssigneeUserId) {
    await appendAudit({
      userId: actor.userId,
      role: actor.role,
      action: "service_request.auto_assigned",
      resourceType: "service_request",
      resourceId: row.id,
      orgId: row.organizationId,
      branchId: row.branchId,
      afterJson: { assignedToUserId: initialAssigneeUserId, reason: "property manager on file" },
    });
    await notify({
      organizationId: row.organizationId,
      branchId: row.branchId,
      roles: [],
      userIds: [initialAssigneeUserId],
      excludeUserId: actor.userId,
      type: "service_request.assigned",
      severity: "info",
      title: "New service request assigned to you",
      message: `"${row.title}" was auto-assigned to you as the property manager.`,
      resourceType: "ServiceRequest",
      resourceId: row.id,
      link: `/service-requests/${row.id}`,
    });
  } else {
    await notify({
      organizationId: row.organizationId,
      branchId: row.branchId,
      excludeUserId: actor.userId,
      type: "service_request.unassigned",
      severity: "info",
      title: "New unassigned service request",
      message: `"${row.title}" has no property manager on file and needs manual assignment.`,
      resourceType: "ServiceRequest",
      resourceId: row.id,
      link: `/service-requests/${row.id}`,
    });
  }

  // Increment SR counter for gated packages
  if (subscription && subscription.package.serviceRequestMonthlyLimit !== null) {
    await prisma.userPackageSubscription.update({
      where: { id: subscription.id },
      data: { srUsedThisMonth: { increment: 1 } },
    });
  }

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
