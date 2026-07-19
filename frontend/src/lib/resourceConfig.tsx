"use client";

import type { Enterprise, Inspection, MiningSite, Option, Permit } from "./types";
import { formatDate, isExpiringSoon, statusLabels } from "./status";

export type Field = {
  name: string;
  label: string;
  type?: "text" | "email" | "number" | "date" | "textarea" | "select";
  required?: boolean;
  options?: Option[];
  relation?: "enterprises" | "sites";
};

export type ResourceConfig<T> = {
  key: string;
  title: string;
  singular: string;
  searchPlaceholder: string;
  filters: Field[];
  fields: Field[];
  columns: { label: string; sortKey?: string; render: (item: T) => React.ReactNode }[];
  empty: string;
  detail: { label: string; render: (item: T) => React.ReactNode }[];
};

export const enterpriseStatuses = [
  { label: "Actif", value: "ACTIVE" },
  { label: "Suspendu", value: "SUSPENDED" },
  { label: "Ferme", value: "CLOSED" }
];
export const siteStatuses = [
  { label: "Actif", value: "ACTIVE" },
  { label: "Inactif", value: "INACTIVE" },
  { label: "En revue", value: "UNDER_REVIEW" },
  { label: "Ferme", value: "CLOSED" }
];
export const permitStatuses = [
  { label: "En attente", value: "PENDING" },
  { label: "Actif", value: "ACTIVE" },
  { label: "Expire", value: "EXPIRED" },
  { label: "Revoque", value: "REVOKED" }
];
export const permitTypes = [
  { label: "Exploration", value: "EXPLORATION" },
  { label: "Exploitation", value: "EXPLOITATION" },
  { label: "Artisanal", value: "ARTISANAL" },
  { label: "Industriel", value: "INDUSTRIAL" }
];
export const complianceStatuses = [
  { label: "Conforme", value: "COMPLIANT" },
  { label: "Non conforme", value: "NON_COMPLIANT" },
  { label: "Revision", value: "PENDING_REVIEW" }
];

