"use client";

import { useParams, useSearchParams } from "next/navigation";
import { ResourceDetail } from "@/components/ResourceDetail";
import { ResourceForm } from "@/components/ResourceForm";

export default function EnterpriseDetailPage() {
  const params = useParams<{ id: string }>();
  const search = useSearchParams();
  return search.get("edit") ? <ResourceForm resource="enterprises" id={params.id} /> : <ResourceDetail resource="enterprises" id={params.id} />;
}
