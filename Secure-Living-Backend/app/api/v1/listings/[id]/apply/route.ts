import { z } from "zod";
import { prisma } from "@/lib/server/db";
import { parseBody, withErrorHandler, jsonError } from "@/lib/server/http";
import { actorFromAuthorizationHeader } from "@/lib/server/authz";

type Ctx = { params: { id: string } };

const applySchema = z.object({ message: z.string().optional() });

export const POST = withErrorHandler(async (req: Request, { params }: Ctx) => {
  const listing = await prisma.listing.findUnique({ where: { id: params.id } });
  if (!listing) return jsonError(404, "Listing not found");
  if (listing.status !== "PUBLISHED") return jsonError(400, "Listing is not published");

  const actor = actorFromAuthorizationHeader(req.headers.get("authorization"));
  const applicantId = actor?.userId ?? "anonymous";

  const parsed = await parseBody(req, applySchema);
  if (!parsed.ok) return parsed.response;

  const application = await prisma.rentalApplication.create({
    data: {
      listingId: params.id,
      applicantId,
      message: parsed.data.message,
      status: "PENDING",
    },
  });

  return Response.json({ data: application }, { status: 201 });
});
