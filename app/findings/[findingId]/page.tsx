import { notFound } from "next/navigation";
import Link from "next/link";
import { AlertTriangle, FileSearch, Gauge, ShieldCheck } from "lucide-react";
import { Badge, severityLabel } from "@/components/ui";
import { AtlasEvidenceChip, AtlasHero, AtlasMetricTile, AtlasStatusPill } from "@/components/atlas/foundation";
import { getDecisionForCitation } from "@/lib/agsa-review-store";
import { agsaFindings, getFindingDetail } from "@/lib/pilot-data";

export function generateStaticParams() {
  return agsaFindings.map((finding) => ({ findingId: finding.findingId }));
}

export default function FindingDetailPage({ params }: { params: { findingId: string } }) {
  const finding = getFindingDetail(params.findingId);
  if (!finding) notFound();

  const reviewDecision = getDecisionForCitation(finding.citationId);
  const reviewStatus = reviewDecision?.status ?? "not reviewed";

  return (
    <div className="atlas-page-stack">
      <AtlasHero
        kicker="AGSA finding detail"
        title={finding.subtheme}
        emphasis="source trail."
        description={finding.description}
        side={
          <>
            <AtlasEvidenceChip source={severityLabel[finding.severity]} state={finding.severity === "critical" ? "locked" : "pending"} />
            <AtlasEvidenceChip source={finding.source.qualityState.replaceAll("_", " ")} />
            <AtlasEvidenceChip source={reviewStatus.replaceAll("_", " ")} state={reviewDecision?.status === "accepted" ? "reviewed" : "pending"} />
          </>
        }
      >
        <AtlasStatusPill tone={finding.severity === "critical" ? "risk" : "gold"}>{severityLabel[finding.severity]}</AtlasStatusPill>
        <AtlasStatusPill>Finding impact</AtlasStatusPill>
        <AtlasStatusPill tone="gold">Citation required</AtlasStatusPill>
      </AtlasHero>

      <section className="atlas-queue-brief" aria-label="Finding detail summary">
        <AtlasMetricTile title="Severity" value={severityLabel[finding.severity]} note="AGSA-derived risk severity used for workflow prioritisation" tone={finding.severity === "critical" ? "risk" : "gold"} icon={Gauge} />
        <AtlasMetricTile title="Repeat" value={finding.repeatFlag ? "Yes" : "No"} note="Indicates whether the finding repeats across reporting context" tone={finding.repeatFlag ? "risk" : "good"} icon={AlertTriangle} />
        <AtlasMetricTile title="Related" value={String(finding.relatedMunicipalities.length)} note="Municipalities linked to this finding" tone="blue" icon={FileSearch} />
        <AtlasMetricTile title="Review" value={reviewStatus.replaceAll("_", " ")} note="Citation review state from the governance overlay" tone={reviewDecision?.status === "accepted" ? "good" : "gold"} icon={ShieldCheck} />
      </section>

      <section className="case-file-grid">
        <section className="panel">
          <div className="panel-header">
            <div>
              <p className="eyeless">Finding impact</p>
              <h2>Why it matters</h2>
            </div>
            <Badge tone={reviewDecision?.status ?? "watch"}>{reviewStatus}</Badge>
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
    </div>
  );
}
