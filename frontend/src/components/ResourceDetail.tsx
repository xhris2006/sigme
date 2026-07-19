"use client";

import Link from "next/link";
import { Edit, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { apiFetch } from "@/lib/api";
import { configs, type ResourceConfig } from "@/lib/resourceConfig";
import { StatusBadge } from "./StatusBadge";

export function ResourceDetail({ resource, id }: { resource: string; id: string }) {
  const router = useRouter();
  const config = configs[resource] as ResourceConfig<Record<string, any>>;
  const [item, setItem] = useState<Record<string, any> | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    apiFetch<Record<string, any>>(`/${resource}/${id}`)
      .then(setItem)
      .catch((err) => setError(err.message));
  }, [id, resource]);

  async function remove() {
    const message = resource === "enterprises"
      ? "Supprimer cette entreprise ? La suppression est bloquee si des sites ou permis y sont rattaches."
      : "Supprimer cet enregistrement ?";
    if (!confirm(message)) return;
    try {
      await apiFetch(`/${resource}/${id}`, { method: "DELETE" });
      router.push(`/${resource}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Suppression impossible");
    }
  }

  if (error) return <div className="rounded-md border border-rose-200 bg-rose-50 p-6 text-sm font-semibold text-rose-700">{error}</div>;
  if (!item) return <div className="rounded-md border border-slate-200 bg-white p-8 text-center text-sm text-slate-500 shadow-panel">Chargement du detail...</div>;

  const title = item.name ?? item.permitNumber ?? `${config.singular} ${item.id}`;
  const status = item.status ?? item.complianceStatus;

  return (
    <section className="space-y-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-sm font-semibold uppercase tracking-wide text-ministry-gold">{config.singular}</p>
          <div className="flex flex-wrap items-center gap-3">
            <h2 className="text-2xl font-bold text-ministry-navy">{title}</h2>
            {status ? <StatusBadge value={status} /> : null}
          </div>
        </div>
        <div className="flex gap-2">
          <Link href={`/${resource}/${id}?edit=1`} className="focus-ring inline-flex items-center gap-2 rounded-md border border-slate-200 bg-white px-4 py-2.5 text-sm font-bold text-slate-700 hover:bg-slate-50">
            <Edit size={17} /> Modifier
          </Link>
          <button onClick={remove} className="focus-ring inline-flex items-center gap-2 rounded-md bg-rose-600 px-4 py-2.5 text-sm font-bold text-white hover:bg-rose-700">
            <Trash2 size={17} /> Supprimer
          </button>
        </div>
      </div>
      <div className="rounded-md border border-slate-200 bg-white p-5 shadow-panel">
        <dl className="grid gap-4 md:grid-cols-2">
          {config.detail.map((detail) => (
            <div key={detail.label} className="rounded-md bg-slate-50 p-4">
              <dt className="mb-1 text-xs font-bold uppercase tracking-wide text-slate-500">{detail.label}</dt>
              <dd className="text-sm font-medium leading-6 text-slate-800">{detail.render(item)}</dd>
            </div>
          ))}
        </dl>
      </div>
    </section>
  );
}
