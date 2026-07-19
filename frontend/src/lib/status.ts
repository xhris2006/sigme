export const statusLabels: Record<string, string> = {
  ACTIVE: "Actif",
  SUSPENDED: "Suspendu",
  CLOSED: "Ferme",
  INACTIVE: "Inactif",
  UNDER_REVIEW: "En revue",
  PENDING: "En attente",
  EXPIRED: "Expire",
  REVOKED: "Revoque",
  COMPLIANT: "Conforme",
  NON_COMPLIANT: "Non conforme",
  PENDING_REVIEW: "Revision"
};

export const statusClasses: Record<string, string> = {
  ACTIVE: "bg-emerald-50 text-emerald-700 ring-emerald-200",
  SUSPENDED: "bg-amber-50 text-amber-700 ring-amber-200",
  CLOSED: "bg-slate-100 text-slate-700 ring-slate-200",
  INACTIVE: "bg-slate-100 text-slate-700 ring-slate-200",
  UNDER_REVIEW: "bg-sky-50 text-sky-700 ring-sky-200",
  PENDING: "bg-amber-50 text-amber-700 ring-amber-200",
  EXPIRED: "bg-rose-50 text-rose-700 ring-rose-200",
  REVOKED: "bg-red-50 text-red-700 ring-red-200",
  COMPLIANT: "bg-emerald-50 text-emerald-700 ring-emerald-200",
  NON_COMPLIANT: "bg-rose-50 text-rose-700 ring-rose-200",
  PENDING_REVIEW: "bg-sky-50 text-sky-700 ring-sky-200"
};

export function formatDate(value?: string | Date | null) {
  if (!value) return "-";
  return new Intl.DateTimeFormat("fr-FR", { dateStyle: "medium" }).format(new Date(value));
}

export function isExpiringSoon(endDate: string, status: string) {
  const diff = new Date(endDate).getTime() - Date.now();
  return status === "ACTIVE" && diff >= 0 && diff <= 30 * 24 * 60 * 60 * 1000;
}
