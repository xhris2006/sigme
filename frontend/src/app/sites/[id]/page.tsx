"use client";

import { useParams, useSearchParams } from "next/navigation";
import { ResourceDetail } from "@/components/ResourceDetail";
import { ResourceForm } from "@/components/ResourceForm";

export default function SiteDetailPage() {
  const params = useParams<{ id: string }>();
  const search = useSearchParams();
  return search.get("edit") ? <ResourceForm resource="sites" id={params.id} /> : <ResourceDetail resource="sites" id={params.id} />;
}
