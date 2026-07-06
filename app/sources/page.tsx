import { SourceHealthTabs } from "@/components/interactive";
import { PageHeader } from "@/components/ui";

export default function SourcesPage() {
  return (
    <>
      <PageHeader
        kicker="Data operations and verification"
        title="Source health, freshness and publication guardrails."
        description="Monitor ingestion status, source treatment, quality exceptions and the validation state behind every product-facing value."
      />
      <SourceHealthTabs />
    </>
  );
}
