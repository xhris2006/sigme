export type PageResult<T> = { data: T[]; total: number; page: number; totalPages: number };
export type Option = { label: string; value: string };

export type Enterprise = {
  id: string;
  name: string;
  registrationNumber: string;
  legalRepresentative: string;
  email?: string | null;
  phone: string;
  address: string;
  region: string;
  status: "ACTIVE" | "SUSPENDED" | "CLOSED";
  sites?: MiningSite[];
  permits?: Permit[];
  _count?: { sites: number; permits: number };
};

export type MiningSite = {
  id: string;
  name: string;
  region: string;
  locality?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  mineralType: string;
  areaHectares?: number | null;
  status: "ACTIVE" | "INACTIVE" | "UNDER_REVIEW" | "CLOSED";
  enterpriseId: string;
  enterprise?: Enterprise;
  permits?: Permit[];
  inspections?: Inspection[];
  _count?: { permits: number; inspections: number };
};

export type Permit = {
  id: string;
  permitNumber: string;
  type: "EXPLORATION" | "EXPLOITATION" | "ARTISANAL" | "INDUSTRIAL";
  startDate: string;
  endDate: string;
  status: "PENDING" | "ACTIVE" | "EXPIRED" | "REVOKED";
  notes?: string | null;
  enterpriseId: string;
  enterprise?: Enterprise;
  siteId?: string | null;
  site?: MiningSite | null;
};

export type Inspection = {
  id: string;
  siteId: string;
  site?: MiningSite;
  inspectorName: string;
  inspectionDate: string;
  complianceStatus: "COMPLIANT" | "NON_COMPLIANT" | "PENDING_REVIEW";
  findings: string;
  followUpActions?: string | null;
};
