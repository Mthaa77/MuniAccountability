import { notFound } from "next/navigation";
import Link from "next/link";
import { Badge, PageHeader, severityLabel } from "@/components/ui";
import { getDecisionForCitation } from "@/lib/agsa-review-store";
import { agsaFindings, getFindingDetail } from "@/lib/pilot-data";

export function generateStaticParams() {
  return agsaFindings.map((finding) => ({ findingId: finding.findingId }));
}

export default function FindingDetailPage({ params }: { params: { findingId: string } }) {
  const finding = getFindingDetail(params.findingId);
  if (!finding) notFound();

  const reviewDecision = getDecisionForCitation(finding.citationId);

  return (
    <>
      <PageHeader
        kicker="AGSA finding detail"
        title={finding.subtheme}
        description={finding.description}
        actions={<Badge tone={finding.severity}>{severityLabel[finding.severity]}</Badge>}
      />
      <section className="case-file-grid">
        <section className="panel">
          <div className="panel-header">
            <div>
              <p className="eyeless">Finding impact</p>
              <h2>Why it matters</h2>
            </div>
            <Badge tone={reviewDecision?.status ?? "watch"}>{reviewDecision?.status ?? "not reviewed"}</Badge>
          </div>
          <p className="lead">{finding.impact}</p>
          <dl className="evidence-list">
            <div><dt>Financial year</dt><dd>{finding.financialYear}</dd></div>
            <div><dt>Family</dt><dd>{finding.findingFamily}</dd></div>
            <div><dt>Repeat finding</dt><dd>{finding.repeatFlag ? "Yes" : "No"}</dd></div>
            <div><dt>Value at risk</dt><dd>{finding.valueAtRisk ? `R${finding.valueAtRisk.toLocaleString("en-ZA")}` : "Not quantified"}</dd></div>
          </dl>
        </section>

        <section className="panel">
          <div className="panel-header">
            <div>
              <p className="eyeless">Evidence citation</p>
              <h2>Source and review state</h2>
            </div>
            <Badge tone={finding.source.qualityState}>{finding.source.qualityState.replaceAll("_", " ")}</Badge>
          </div>
          <p className="lead">{finding.source.source}</p>
          <dl className="evidence-list">
            <div><dt>Citation</dt><dd>{finding.citationId}</dd></div>
            <div><dt>Location</dt><dd>{finding.source.location}</dd></div>
            <div><dt>Period</dt><dd>{finding.source.period}</dd></div>
          </dl>
          <Link className="primary-link" href={finding.source.url ?? "/sources"}>Open source review</Link>
        </section>

        <section className="panel wide">
          <div className="panel-header">
            <div>
              <p className="eyeless">Workflow links</p>
              <h2>Municipalities and queue items</h2>
            </div>
            <Link className="secondary-action" href="/actions">Open actions</Link>
          </div>
          <div className="source-grid">
            {finding.relatedMunicipalities.map((municipality) => (
              <article className="source-card" key={municipality.id}>
                <span>{municipality.province}</span>
                <Link className="primary-link" href={`/municipalities/${municipality.id}`}>{municipality.name}</Link>
                <p>{municipality.situationSummary}</p>
              </article>
            ))}
            {finding.relatedQueueItems.map((item) => (
              <article className="source-card" key={item.id}>
                <span>Queue #{item.rank}</span>
                <strong>{item.title}</strong>
                <p>{item.requiredNextStep}</p>
              </article>
            ))}
          </div>
        </section>

        <section className="panel wide">
          <p className="eyeless">Methodology guardrail</p>
          <h2>How to read this finding</h2>
          <p className="lead">{finding.methodologyNote}</p>
        </section>
      </section>
    </>
  );
}
