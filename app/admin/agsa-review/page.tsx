import { AgsaExtractionReview } from "@/components/interactive";
import { Badge, PageHeader } from "@/components/ui";
import { extractionIssues } from "@/lib/pilot-data";

export default function AgsaExtractionReviewPage() {
  return (
    <>
      <PageHeader
        kicker="AGSA extraction review"
        title="Review low-confidence pages before publishing derived assertions."
        description="Use this queue to inspect source document, page number, extracted text sample, citation IDs and reviewer decisions. Decisions persist to the local AGSA governance store until tenant workflow persistence is added."
        actions={<Badge tone={extractionIssues.length ? "watch" : "healthy"}>{extractionIssues.length} open checks</Badge>}
      />
      <AgsaExtractionReview />
    </>
  );
}
