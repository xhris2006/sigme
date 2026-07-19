"use client";

import Link from "next/link";
import { ArrowDownUp, ChevronLeft, ChevronRight, Plus, Search, Trash2 } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { apiFetch, listResource } from "@/lib/api";
import { configs, type Field, type ResourceConfig } from "@/lib/resourceConfig";
import { StatusBadge } from "./StatusBadge";
import { isExpiringSoon } from "@/lib/status";
import type { Option, PageResult } from "@/lib/types";

export function ResourceList<T extends { id: string; status?: string; complianceStatus?: string; endDate?: string }>({ resource }: { resource: string }) {
  const config = configs[resource] as ResourceConfig<T>;
  const [result, setResult] = useState<PageResult<T> | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filters, setFilters] = useState<Record<string, string>>({});
  const [page, setPage] = useState(1);
  const [sortKey, setSortKey] = useState("");
  const [sortAsc, setSortAsc] = useState(true);
  const [options, setOptions] = useState<Record<string, Option[]>>({});

  useEffect(() => {
    config.filters.filter((f) => f.relation).forEach((field) => loadOptions(field, setOptions));
  }, [config.filters]);

  useEffect(() => {
    setLoading(true);
    listResource<T>(resource, { search, page, limit: 8, ...filters })
      .then(setResult)
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [filters, page, resource, search]);

  const rows = useMemo(() => {
    const data = result?.data ?? [];
    if (!sortKey) return data;
    return [...data].sort((a, b) => {
      const av = String((a as Record<string, unknown>)[sortKey] ?? "");
      const bv = String((b as Record<string, unknown>)[sortKey] ?? "");
      return sortAsc ? av.localeCompare(bv) : bv.localeCompare(av);
    });
  }, [result?.data, sortAsc, sortKey]);

  async function remove(id: string) {
    const message = resource === "enterprises"
      ? "Supprimer cette entreprise ? La suppression est bloquee si des sites ou permis y sont rattaches."
      : "Supprimer cet enregistrement ? La suppression est bloquee si des donnees dependantes existent.";
    if (!confirm(message)) return;
    try {
      await apiFetch(`/${resource}/${id}`, { method: "DELETE" });
      setResult((current) => current ? { ...current, data: current.data.filter((item) => item.id !== id), total: current.total - 1 } : current);
    } catch (err) {
      alert(err instanceof Error ? err.message : "Suppression impossible");
    }
  }

  return (
    <section className="space-y-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm font-semibold uppercase tracking-wide text-ministry-gold">Administration</p>
          <h2 className="text-2xl font-bold text-ministry-navy">{config.title}</h2>
        </div>
        <Link href={`/${resource}/new`} className="focus-ring inline-flex items-center justify-center gap-2 rounded-md bg-ministry-gold px-4 py-2.5 text-sm font-bold text-white shadow-sm hover:bg-amber-700">
          <Plus size={18} /> Nouveau
        </Link>
      </div>

      <div className="rounded-md border border-slate-200 bg-white p-4 shadow-panel">
        <div className="grid gap-3 md:grid-cols-4">
          <label className="relative md:col-span-2">
            <Search className="pointer-events-none absolute left-3 top-3 text-slate-400" size={18} />
            <input className="focus-ring w-full rounded-md border border-slate-200 py-2.5 pl-10 pr-3 text-sm" placeholder={config.searchPlaceholder} value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }} />
          </label>
          {config.filters.map((field) => (
            <FilterControl key={field.name} field={field} value={filters[field.name] ?? ""} options={options} onChange={(value) => { setFilters((prev) => ({ ...prev, [field.name]: value })); setPage(1); }} />
          ))}
        </div>
      </div>

      <div className="rounded-md border border-slate-200 bg-white shadow-panel">
        {loading ? <State text="Chargement des donnees..." /> : error ? <State text={error} tone="error" /> : !rows.length ? <State text={config.empty} /> : (
          <>
            <div className="hidden overflow-hidden md:block">
              <table className="w-full border-collapse text-left text-sm">
                <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                  <tr>
                    {config.columns.map((column) => (
                      <th key={column.label} className="px-4 py-3">
                        <button disabled={!column.sortKey} className="flex items-center gap-1 font-bold disabled:cursor-default" onClick={() => {
                          if (!column.sortKey) return;
                          setSortAsc(sortKey === column.sortKey ? !sortAsc : true);
                          setSortKey(column.sortKey);
                        }}>
                          {column.label} {column.sortKey ? <ArrowDownUp size={13} /> : null}
                        </button>
                      </th>
                    ))}
                    <th className="px-4 py-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {rows.map((item) => <TableRow key={item.id} item={item} config={config} resource={resource} remove={remove} />)}
                </tbody>
              </table>
            </div>
            <div className="divide-y divide-slate-100 md:hidden">
              {rows.map((item) => <MobileCard key={item.id} item={item} config={config} resource={resource} remove={remove} />)}
            </div>
          </>
        )}
        {result ? (
          <div className="flex items-center justify-between border-t border-slate-100 px-4 py-3 text-sm text-slate-600">
            <span>{result.total} resultats</span>
            <div className="flex items-center gap-2">
              <button className="focus-ring rounded-md border border-slate-200 p-2 disabled:opacity-40" disabled={page <= 1} onClick={() => setPage((p) => p - 1)} aria-label="Page precedente"><ChevronLeft size={16} /></button>
              <span>Page {page} / {result.totalPages}</span>
              <button className="focus-ring rounded-md border border-slate-200 p-2 disabled:opacity-40" disabled={page >= result.totalPages} onClick={() => setPage((p) => p + 1)} aria-label="Page suivante"><ChevronRight size={16} /></button>
            </div>
          </div>
        ) : null}
      </div>
    </section>
  );
}

