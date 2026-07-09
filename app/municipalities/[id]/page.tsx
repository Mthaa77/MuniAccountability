import { notFound } from "next/navigation";
import Link from "next/link";
import { Activity, AlertTriangle, ClipboardCheck, Gauge } from "lucide-react";
import { ActionKanban, EvidenceDrawer } from "@/components/interactive";
import { Badge } from "@/components/ui";
import { AtlasEvidenceChip, AtlasHero, AtlasMetricTile, AtlasStatusPill } from "@/components/atlas/foundation";
import {
  actions,
  evidenceChecklist,
  getAuditTimelineForMunicipality,
  getFindingsForMunicipality,
  getIpiComponentsForMunicipality,
  municipalities,
  queueItems
} from "@/lib/pilot-data";

export function generateStaticParams() {
  return municipalities.map((municipality) => ({ id: municipality.id }));
}

export default function MunicipalityCaseFilePage({ params }: { params: { id: string } }) {
  const municipality = municipalities.find((candidate) => candidate.id === params.id);
  if (!municipality) notFound();

  const scopedActions = actions.filter((action) => action.municipalityId === municipality.id);
  const scopedQueue = queueItems.find((item) => item.municipalityId === municipality.id) ?? queueItems[0];
  const scopedTimeline = getAuditTimelineForMunicipality(municipality.id);
  const scopedIpiComponents = getIpiComponentsForMunicipality(municipality.id);
  const scopedFindings = getFindingsForMunicipality(municipality.id);
  const openActions = scopedActions.filter((action) => !["approved", "closed_with_residual_risk"].includes(action.status)).length;

  return (
    <div className="atlas-page-stack">
      <AtlasHero
        kicker="Municipality 360 dossier"
        title={municipality.commonName}
        emphasis="case file."
        description={municipality.situationSummary}
        side={
          <>
            <AtlasEvidenceChip source={municipality.auditOutcome} />
            <AtlasEvidenceChip source={`${municipality.province} ${municipality.category}`} state="pending" />
            <AtlasEvidenceChip source={municipality.posture} state="locked" />
          </>
        }
      >
        <AtlasStatusPill tone={municipality.interventionPriority === "critical" ? "risk" : "gold"}>
          {municipality.interventionPriority} priority
        </AtlasStatusPill>
        <AtlasStatusPill>AGSA source trail</AtlasStatusPill>
        <AtlasStatusPill tone="gold">Reviewer context</AtlasStatusPill>
      </AtlasHero>

      <section className="atlas-dossier-strip" aria-label="Municipality dossier metrics">
        <AtlasMetricTile title="IPI score" value={String(municipality.ipi)} note="Prioritisation score used for intervention sequencing" tone="risk" icon={Gauge} />
        <AtlasMetricTile title="Open actions" value={String(openActions)} note="Active workflow items linked to this municipality" tone="gold" icon={ClipboardCheck} />
        <AtlasMetricTile title="Risk signals" value={String(scopedFindings.length)} note="AGSA-backed findings surfaced in this dossier" tone="blue" icon={AlertTriangle} />
        <AtlasMetricTile title="Timeline years" value={String(scopedTimeline.length)} note="Audit movement events available for review" icon={Activity} />
      </section>

      <section className="atlas-dossier-grid">
        <section className="panel atlas-dossier-card">
          <div>
            <p className="eyeless">Dossier snapshot</p>
            <h2>{municipality.name}</h2>
          </div>
          <p className="lead">{municipality.situationSummary}</p>
          <div className="atlas-dossier-meta">
            <Badge tone={municipality.interventionPriority}>{municipality.interventionPriority}</Badge>
            <Badge tone="healthy">{municipality.auditOutcome}</Badge>
            <Badge tone="watch">{municipality.householdImpact}</Badge>
          </div>
          <div className="atlas-dossier-score">
            <span className="eyeless">Intervention Priority Index</span>
            <strong>{municipality.ipi}</strong>
            <div className="atlas-score-bar" aria-label={`IPI ${municipality.ipi} out of 100`}>
              <span style={{ width: `${municipality.ipi}%` }} />
            </div>
          </div>
          <div className="atlas-source-thread">
            <h3>Evidence thread</h3>
            <p>Every risk statement in this case file should resolve to an AGSA document, a citation location, a review state and an action owner.</p>
          </div>
        </section>

        <section className="panel atlas-risk-story atlas-dossier-main">
          <div className="panel-header">
            <div>
              <p className="eyeless">Risk storyline</p>
              <h2>Why this municipality is in focus</h2>
            </div>
            <Badge tone={municipality.interventionPriority}>{municipality.interventionPriority}</Badge>
          </div>
          <p className="lead">{scopedQueue.reasonSummary}</p>
          <div className="case-meta">
            <span>{scopedQueue.riskType.replaceAll("_", " ")}</span>
            <span>{scopedQueue.whatChanged}</span>
            <span>{scopedQueue.requiredNextStep}</span>
          </div>
          <EvidenceDrawer item={scopedQueue} />
        </section>

        <section className="panel atlas-audit-ribbon-card atlas-dossier-main">
          <div className="panel-header">
            <div>
              <p className="eyeless">Audit movement ribbon</p>
              <h2>Five-year audit movement</h2>
            </div>
            <Badge tone="healthy">AGSA-linked</Badge>
          </div>
          <div className="atlas-audit-ribbon">
            {scopedTimeline.map((event) => (
              <article key={event.year}>
                <span className="atlas-audit-year">{event.year}</span>
                <div>
                  <strong>{event.outcome}</strong>
                  <p>{event.note}</p>
                  {"mappingConfidence" in event ? (
                    <small>{String(event.mappingConfidence).replaceAll("_", " ")} · {"mappingRationale" in event ? String(event.mappingRationale) : "review context pending"}</small>
                  ) : null}
                </div>
              </article>
            ))}
          </div>
        </section>

        <section className="panel">
          <div className="panel-header">
            <div>
              <p className="eyeless">IPI breakdown</p>
              <h2>Score drivers</h2>
            </div>
            <Badge tone="watch">agsa-first-v0.1</Badge>
          </div>
          <div className="atlas-breakdown-grid">
            {scopedIpiComponents.map((component) => (
              <article key={component.label}>
                <div>
                  <strong>{component.label}</strong>
                  <span>{component.score}/{component.max}</span>
                </div>
                <div className="atlas-mini-bar"><span style={{ width: `${(component.score / component.max) * 100}%` }} /></div>
                <p>{component.explanation}</p>
              </article>
            ))}
          </div>
        </section>

        <section className="panel wide">
          <div className="panel-header">
            <div>
              <p className="eyeless">AGSA findings</p>
              <h2>Cited risk signals</h2>
            </div>
            <Badge tone="healthy">Page cited</Badge>
          </div>
          <div className="atlas-finding-grid">
            {scopedFindings.slice(0, 4).map((finding) => (
              <article key={finding.findingId} className="atlas-finding-card">
                <span>{finding.findingFamily}</span>
                <Link href={`/findings/${finding.findingId}`}>{finding.subtheme}</Link>
                <p>{finding.description}</p>
                <small>{finding.source.location}</small>
              </article>
            ))}
          </div>
        </section>

        <section className="panel wide">
          <div className="panel-header">
            <div>
              <p className="eyeless">Evidence review</p>
              <h2>Checklist and action board</h2>
            </div>
            <Badge tone="under_review">Reviewer required</Badge>
          </div>
          <div className="two-column">
            <div className="check-list">
              {evidenceChecklist.map((item) => <span key={item}>{item}</span>)}
            </div>
            <ActionKanban scopedActions={scopedActions.length ? scopedActions : actions} />
          </div>
        </section>
      </section>
    </div>
  );
}
