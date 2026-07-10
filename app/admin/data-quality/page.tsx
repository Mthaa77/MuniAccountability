import Link from "next/link";
import { AlertTriangle, Archive, CheckCircle2, Database, FileSearch, ServerCog } from "lucide-react";
import { Badge } from "@/components/ui";
import { AtlasEvidenceChip, AtlasHero, AtlasMetricTile, AtlasStatusPill } from "@/components/atlas/foundation";
import { getAgsaReviewGovernance } from "@/lib/agsa-review-store";
import { agsaDocuments, extractionIssues, mappedAuditOutcomes } from "@/lib/pilot-data";
import { annexureValidation } from "@/lib/source-validation";
import { workflowPersistence } from "@/lib/workflow-persistence";

function statusTone(status: string): "default" | "gold" | "risk" {
  if (["passed", "pass", "accepted", "active", "verified", "source_published"].includes(status)) return "default";
  if (["failed", "blocked", "risk", "needs_correction"].includes(status)) return "risk";
  return "gold";
}

function isPublishableQuality(state: string) {
  return state === "verified" || state === "source_published";
}

export default function DataQualityPage() {
  const governance = getAgsaReviewGovernance(extractionIssues.length);
  const confidenceCounts = mappedAuditOutcomes.reduce<Record<string, number>>((counts, outcome) => {
    counts[outcome.mappingConfidence] = (counts[outcome.mappingConfidence] ?? 0) + 1;
    return counts;
  }, {});
  const readyForPublication = governance.stats.open === 0 && governance.stats.blockers === 0;
  const activeProvider = workflowPersistence.providers.find((provider) => provider.id === workflowPersistence.activeProvider);

  return (
    <div className="atlas-admin-console">
      <AtlasHero
        kicker="Data quality command"
        title="Publication readiness for AGSA-derived data"
        emphasis="before release."
        description="Track extraction coverage, mapping confidence, review blockers, source-document quality, annexure validation and workflow persistence boundaries before public or institutional publication."
        side={
          <>
            <AtlasEvidenceChip source={`${agsaDocuments.length} source documents`} />
            <AtlasEvidenceChip source={`${governance.stats.open} open review issues`} state={governance.stats.open ? "pending" : "reviewed"} />
            <AtlasEvidenceChip source={activeProvider?.label ?? "Provider unknown"} state={workflowPersistence.productionReady ? "reviewed" : "locked"} />
          </>
        }
      >
        <AtlasStatusPill>Extraction quality</AtlasStatusPill>
        <AtlasStatusPill tone="gold">Annexure gate</AtlasStatusPill>
        <AtlasStatusPill tone={readyForPublication ? "default" : "risk"}>{readyForPublication ? "Ready" : "Review required"}</AtlasStatusPill>
      </AtlasHero>

      <section className="atlas-admin-metrics" aria-label="Data quality summary">
        <AtlasMetricTile title="Documents" value={String(agsaDocuments.length)} note="PDFs inventoried in the AGSA corpus" icon={Archive} />
        <AtlasMetricTile title="Open issues" value={String(governance.stats.open)} note={`${governance.stats.blockers} blocker(s) require correction`} tone={governance.stats.open ? "gold" : "good"} icon={FileSearch} />
        <AtlasMetricTile title="Accepted" value={String(governance.stats.accepted)} note="Accepted extraction decisions in the governance store" tone="good" icon={CheckCircle2} />
        <AtlasMetricTile title="Annexure gaps" value={String(annexureValidation.unresolvedCount)} note="Municipality outcomes requiring exact annexure confirmation" tone={annexureValidation.unresolvedCount ? "risk" : "good"} icon={AlertTriangle} />
      </section>

      <section className="atlas-validation-grid">
        <section className="atlas-quality-room">
          <div className="atlas-quality-header">
            <div>
              <p className="eyeless">Outcome confidence</p>
              <h2>Mapping mix</h2>
            </div>
            <Badge tone="watch">agsa-derived</Badge>
          </div>
          <div className="atlas-quality-list">
            {["exact", "cohort_derived", "manual", "needs_review"].map((key) => (
              <article className="atlas-quality-card" data-status={key === "needs_review" ? "ready_for_input" : "complete"} key={key}>
                <header>
                  <strong>{key.replaceAll("_", " ")}</strong>
                  <AtlasStatusPill tone={key === "needs_review" ? "gold" : "default"}>{confidenceCounts[key] ?? 0}</AtlasStatusPill>
                </header>
                <p>Audit outcome mapping confidence category.</p>
              </article>
            ))}
          </div>
        </section>

        <section className="atlas-quality-room">
          <div className="atlas-quality-header">
            <div>
              <p className="eyeless">Source coverage</p>
              <h2>Documents needing attention</h2>
            </div>
            <Database size={22} />
          </div>
          <div className="atlas-quality-list">
            {agsaDocuments.map((document) => {
              const publishableQuality = isPublishableQuality(document.qualityState);
              return (
                <article className="atlas-quality-card" data-status={publishableQuality ? "complete" : "ready_for_input"} key={document.documentId}>
                  <header>
                    <strong>{document.title}</strong>
                    <AtlasStatusPill tone={statusTone(document.qualityState)}>{document.qualityState.replaceAll("_", " ")}</AtlasStatusPill>
                  </header>
                  <p>{document.fileName}</p>
                  <div className="atlas-evidence-pills">
                    <span>{document.priority}</span>
                    <span>{document.reportYear}</span>
                    <span>{document.pageCount} pages</span>
                  </div>
                  <Link className="primary-link" href={`/sources/${document.documentId}`}>Open source document</Link>
                </article>
              );
            })}
          </div>
        </section>
      </section>

      <section className="atlas-validation-card">
        <div className="atlas-quality-header">
          <div>
            <p className="eyeless">Annexure validation gate</p>
            <h2>{annexureValidation.label}</h2>
          </div>
          <Badge tone={annexureValidation.status === "passed" ? "healthy" : "risk"}>{annexureValidation.status}</Badge>
        </div>
        <p className="lead">{annexureValidation.summary}</p>
        <div className="atlas-quality-list">
          {annexureValidation.gates.map((gate) => (
            <article className="atlas-quality-card" data-status={gate.status === "passed" ? "complete" : gate.status} key={gate.id}>
              <header>
                <strong>{gate.label}</strong>
                <AtlasStatusPill tone={statusTone(gate.status)}>{gate.status.replaceAll("_", " ")}</AtlasStatusPill>
              </header>
              <p>{gate.evidence}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="atlas-validation-card">
        <div className="atlas-quality-header">
          <div>
            <p className="eyeless">Workflow persistence</p>
            <h2>Storage provider boundary</h2>
          </div>
          <Badge tone={workflowPersistence.productionReady ? "healthy" : "watch"}>
            {workflowPersistence.productionReady ? "production ready" : "prototype local"}
          </Badge>
        </div>
        <p className="lead">Active provider: {activeProvider?.label ?? "Unknown provider"}. Production workflow writes remain blocked until durable storage, migration and parity checks are complete.</p>
        <div className="atlas-validation-grid">
          {workflowPersistence.providers.map((provider) => (
            <article className="atlas-provider-card" key={provider.id}>
              <div className="atlas-quality-header">
                <div>
                  <p className="eyeless">{provider.durability.replaceAll("_", " ")}</p>
                  <h2>{provider.label}</h2>
                </div>
                <AtlasStatusPill tone={statusTone(provider.status)}>{provider.status.replaceAll("_", " ")}</AtlasStatusPill>
              </div>
              <div className="atlas-evidence-pills">
                {provider.migrationGates.slice(0, 4).map((gate) => <span key={gate}>{gate}</span>)}
              </div>
              {provider.limitations.length ? <p>{provider.limitations.join(" / ")}</p> : <p>Configured for production-durable workflow writes once migrations and credentials are supplied.</p>}
            </article>
          ))}
        </div>
        <Link className="secondary-action" href="/admin">Back to readiness gate-room</Link>
      </section>
    </div>
  );
}