function TableRow<T extends { id: string; status?: string; complianceStatus?: string; endDate?: string }>({ item, config, resource, remove }: { item: T; config: ResourceConfig<T>; resource: string; remove: (id: string) => void }) {
  const status = item.status ?? item.complianceStatus;
  return (
    <tr className={item.endDate && status && isExpiringSoon(item.endDate, status) ? "bg-amber-50/60" : ""}>
      {config.columns.map((column) => (
        <td key={column.label} className="px-4 py-3 text-slate-700">
          {column.label.includes("Statut") || column.label.includes("Conformite") ? <StatusBadge value={String(status)} /> : column.render(item)}
        </td>
      ))}
      <td className="px-4 py-3 text-right">
        <Link className="mr-3 font-semibold text-ministry-blue hover:text-ministry-navy" href={`/${resource}/${item.id}`}>Voir</Link>
        <button className="inline-flex text-rose-600 hover:text-rose-800" onClick={() => remove(item.id)} aria-label="Supprimer"><Trash2 size={17} /></button>
      </td>
    </tr>
  );
}

function MobileCard<T extends { id: string; status?: string; complianceStatus?: string }>({ item, config, resource, remove }: { item: T; config: ResourceConfig<T>; resource: string; remove: (id: string) => void }) {
  const status = item.status ?? item.complianceStatus;
  return (
    <article className="p-4">
      <div className="mb-3 flex items-center justify-between gap-3">
        <Link href={`/${resource}/${item.id}`} className="font-bold text-ministry-navy">{config.columns[0].render(item)}</Link>
        {status ? <StatusBadge value={status} /> : null}
      </div>
      <dl className="space-y-2 text-sm">
        {config.columns.slice(1, 4).map((column) => (
          <div key={column.label} className="flex justify-between gap-3">
            <dt className="text-slate-500">{column.label}</dt>
            <dd className="text-right font-medium text-slate-800">{column.render(item)}</dd>
          </div>
        ))}
      </dl>
      <button className="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-rose-600" onClick={() => remove(item.id)}>
        <Trash2 size={16} /> Supprimer
      </button>
    </article>
  );
}

function FilterControl({ field, value, options, onChange }: { field: Field; value: string; options: Record<string, Option[]>; onChange: (value: string) => void }) {
  if (field.type === "select" || field.relation) {
    return (
      <select className="focus-ring rounded-md border border-slate-200 px-3 py-2.5 text-sm" value={value} onChange={(e) => onChange(e.target.value)}>
        <option value="">{field.label}</option>
        {(field.options ?? options[field.relation ?? ""] ?? []).map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
      </select>
    );
  }
  return <input className="focus-ring rounded-md border border-slate-200 px-3 py-2.5 text-sm" placeholder={field.label} type={field.type ?? "text"} value={value} onChange={(e) => onChange(e.target.value)} />;
}

export function loadOptions(field: Field, setter: React.Dispatch<React.SetStateAction<Record<string, Option[]>>>) {
  if (!field.relation) return;
  listResource<any>(field.relation, { page: 1, limit: 100 })
    .then((result) => setter((prev) => ({ ...prev, [field.relation!]: result.data.map((item) => ({ label: item.name, value: item.id })) })))
    .catch(() => undefined);
}

function State({ text, tone }: { text: string; tone?: "error" }) {
  return <div className={`p-8 text-center text-sm ${tone === "error" ? "text-rose-600" : "text-slate-500"}`}>{text}</div>;
}
