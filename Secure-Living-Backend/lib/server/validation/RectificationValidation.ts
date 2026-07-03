import { z } from "zod";

export const initiateRectificationSchema = z.object({
  module: z.enum(["application", "kyc", "dispute", "service_request", "professional", "organization"]),
  resourceId: z.string().min(1),
  reason: z.string().min(10, "Reason must be at least 10 characters"),
  evidence: z.string().min(10, "Evidence must be at least 10 characters").optional(),
  documents: z.array(z.string()).optional(),
});

export const submitRectificationSchema = z.object({
  evidence: z.string().min(10, "Evidence must be at least 10 characters"),
  documents: z.array(z.string()).optional(),
  adminNotes: z.string().optional(),
});

export const completeRectificationSchema = z.object({
  decision: z.enum(["approved", "rejected"]),
  resolutionNotes: z.string().min(1, "Resolution notes are required"),
});

export const appealRectificationSchema = z.object({
  reason: z.string().min(10, "Appeal reason must be at least 10 characters"),
  evidence: z.string().min(10, "Appeal evidence must be at least 10 characters"),
  documents: z.array(z.string()).optional(),
});
