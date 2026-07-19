import type { Permit, PermitStatus } from "@prisma/client";

export function computePermitStatus(permit: Pick<Permit, "status" | "startDate" | "endDate">): PermitStatus {
  if (permit.status === "REVOKED") return "REVOKED";
  const now = new Date();
  if (now < permit.startDate) return "PENDING";
  if (now > permit.endDate) return "EXPIRED";
  return "ACTIVE";
}

export function withComputedPermitStatus<T extends Pick<Permit, "status" | "startDate" | "endDate">>(permit: T) {
  return { ...permit, status: computePermitStatus(permit) };
}
