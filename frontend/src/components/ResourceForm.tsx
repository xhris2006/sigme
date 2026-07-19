"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { Save } from "lucide-react";
import { useEffect, useState } from "react";
import { apiFetch } from "@/lib/api";
import { configs, type Field, type ResourceConfig } from "@/lib/resourceConfig";
import { loadOptions } from "./ResourceList";
import type { Option } from "@/lib/types";

export function ResourceForm({ resource, id }: { resource: string; id?: string }) {
  const router = useRouter();
  const config = configs[resource] as ResourceConfig<Record<string, any>>;
  const [values, setValues] = useState<Record<string, any>>(defaultValues(config.fields));
  const [options, setOptions] = useState<Record<string, Option[]>>({});
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(Boolean(id));
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    config.fields.filter((f) => f.relation).forEach((field) => loadOptions(field, setOptions));
  }, [config.fields]);

  useEffect(() => {
    if (!id) return;
    apiFetch<Record<string, any>>(`/${resource}/${id}`)
      .then((data) => setValues(toFormValues(data, config.fields)))
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [config.fields, id, resource]);

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setError("");
    const missing = config.fields.find((field) => field.required && !values[field.name]);
    if (missing) {
      setError(`${missing.label} est requis`);
      return;
    }
    setSaving(true);
    try {
      await apiFetch(`/${resource}${id ? `/${id}` : ""}`, {
        method: id ? "PUT" : "POST",
        body: JSON.stringify(cleanPayload(values, config.fields))
      });
      router.push(`/${resource}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Enregistrement impossible");
    } finally {
      setSaving(false);
    }
  }

  if (loading) return <div className="rounded-md border border-slate-200 bg-white p-8 text-center text-sm text-slate-500 shadow-panel">Chargement du formulaire...</div>;

  return (
    <section className="space-y-5">
      <div>
        <p className="text-sm font-semibold uppercase tracking-wide text-ministry-gold">{id ? "Modification" : "Creation"}</p>
        <h2 className="text-2xl font-bold text-ministry-navy">{id ? `Modifier ${config.singular}` : `Nouveau ${config.singular}`}</h2>
      </div>
      <form onSubmit={submit} className="rounded-md border border-slate-200 bg-white p-4 shadow-panel sm:p-6">
        {error ? <div className="mb-4 rounded-md border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-semibold text-rose-700">{error}</div> : null}
        <div className="grid gap-4 md:grid-cols-2">
          {config.fields.map((field) => (
            <FormField key={field.name} field={field} value={values[field.name] ?? ""} options={options} onChange={(value) => setValues((prev) => ({ ...prev, [field.name]: value }))} />
          ))}
        </div>
        <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
          <Link href={`/${resource}`} className="focus-ring rounded-md border border-slate-200 px-4 py-2.5 text-center text-sm font-bold text-slate-700 hover:bg-slate-50">Annuler</Link>
          <button disabled={saving} className="focus-ring inline-flex items-center justify-center gap-2 rounded-md bg-ministry-gold px-4 py-2.5 text-sm font-bold text-white hover:bg-amber-700 disabled:opacity-60">
            <Save size={17} /> {saving ? "Enregistrement..." : "Enregistrer"}
          </button>
        </div>
      </form>
    </section>
  );
}

function FormField({ field, value, options, onChange }: { field: Field; value: string; options: Record<string, Option[]>; onChange: (value: string) => void }) {
  const className = "focus-ring mt-1 w-full rounded-md border border-slate-200 px-3 py-2.5 text-sm";
  return (
    <label className={field.type === "textarea" ? "md:col-span-2" : ""}>
      <span className="text-sm font-semibold text-slate-700">{field.label}{field.required ? " *" : ""}</span>
      {field.type === "textarea" ? (
        <textarea className={`${className} min-h-28 resize-y`} value={value} onChange={(e) => onChange(e.target.value)} />
      ) : field.type === "select" || field.relation ? (
        <select className={className} value={value} onChange={(e) => onChange(e.target.value)}>
          <option value="">Selectionner</option>
          {(field.options ?? options[field.relation ?? ""] ?? []).map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
        </select>
      ) : (
        <input className={className} type={field.type ?? "text"} value={value} onChange={(e) => onChange(e.target.value)} />
      )}
    </label>
  );
}

function defaultValues(fields: Field[]) {
  return Object.fromEntries(fields.map((field) => [field.name, field.type === "select" && field.options?.[0] ? field.options[0].value : ""]));
}

function toFormValues(data: Record<string, any>, fields: Field[]) {
  return Object.fromEntries(fields.map((field) => {
    const value = data[field.name];
    if (field.type === "date" && value) return [field.name, String(value).slice(0, 10)];
    return [field.name, value ?? ""];
  }));
}

function cleanPayload(values: Record<string, any>, fields: Field[]) {
  const payload: Record<string, any> = {};
  fields.forEach((field) => {
    const value = values[field.name];
    payload[field.name] = field.type === "number" && value !== "" ? Number(value) : value;
  });
  return payload;
}