export const configs: Record<string, ResourceConfig<any>> = {
  enterprises: {
    key: "enterprises",
    title: "Entreprises",
    singular: "entreprise",
    searchPlaceholder: "Nom ou numero d'immatriculation",
    empty: "Aucune entreprise trouvee.",
    filters: [
      { name: "status", label: "Statut", type: "select", options: enterpriseStatuses },
      { name: "region", label: "Region" }
    ],
    fields: [
      { name: "name", label: "Nom", required: true },
      { name: "registrationNumber", label: "Numero d'immatriculation", required: true },
      { name: "legalRepresentative", label: "Representant legal", required: true },
      { name: "email", label: "Email", type: "email" },
      { name: "phone", label: "Telephone", required: true },
      { name: "address", label: "Adresse", required: true },
      { name: "region", label: "Region", required: true },
      { name: "status", label: "Statut", type: "select", options: enterpriseStatuses, required: true }
    ],
    columns: [
      { label: "Nom", sortKey: "name", render: (e: Enterprise) => e.name },
      { label: "Immatriculation", render: (e: Enterprise) => e.registrationNumber },
      { label: "Region", sortKey: "region", render: (e: Enterprise) => e.region },
      { label: "Sites", render: (e: Enterprise) => e._count?.sites ?? e.sites?.length ?? 0 },
      { label: "Statut", sortKey: "status", render: (e: Enterprise) => statusLabels[e.status] }
    ],
    detail: [
      { label: "Representant", render: (e: Enterprise) => e.legalRepresentative },
      { label: "Email", render: (e: Enterprise) => e.email || "-" },
      { label: "Telephone", render: (e: Enterprise) => e.phone },
      { label: "Adresse", render: (e: Enterprise) => e.address },
      { label: "Region", render: (e: Enterprise) => e.region },
      { label: "Sites", render: (e: Enterprise) => e.sites?.map((s) => s.name).join(", ") || "Aucun site" },
      { label: "Permis", render: (e: Enterprise) => e.permits?.map((p) => p.permitNumber).join(", ") || "Aucun permis" }
    ]
  },
  sites: {
    key: "sites",
    title: "Sites miniers",
    singular: "site minier",
    searchPlaceholder: "Nom ou type de mineral",
    empty: "Aucun site minier trouve.",
    filters: [
      { name: "status", label: "Statut", type: "select", options: siteStatuses },
      { name: "region", label: "Region" },
      { name: "mineralType", label: "Mineral" },
      { name: "enterpriseId", label: "Entreprise", type: "select", relation: "enterprises" }
    ],
    fields: [
      { name: "name", label: "Nom", required: true },
      { name: "enterpriseId", label: "Entreprise", type: "select", relation: "enterprises", required: true },
      { name: "region", label: "Region", required: true },
      { name: "locality", label: "Localite" },
      { name: "mineralType", label: "Type de mineral", required: true },
      { name: "areaHectares", label: "Superficie ha", type: "number" },
      { name: "latitude", label: "Latitude", type: "number" },
      { name: "longitude", label: "Longitude", type: "number" },
      { name: "status", label: "Statut", type: "select", options: siteStatuses, required: true }
    ],
    columns: [
      { label: "Nom", sortKey: "name", render: (s: MiningSite) => s.name },
      { label: "Entreprise", render: (s: MiningSite) => s.enterprise?.name ?? "-" },
      { label: "Region", sortKey: "region", render: (s: MiningSite) => s.region },
      { label: "Mineral", sortKey: "mineralType", render: (s: MiningSite) => s.mineralType },
      { label: "Statut", sortKey: "status", render: (s: MiningSite) => statusLabels[s.status] }
    ],
    detail: [
      { label: "Entreprise", render: (s: MiningSite) => s.enterprise?.name ?? "-" },
      { label: "Region", render: (s: MiningSite) => s.region },
      { label: "Localite", render: (s: MiningSite) => s.locality || "-" },
      { label: "Mineral", render: (s: MiningSite) => s.mineralType },
      { label: "Coordonnees", render: (s: MiningSite) => s.latitude && s.longitude ? `${s.latitude}, ${s.longitude}` : "-" },
      { label: "Permis", render: (s: MiningSite) => s.permits?.map((p) => p.permitNumber).join(", ") || "Aucun permis" },
      { label: "Inspections", render: (s: MiningSite) => s.inspections?.map((i) => `${formatDate(i.inspectionDate)} - ${statusLabels[i.complianceStatus]}`).join(", ") || "Aucune inspection" }
    ]
  },
  permits: {
    key: "permits",
    title: "Permis",
    singular: "permis",
    searchPlaceholder: "Numero de permis",
    empty: "Aucun permis trouve.",
    filters: [
      { name: "status", label: "Statut", type: "select", options: permitStatuses },
      { name: "type", label: "Type", type: "select", options: permitTypes },
      { name: "enterpriseId", label: "Entreprise", type: "select", relation: "enterprises" }
    ],
    fields: [
      { name: "permitNumber", label: "Numero de permis", required: true },
      { name: "enterpriseId", label: "Entreprise", type: "select", relation: "enterprises", required: true },
      { name: "siteId", label: "Site", type: "select", relation: "sites" },
      { name: "type", label: "Type", type: "select", options: permitTypes, required: true },
      { name: "startDate", label: "Date de debut", type: "date", required: true },
      { name: "endDate", label: "Date de fin", type: "date", required: true },
      { name: "status", label: "Statut manuel", type: "select", options: permitStatuses, required: true },
      { name: "notes", label: "Notes", type: "textarea" }
    ],
    columns: [
      { label: "Numero", sortKey: "permitNumber", render: (p: Permit) => p.permitNumber },
      { label: "Entreprise", render: (p: Permit) => p.enterprise?.name ?? "-" },
      { label: "Type", sortKey: "type", render: (p: Permit) => p.type },
      { label: "Expiration", sortKey: "endDate", render: (p: Permit) => `${formatDate(p.endDate)}${isExpiringSoon(p.endDate, p.status) ? " | a renouveler" : ""}` },
      { label: "Statut", sortKey: "status", render: (p: Permit) => statusLabels[p.status] }
    ],
    detail: [
      { label: "Entreprise", render: (p: Permit) => p.enterprise?.name ?? "-" },
      { label: "Site", render: (p: Permit) => p.site?.name ?? "Non specifie" },
      { label: "Type", render: (p: Permit) => p.type },
      { label: "Periode", render: (p: Permit) => `${formatDate(p.startDate)} au ${formatDate(p.endDate)}` },
      { label: "Notes", render: (p: Permit) => p.notes || "-" }
    ]
  },
  inspections: {
    key: "inspections",
    title: "Inspections",
    singular: "inspection",
    searchPlaceholder: "Inspecteur",
    empty: "Aucune inspection trouvee.",
    filters: [
      { name: "siteId", label: "Site", type: "select", relation: "sites" },
      { name: "complianceStatus", label: "Conformite", type: "select", options: complianceStatuses },
      { name: "from", label: "Debut", type: "date" },
      { name: "to", label: "Fin", type: "date" }
    ],
    fields: [
      { name: "siteId", label: "Site", type: "select", relation: "sites", required: true },
      { name: "inspectorName", label: "Inspecteur", required: true },
      { name: "inspectionDate", label: "Date", type: "date", required: true },
      { name: "complianceStatus", label: "Conformite", type: "select", options: complianceStatuses, required: true },
      { name: "findings", label: "Constats", type: "textarea", required: true },
      { name: "followUpActions", label: "Actions de suivi", type: "textarea" }
    ],
    columns: [
      { label: "Site", render: (i: Inspection) => i.site?.name ?? "-" },
      { label: "Inspecteur", sortKey: "inspectorName", render: (i: Inspection) => i.inspectorName },
      { label: "Date", sortKey: "inspectionDate", render: (i: Inspection) => formatDate(i.inspectionDate) },
      { label: "Conformite", sortKey: "complianceStatus", render: (i: Inspection) => statusLabels[i.complianceStatus] }
    ],
    detail: [
      { label: "Site", render: (i: Inspection) => i.site?.name ?? "-" },
      { label: "Entreprise", render: (i: Inspection) => i.site?.enterprise?.name ?? "-" },
      { label: "Inspecteur", render: (i: Inspection) => i.inspectorName },
      { label: "Date", render: (i: Inspection) => formatDate(i.inspectionDate) },
      { label: "Constats", render: (i: Inspection) => i.findings },
      { label: "Actions de suivi", render: (i: Inspection) => i.followUpActions || "-" }
    ]
  }
};
