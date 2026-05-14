import { z } from "zod";
import { prisma } from "@/lib/server/db";
import { parseBody, requireActor, requirePermission, withErrorHandler } from "@/lib/server/http";
import { actorFromAuthorizationHeader } from "@/lib/server/authz";

const createEnquirySchema = z.object({
  serviceCategoryId: z.string().min(1),
  name: z.string().min(1),
  email: z.string().email(),
  phone: z.string().optional(),
  message: z.string().min(1),
});

export const GET = withErrorHandler(async (req: Request) => {
  const actor = requireActor(req);
  if (actor instanceof Response) return actor;
  const denied = requirePermission(actor, "service-enquiry:view");
  if (denied) return denied;

  const url = new URL(req.url);
  const serviceCategoryId = url.searchParams.get("serviceCategoryId");
  const status = url.searchParams.get("status");

  const rows = await prisma.serviceEnquiry.findMany({
    where: {
      ...(serviceCategoryId && { serviceCategoryId }),
      ...(status && { status: status as never }),
    },
    include: { serviceCategory: { select: { name: true, slug: true } } },
    orderBy: { createdAt: "desc" },
  });

  return Response.json({ data: rows });
});

export const POST = withErrorHandler(async (req: Request) => {
  // Public — no auth required, but capture user if logged in
  const actor = actorFromAuthorizationHeader(req.headers.get("authorization"));

  const parsed = await parseBody(req, createEnquirySchema);
  if (!parsed.ok) return parsed.response;

  const row = await prisma.serviceEnquiry.create({
    data: {
      serviceCategoryId: parsed.data.serviceCategoryId,
      userId: actor?.userId,
      organizationId: actor?.orgIds?.[0],
      name: parsed.data.name,
      email: parsed.data.email,
      phone: parsed.data.phone,
      message: parsed.data.message,
      status: "NEW",
    },
  });

  return Response.json({ data: row }, { status: 201 });
});
