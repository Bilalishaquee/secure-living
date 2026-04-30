import { randomUUID } from "crypto";
import { prisma } from "@/lib/server/db";
import { hashPassword } from "@/lib/server/password";
import { createAuthToken } from "@/lib/server/token";
import { buildUserAccess } from "@/lib/server/identity";
import { jsonError , withErrorHandler } from "@/lib/server/http";

export const POST = withErrorHandler(async (req: Request) => {
  const body = (await req.json()) as {
    email?: string;
    password?: string;
    fullName?: string;
    orgName?: string;
    orgCode?: string;
  };
  if (!body.email || !body.password || !body.fullName) return jsonError(400, "Missing required fields");
  if (body.password.length < 8) return jsonError(400, "Password must be at least 8 characters");

  const existing = await prisma.appUser.findUnique({ where: { email: body.email.toLowerCase() } });
  if (existing) return jsonError(409, "Email already registered");

  let orgId: string;
  let branchId: string;

  if (body.orgName?.trim()) {
    const slug = body.orgName.trim().toLowerCase().replace(/[^a-z0-9]+/g, "");
    const newOrg = await prisma.organization.create({
      data: {
        id: randomUUID(),
        name: body.orgName.trim(),
        type: "Independent Manager",
        country: "Kenya",
        email: `${slug}@secureliving.app`,
      },
    });
    const newBranch = await prisma.branch.create({
      data: { id: randomUUID(), organizationId: newOrg.id, name: "Main Office", location: body.orgName.trim() },
    });
    orgId = newOrg.id;
    branchId = newBranch.id;
  } else if (body.orgCode?.trim()) {
    const org = await prisma.organization.findFirst({ where: { id: body.orgCode.trim() } });
    if (!org) return jsonError(400, "Organization not found. Check the code and try again.");
    const branch = await prisma.branch.findFirst({ where: { organizationId: org.id }, orderBy: { createdAt: "asc" } });
    if (!branch) return jsonError(400, "Organization has no branches configured.");
    orgId = org.id;
    branchId = branch.id;
  } else {
    const fallbackOrg = await prisma.organization.findFirst({ orderBy: { createdAt: "asc" } });
    if (!fallbackOrg) return jsonError(400, "Please provide an organization name to create your account.");
    const fallbackBranch = await prisma.branch.findFirst({ where: { organizationId: fallbackOrg.id }, orderBy: { createdAt: "asc" } });
    if (!fallbackBranch) return jsonError(400, "Organization has no branches configured.");
    orgId = fallbackOrg.id;
    branchId = fallbackBranch.id;
  }

  const user = await prisma.appUser.create({
    data: {
      id: randomUUID(),
      email: body.email.toLowerCase(),
      fullName: body.fullName,
      passwordHash: hashPassword(body.password),
    },
  });

  const landlordRole = await prisma.role.findUnique({ where: { slug: "landlord" } });
  if (landlordRole) {
    await prisma.userRoleAssignment.create({
      data: {
        id: randomUUID(),
        userId: user.id,
        roleId: landlordRole.id,
        organizationId: orgId,
        branchId: branchId,
      },
    });
  }

  const access = await buildUserAccess(user.id);
  const token = createAuthToken({
    userId: user.id,
    email: user.email,
    role: access.role,
    permissions: access.permissions,
    branchIds: access.branchIds,
    orgIds: access.orgIds,
    exp: Date.now() + 1000 * 60 * 60 * 24 * 7,
  });
  await prisma.apiSession.create({
    data: {
      token,
      userId: user.id,
      expiresAt: new Date(Date.now() + 1000 * 60 * 60 * 24 * 7),
    },
  });

  return Response.json({
    data: {
      token,
      user: {
        id: user.id,
        email: user.email,
        name: user.fullName,
        role: access.role,
        permissions: access.permissions,
        organizationId: access.orgIds[0] ?? null,
        branchId: access.branchIds[0] ?? null,
      },
    },
  }, { status: 201 });
})
