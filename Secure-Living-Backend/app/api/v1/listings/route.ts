import { randomUUID } from "crypto";
import { prisma } from "@/lib/server/db";
import { createListingSchema } from "@/lib/server/validation";
import { parseBody, requireActor, requirePermission, requireScope , withErrorHandler } from "@/lib/server/http";

export const GET = withErrorHandler(async (req: Request) => {
  const actor = requireActor(req);
  if (actor instanceof Response) return actor;
  const denied = requirePermission(actor, "property:view");
  if (denied) return denied;
  const rows = await prisma.listing.findMany({ orderBy: { createdAt: "desc" } });
  return Response.json({ data: rows });
})

export const POST = withErrorHandler(async (req: Request) => {
  const actor = requireActor(req);
  if (actor instanceof Response) return actor;
  const denied = requirePermission(actor, "lease:create");
  if (denied) return denied;
  const parsed = await parseBody(req, createListingSchema);
  if (!parsed.ok) return parsed.response;
  const body = parsed.data;
  const scoped = requireScope(actor, body.organizationId, body.branchId);
  if (scoped) return scoped;

  const row = await prisma.listing.create({
    data: {
      id: randomUUID(),
      organizationId: body.organizationId,
      branchId: body.branchId,
      propertyId: body.propertyId,
      unitId: body.unitId,
      title: body.title,
      description: body.description,
      rentKes: body.rentKes,
      depositKes: body.depositKes,
      availableFrom: body.availableFrom ? new Date(body.availableFrom) : undefined,
      amenitiesCsv: body.amenities?.join(","),
      photosCsv: body.photos?.join(","),
      contactMethod: body.contactMethod,
      status: "active",
    },
  });
  return Response.json({ data: row }, { status: 201 });
})
