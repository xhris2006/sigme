"use client";

import { AlertTriangle, Building2, ClipboardCheck, MapPin, ScrollText, TrendingUp } from "lucide-react";
import { useEffect, useState } from "react";
import { apiFetch } from "@/lib/api";
import { formatDate, statusLabels } from "@/lib/status";

type Stats = {
  kpis: { enterprises: number; activeSites: number; activePermits: number; expiringSoon: number; inspectionsThisMonth: number; compliantSites: number };
  permitsByStatus: { status: string; count: number }[];
  inspectionsByCompliance: { status: string; count: number }[];
  inspectionsTrend: { month: string; count: number }[];
  recentActivity: { inspections: any[]; permits: any[] };
};

const icons = [Building2, MapPin, ScrollText, AlertTriangle, ClipboardCheck, TrendingUp];

export function Dashboard() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    apiFetch<Stats>("/dashboard/stats").then(setStats).catch((err) => setError(err.message));
  }, []);

  if (error) return <div className="rounded-md border border-rose-200 bg-rose-50 p-6 text-sm font-semibold text-rose-700">{error}</div>;
  if (!stats) return <div className="rounded-md border border-slate-200 bg-white p-8 text-center text-sm text-slate-500 shadow-panel">Chargement du tableau de bord...</div>;

  const cards = [
    ["Entreprises", stats.kpis.enterprises],
    ["Sites actifs", stats.kpis.activeSites],
    ["Permis actifs", stats.kpis.activePermits],
    ["Permis a 30 jours", stats.kpis.expiringSoon],
    ["Inspections du mois", stats.kpis.inspectionsThisMonth],
    ["Sites conformes", `${stats.kpis.compliantSites}%`]
  ];

  return (
    <section className="space-y-6">
      <div>
        <p className="text-sm font-semibold uppercase tracking-wide text-ministry-gold">Vue ministerielle</p>
        <h2 className="text-2xl font-bold text-ministry-navy">Tableau de bord</h2>
      </div>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {cards.map(([label, value], index) => {
          const Icon = icons[index];
          return (
            <div key={label} className="rounded-md border border-slate-200 bg-white p-5 shadow-panel">
              <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-md bg-ministry-navy text-ministry-gold"><Icon size={21} /></div>
              <p className="text-sm font-semibold text-slate-500">{label}</p>
              <p className="mt-1 text-3xl font-bold text-ministry-navy">{value}</p>
            </div>
          );
        })}
      </div>
      <div className="grid gap-5 lg:grid-cols-2">
        <Chart title="Permis par statut" rows={stats.permitsByStatus.map((r) => ({ label: statusLabels[r.status], value: r.count }))} />
        <Chart title="Conformite des inspections" rows={stats.inspectionsByCompliance.map((r) => ({ label: statusLabels[r.status], value: r.count }))} />
      </div>
      <div className="grid gap-5 lg:grid-cols-2">
        <Chart title="Inspections sur 6 mois" rows={stats.inspectionsTrend.map((r) => ({ label: r.month, value: r.count }))} />
        <div className="rounded-md border border-slate-200 bg-white p-5 shadow-panel">
          <h3 className="mb-4 text-lg font-bold text-ministry-navy">Activite recente</h3>
          <div className="space-y-4">
            {stats.recentActivity.inspections.map((inspection) => (
              <div key={inspection.id} className="border-l-4 border-ministry-gold pl-3">
                <p className="text-sm font-bold text-slate-800">{inspection.site?.name} inspecte</p>
                <p className="text-xs text-slate-500">{inspection.inspectorName} | {formatDate(inspection.inspectionDate)}</p>
              </div>
            ))}
            {stats.recentActivity.permits.map((permit) => (
              <div key={permit.id} className="border-l-4 border-ministry-blue pl-3">
                <p className="text-sm font-bold text-slate-800">{permit.permitNumber}</p>
                <p className="text-xs text-slate-500">{permit.enterprise?.name} | {statusLabels[permit.status]}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

function Chart({ title, rows }: { title: string; rows: { label: string; value: number }[] }) {
  const max = Math.max(...rows.map((row) => row.value), 1);
  return (
    <div className="rounded-md border border-slate-200 bg-white p-5 shadow-panel">
      <h3 className="mb-4 text-lg font-bold text-ministry-navy">{title}</h3>
      <div className="space-y-3">
        {rows.map((row) => (
          <div key={row.label}>
            <div className="mb-1 flex justify-between text-sm">
              <span className="font-semibold text-slate-700">{row.label}</span>
              <span className="text-slate-500">{row.value}</span>
            </div>
            <div className="h-2 rounded-full bg-slate-100">
              <div className="h-2 rounded-full bg-ministry-gold" style={{ width: `${Math.max((row.value / max) * 100, row.value ? 8 : 0)}%` }} />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
