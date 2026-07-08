import Link from "next/link";
import { Badge, PageHeader } from "@/components/ui";
import { getAgsaReviewGovernance } from "@/lib/agsa-review-store";
import { agsaDocuments, extractionIssues, mappedAuditOutcomes } from "@/lib/pilot-data";

export default function DataQualityPage() {
  const governance = getAgsaReviewGovernance(extractionIssues.length);
  const confidenceCounts = mappedAuditOutcomes.reduce<Record<string, number>>((counts, outcome) => {
    counts[outcome.mappingConfidence] = (counts[outcome.mappingConfidence] ?? 0) + 1;
    return counts;
  }, {});
  const readyForPublication = governance.stats.open === 0 && governance.stats.blockers === 0;

  return (
    <>
      <PageHeader
        kicker="Data quality dashboard"
        title="Publication readiness for AGSA-derived data."
        description="Track extraction coverage, mapping confidence, review blockers and source-document readiness before public or institutional publication."
        actions={<Badge tone={readyForPublication ? "healthy" : "watch"}>{readyForPublication ? "ready" : "review required"}</Badge>}
      />
      <section className="admin-grid">
        <article className="metric-card tone-neutral">
          <span>Source documents</span>
          <strong>{agsaDocuments.length}</strong>
          <p>PDFs inventoried in the AGSA corpus.</p>
        </article>
        <article className="metric-card tone-watch">
          <span>Open review issues</span>
          <strong>{governance.stats.open}</strong>
          <p>{governance.stats.blockers} blocker(s) marked needs correction.</p>
        </article>
        <article className="metric-card tone-good">
          <span>Accepted reviews</span>
          <strong>{governance.stats.accepted}</strong>
          <p>Accepted extraction decisions in the local governance store.</p>
        </article>
        <article className="metric-card tone-risk">
          <span>Needs-review mappings</span>
          <strong>{confidenceCounts.needs_review ?? 0}</strong>
          <p>Municipality outcomes still needing annexure confirmation.</p>
        </article>
      </section>

      <section className="case-file-grid">
        <section className="panel">
          <div className="panel-header">
            <div>
              <p className="eyeless">Outcome confidence</p>
              <h2>Mapping mix</h2>
            </div>
          </div>
          <div className="breakdown-list">
            {["exact", "cohort_derived", "manual", "needs_review"].map((key) => (
              <article key={key}>
                <div>
                  <strong>{key.replaceAll("_", " ")}</strong>
                  <span>{confidenceCounts[key] ?? 0}</span>
                </div>
                <p>Audit outcome mapping confidence category.</p>
              </article>
            ))}
          </div>
        </section>

        <section className="panel wide">
          <div className="panel-header">
            <div>
              <p className="eyeless">Source coverage</p>
              <h2>Documents needing attention</h2>
            </div>
          </div>
          <div className="source-grid">
            {agsaDocuments.map((document) => (
              <article className="source-card" key={document.documentId}>
                <span>{document.priority} / {document.reportYear}</span>
                <Link className="primary-link" href={`/sources/${document.documentId}`}>{document.title}</Link>
                <p>{document.fileName}</p>
                <small>{document.pageCount} pages / {document.qualityState.replaceAll("_", " ")}</small>
              </article>
            ))}
          </div>
        </section>
      </section>
    </>
  );
}
