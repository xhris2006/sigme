"use client";

import { statusClasses, statusLabels } from "@/lib/status";

export function StatusBadge({ value }: { value: string }) {
  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ${statusClasses[value] ?? "bg-slate-100 text-slate-700 ring-slate-200"}`}>
      {statusLabels[value] ?? value}
    </span>
  );
}
