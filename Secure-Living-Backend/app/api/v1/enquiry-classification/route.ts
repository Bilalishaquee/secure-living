import { z } from "zod";
import { prisma } from "@/lib/server/db";
import { parseBody, withErrorHandler } from "@/lib/server/http";

const schema = z.object({
  name: z.string().min(1),
  email: z.string().email(),
  phone: z.string().optional(),
  message: z.string().min(3),
  serviceCategoryId: z.string().optional(),
});

function classify(message: string) {
  const text = message.toLowerCase();
  if (/(cannot log|can't log|password|payment failed|not opening|verification|bug|account)/.test(text)) {
    return { route: "support_ticket", leadType: null, priority: "NORMAL" };
  }
  if (/(corporate housing|employee housing|bulk listing|10\+|company housing)/.test(text)) {
    return { route: "crm_lead", leadType: "Corporate Housing", priority: "HIGH" };
  }
  if (/(property management|manage my|landlord|units|apartment block)/.test(text)) {
    return { route: "crm_lead", leadType: "Landlord", priority: "NORMAL" };
  }
  if (/(looking for|2br|1br|bedsitter|westlands|kilimani|budget|find a home)/.test(text)) {
    return { route: "crm_lead", leadType: "Tenant Property Search", priority: "NORMAL" };
  }
  if (/(plumbing|cleaning|security|electrical|legal|interior|repair|maintenance)/.test(text)) {
    return { route: "service_enquiry", leadType: null, priority: "NORMAL" };
  }
  if (/(demo|partnership|contact|information|info|inquiry|enquiry)/.test(text)) {
    return { route: "contact_request", leadType: null, priority: "NORMAL" };
  }
  return { route: "contact_request", leadType: null, priority: "NORMAL" };
}

function ticketNumber(prefix: string) {
  return `${prefix}-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).slice(2, 6).toUpperCase()}`;
}

function crmPipeline(leadType: string | null) {
  if (leadType === "Corporate Housing") return "Sales";
  if (leadType === "Landlord") return "Property Management Sales";
  if (leadType === "Tenant Property Search") return "Tenant Leasing";
  return "General Sales";
}

function extractTenantRequirement(message: string) {
  const budgetMatch = message.match(/(?:budget|kes|ksh)\s*[:\-]?\s*([0-9,]+)/i);
  const locationMatch = message.match(/\b(?:in|around|near)\s+([a-zA-Z\s]+?)(?:[,.]|$)/i);
  const requirementMatch = message.match(/\b(1br|2br|3br|4br|bedsitter|studio|one bedroom|two bedroom|three bedroom)\b/i);
  return {
    budget: budgetMatch?.[1]?.replace(/,/g, "") ?? null,
    preferredLocation: locationMatch?.[1]?.trim() ?? null,
    propertyRequirement: requirementMatch?.[1] ?? null,
  };
}

export const POST = withErrorHandler(async (req: Request) => {
  const parsed = await parseBody(req, schema);
  if (!parsed.ok) return parsed.response;

  const decision = classify(parsed.data.message);

  if (decision.route === "service_enquiry") {
    const category = parsed.data.serviceCategoryId
      ? await prisma.serviceCategory.findUnique({ where: { id: parsed.data.serviceCategoryId } })
      : await prisma.serviceCategory.findFirst({ orderBy: { createdAt: "asc" } });
    if (category) {
      const row = await prisma.serviceEnquiry.create({
        data: {
          serviceCategoryId: category.id,
          name: parsed.data.name,
          email: parsed.data.email,
          phone: parsed.data.phone,
          message: parsed.data.message,
          status: "RECEIVED",
        },
      });
      return Response.json({ data: { route: decision.route, id: row.id } }, { status: 201 });
    }
  }

  if (decision.route === "support_ticket") {
    const row = await prisma.supportTicket.create({
      data: {
        ticketNumber: ticketNumber("SUP"),
        name: parsed.data.name,
        email: parsed.data.email,
        phone: parsed.data.phone,
        category: "Platform Support",
        priority: decision.priority,
        message: parsed.data.message,
      },
    });
    return Response.json({ data: { route: decision.route, id: row.id, ticketNumber: row.ticketNumber } }, { status: 201 });
  }

  if (decision.route === "crm_lead") {
    const tenantFields = decision.leadType === "Tenant Property Search" ? extractTenantRequirement(parsed.data.message) : {};
    const row = await prisma.crmLead.create({
      data: {
        leadNumber: ticketNumber("CRM"),
        name: parsed.data.name,
        email: parsed.data.email,
        phone: parsed.data.phone,
        message: parsed.data.message,
        leadType: decision.leadType ?? "General",
        priority: decision.priority,
        pipeline: crmPipeline(decision.leadType),
        ...tenantFields,
      },
    });
    return Response.json({ data: { route: decision.route, id: row.id, leadNumber: row.leadNumber, leadType: row.leadType } }, { status: 201 });
  }

  if (decision.route === "contact_request") {
    const row = await prisma.contactRequest.create({
      data: {
        contactNumber: ticketNumber("CON"),
        name: parsed.data.name,
        email: parsed.data.email,
        phone: parsed.data.phone,
        message: parsed.data.message,
        source: "website",
      },
    });
    return Response.json({ data: { route: decision.route, id: row.id, contactNumber: row.contactNumber } }, { status: 201 });
  }

  return Response.json({
    data: {
      route: decision.route,
      leadType: decision.leadType,
      priority: decision.priority,
      captured: {
        name: parsed.data.name,
        email: parsed.data.email,
        phone: parsed.data.phone ?? null,
        message: parsed.data.message,
      },
    },
  }, { status: 202 });
});
