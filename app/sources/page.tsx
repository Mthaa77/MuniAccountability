import { SourceHealthTabs } from "@/components/interactive";
import { PageHeader } from "@/components/ui";
import Link from "next/link";

export default function SourcesPage() {
  return (
    <>
      <PageHeader
        kicker="Data operations and verification"
        title="Source health, freshness and publication guardrails."
        description="Monitor ingestion status, source treatment, quality exceptions and the validation state behind every product-facing value."
        actions={<Link className="secondary-action" href="/admin/agsa-review">Review extraction issues</Link>}
      />
      <SourceHealthTabs />
    </>
  );
}
