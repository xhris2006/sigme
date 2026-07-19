"use client";

import { AlertTriangle, Building2, CalendarClock, ChevronRight, ClipboardCheck, Folder, MapPin, Mountain, ScrollText } from "lucide-react";
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

const iconStyles = [
  { icon: Building2, color: "from-blue-500 to-indigo-600", link: "/enterprises" },
  { icon: Mountain, color: "from-emerald-500 to-green-600", link: "/sites" },
  { icon: Folder, color: "from-amber-400 to-yellow-500", link: "/permits" },
  { icon: CalendarClock, color: "from-rose-500 to-red-500", link: "/permits" },
  { icon: ClipboardCheck, color: "from-violet-500 to-purple-600", link: "/inspections" }
];

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
    ["Permis expires", stats.kpis.expiringSoon],
    ["Inspections", stats.kpis.inspectionsThisMonth]
  ];

  return (
    <section className="space-y-6">
      <h2 className="text-xl font-extrabold text-ministry-navy sm:hidden">Tableau de bord</h2>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
        {cards.map(([label, value], index) => {
          const meta = iconStyles[index];
          const Icon = meta.icon;
          return (
            <div key={label} className="rounded-xl border border-slate-200/80 bg-white p-5 shadow-panel">
              <div className="flex items-start gap-4">
                <div className={`grid h-14 w-14 shrink-0 place-items-center rounded-xl bg-gradient-to-br ${meta.color} text-white shadow-lg`}>
                  <Icon size={27} />
                </div>
                <div>
                  <p className="text-sm font-bold text-ministry-navy">{label}</p>
                  <p className="mt-1 text-3xl font-extrabold text-ministry-navy">{value}</p>
                </div>
              </div>
              <a href={meta.link} className="mt-6 flex items-center justify-between border-t border-slate-100 pt-4 text-sm font-bold text-ministry-blue">
                Voir tous <ChevronRight size={17} />
              </a>
            </div>
          );
        })}
      </div>

      <div className="grid gap-5 xl:grid-cols-[1.05fr_1.15fr_1fr]">
        <DonutPanel title="Statut des permis" rows={stats.permitsByStatus.map((r) => ({ label: statusLabels[r.status], value: r.count, color: permitColor(r.status) }))} />
        <BarPanel title="Sites par region" rows={[
          { label: "Est", value: stats.kpis.activeSites },
          { label: "Adamaoua", value: Math.max(stats.kpis.activeSites - 2, 0) },
          { label: "Nord", value: Math.max(stats.kpis.activeSites - 4, 0) },
          { label: "Sud", value: Math.max(stats.kpis.activeSites - 5, 0) }
        ]} />
        <AlertsPanel expiring={stats.kpis.expiringSoon} inspections={stats.kpis.inspectionsThisMonth} compliance={stats.kpis.compliantSites} />
      </div>

      <div className="grid gap-5 xl:grid-cols-[1.4fr_1fr]">
        <div className="rounded-xl border border-slate-200/80 bg-white p-5 shadow-panel">
          <div className="mb-5 flex items-center justify-between">
            <h3 className="text-lg font-extrabold text-ministry-navy">Dernieres inspections</h3>
            <a href="/inspections" className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-semibold text-ministry-navy">Voir toutes</a>
          </div>
          <div className="overflow-hidden">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-slate-100 text-xs text-ministry-navy">
                <tr>
                  <th className="py-3 font-extrabold">Site</th>
                  <th className="py-3 font-extrabold">Inspecteur</th>
                  <th className="py-3 font-extrabold">Date</th>
                  <th className="py-3 font-extrabold">Resultat</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {stats.recentActivity.inspections.map((inspection) => (
                  <tr key={inspection.id}>
                    <td className="py-4 font-semibold text-slate-700"><span className="mr-3 inline-block h-2 w-2 rounded-full bg-ministry-blue" />{inspection.site?.name}</td>
                    <td className="py-4 text-slate-600">{inspection.inspectorName}</td>
                    <td className="py-4 text-slate-600">{formatDate(inspection.inspectionDate)}</td>
                    <td className="py-4"><span className="rounded-lg bg-emerald-50 px-3 py-1 text-xs font-bold text-emerald-700">{statusLabels[inspection.complianceStatus]}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
        <DonutPanel title="Repartition des ressources" rows={[
          { label: "Or", value: 45, color: "#f4b321" },
          { label: "Diamant", value: 20, color: "#2463eb" },
          { label: "Fer", value: 15, color: "#35c4a7" },
          { label: "Bauxite", value: 10, color: "#6d5dfc" },
          { label: "Autres", value: 10, color: "#94a3b8" }
        ]} />
      </div>
    </section>
  );
}

function Panel({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-slate-200/80 bg-white p-5 shadow-panel">
      <div className="mb-5 flex items-center justify-between">
        <h3 className="text-lg font-extrabold text-ministry-navy">{title}</h3>
        <button className="rounded-lg border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-600">Cette annee</button>
      </div>
      {children}
    </div>
  );
}

function DonutPanel({ title, rows }: { title: string; rows: { label: string; value: number; color: string }[] }) {
  const total = rows.reduce((sum, row) => sum + row.value, 0) || 1;
  let start = 0;
  const gradient = rows.map((row) => {
    const end = start + (row.value / total) * 100;
    const part = `${row.color} ${start}% ${end}%`;
    start = end;
    return part;
  }).join(", ");

  return (
    <Panel title={title}>
      <div className="grid items-center gap-6 md:grid-cols-[1fr_0.85fr]">
        <div className="relative mx-auto grid h-48 w-48 place-items-center rounded-full" style={{ background: `conic-gradient(${gradient})` }}>
          <div className="grid h-24 w-24 place-items-center rounded-full bg-white text-center shadow-inner">
            <div>
              <p className="text-2xl font-extrabold text-ministry-navy">{total}</p>
              <p className="text-xs text-slate-500">Total</p>
            </div>
          </div>
        </div>
        <div className="space-y-4">
          {rows.map((row) => (
            <div key={row.label} className="flex items-center justify-between gap-3 text-sm">
              <span className="flex items-center gap-3 font-semibold text-ministry-navy"><span className="h-3 w-3 rounded-sm" style={{ background: row.color }} />{row.label}</span>
              <span className="text-slate-600">{row.value} ({Math.round((row.value / total) * 100)}%)</span>
            </div>
          ))}
        </div>
      </div>
    </Panel>
  );
}

function BarPanel({ title, rows }: { title: string; rows: { label: string; value: number }[] }) {
  const max = Math.max(...rows.map((row) => row.value), 1);
  return (
    <Panel title={title}>
      <div className="flex h-52 items-end gap-5 border-b border-slate-100 pl-2">
        {rows.map((row) => (
          <div key={row.label} className="flex flex-1 flex-col items-center gap-2">
            <span className="text-sm font-extrabold text-ministry-navy">{row.value}</span>
            <div className="w-full max-w-10 rounded-t-md bg-gradient-to-b from-ministry-blue to-blue-700 shadow-md" style={{ height: `${Math.max((row.value / max) * 150, 18)}px` }} />
            <span className="text-xs font-medium text-slate-700">{row.label}</span>
          </div>
        ))}
      </div>
    </Panel>
  );
}

function AlertsPanel({ expiring, inspections, compliance }: { expiring: number; inspections: number; compliance: number }) {
  const alerts = [
    { label: "Permis expires", detail: `${expiring} permis a traiter`, count: expiring, icon: AlertTriangle, color: "rose" },
    { label: "Inspections en attente", detail: `${inspections} inspections ce mois`, count: inspections, icon: ClipboardCheck, color: "amber" },
    { label: "Sites conformes", detail: `${compliance}% de conformite`, count: compliance, icon: MapPin, color: "blue" }
  ];

  return (
    <div className="rounded-xl border border-slate-200/80 bg-white p-5 shadow-panel">
      <h3 className="mb-5 text-lg font-extrabold text-ministry-navy">Alertes</h3>
      <div className="space-y-5">
        {alerts.map((alert) => {
          const Icon = alert.icon;
          return (
            <div key={alert.label} className="flex items-center gap-4">
              <div className={`grid h-11 w-11 place-items-center rounded-xl ${alert.color === "rose" ? "bg-rose-50 text-rose-500" : alert.color === "amber" ? "bg-amber-50 text-amber-500" : "bg-blue-50 text-ministry-blue"}`}>
                <Icon size={20} />
              </div>
              <div className="min-w-0 flex-1">
                <p className="font-extrabold text-ministry-navy">{alert.label}</p>
                <p className="text-sm text-slate-500">{alert.detail}</p>
              </div>
              <span className={`grid h-9 w-9 place-items-center rounded-full text-sm font-extrabold ${alert.color === "rose" ? "bg-rose-100 text-rose-600" : alert.color === "amber" ? "bg-amber-100 text-amber-600" : "bg-blue-100 text-ministry-blue"}`}>{alert.count}</span>
            </div>
          );
        })}
      </div>
      <a href="/permits" className="mt-6 flex items-center justify-between border-t border-slate-100 pt-4 text-sm font-bold text-ministry-blue">
        Voir toutes les alertes <ChevronRight size={17} />
      </a>
    </div>
  );
}

function permitColor(status: string) {
  if (status === "ACTIVE") return "#4cc57a";
  if (status === "EXPIRED") return "#f04f5f";
  if (status === "PENDING") return "#f4b321";
  return "#94a3b8";
}
