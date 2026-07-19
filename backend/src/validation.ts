import { z } from "zod";

const optionalEmail = z.string().email().optional().or(z.literal(""));
const optionalText = z.string().trim().optional().or(z.literal(""));
const dateString = z.coerce.date();
const numberish = z.coerce.number().optional().nullable();

export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6)
});

export const enterpriseSchema = z.object({
  name: z.string().trim().min(2),
  registrationNumber: z.string().trim().min(2),
  legalRepresentative: z.string().trim().min(2),
  email: optionalEmail,
  phone: z.string().trim().min(5),
  address: z.string().trim().min(2),
  region: z.string().trim().min(2),
  status: z.enum(["ACTIVE", "SUSPENDED", "CLOSED"]).default("ACTIVE")
});

export const siteSchema = z.object({
  name: z.string().trim().min(2),
  region: z.string().trim().min(2),
  locality: optionalText,
  latitude: numberish,
  longitude: numberish,
  mineralType: z.string().trim().min(2),
  areaHectares: numberish,
  status: z.enum(["ACTIVE", "INACTIVE", "UNDER_REVIEW", "CLOSED"]).default("ACTIVE"),
  enterpriseId: z.string().min(1)
});

export const permitSchema = z.object({
  permitNumber: z.string().trim().min(2),
  type: z.enum(["EXPLORATION", "EXPLOITATION", "ARTISANAL", "INDUSTRIAL"]),
  startDate: dateString,
  endDate: dateString,
  status: z.enum(["PENDING", "ACTIVE", "EXPIRED", "REVOKED"]).default("PENDING"),
  notes: optionalText,
  enterpriseId: z.string().min(1),
  siteId: z.string().optional().nullable().or(z.literal(""))
}).refine((data) => data.endDate >= data.startDate, {
  path: ["endDate"],
  message: "End date must be after start date"
});

export const inspectionSchema = z.object({
  siteId: z.string().min(1),
  inspectorName: z.string().trim().min(2),
  inspectionDate: dateString,
  complianceStatus: z.enum(["COMPLIANT", "NON_COMPLIANT", "PENDING_REVIEW"]),
  findings: z.string().trim().min(3),
  followUpActions: optionalText
});
