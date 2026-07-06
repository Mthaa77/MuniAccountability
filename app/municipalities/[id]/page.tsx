import { notFound } from "next/navigation";
import { ActionKanban, EvidenceDrawer } from "@/components/interactive";
import { Badge, MunicipalityPreview, PageHeader } from "@/components/ui";
import { actions, auditTimeline, evidenceChecklist, ipiComponents, municipalities, queueItems } from "@/lib/pilot-data";

export function generateStaticParams() {
  return municipalities.map((municipality) => ({ id: municipality.id }));
}

export default function MunicipalityCaseFilePage({ params }: { params: { id: string } }) {
  const municipality = municipalities.find((candidate) => candidate.id === params.id);
  if (!municipality) notFound();

  const scopedActions = actions.filter((action) => action.municipalityId === municipality.id);
  const scopedQueue = queueItems.find((item) => item.municipalityId === municipality.id) ?? queueItems[0];

  return (
    <>
      <PageHeader
        kicker="Municipality 360 case file"
        title={municipality.name}
        description={municipality.situationSummary}
        actions={<Badge tone={municipality.interventionPriority}>{municipality.interventionPriority}</Badge>}
      />
      <section className="case-file-grid">
        <MunicipalityPreview municipality={municipality} />
        <EvidenceDrawer item={scopedQueue} />
        <section className="panel">
          <div className="panel-header">
            <div>
              <p className="eyeless">Audit timeline</p>
              <h2>Five-year movement</h2>
            </div>
            <Badge tone="healthy">AGSA verified</Badge>
          </div>
          <div className="timeline">
            {auditTimeline.map((event) => (
              <article key={event.year}>
                <span>{event.year}</span>
                <strong>{event.outcome}</strong>
                <p>{event.note}</p>
              </article>
            ))}
          </div>
        </section>
        <section className="panel">
          <div className="panel-header">
            <div>
              <p className="eyeless">IPI breakdown</p>
              <h2>Why this score</h2>
            </div>
            <Badge tone="watch">agsa-first-v0.1</Badge>
          </div>
          <div className="breakdown-list">
            {ipiComponents.map((component) => (
              <article key={component.label}>
                <div>
                  <strong>{component.label}</strong>
                  <span>{component.score}/{component.max}</span>
                </div>
                <div className="mini-bar"><span style={{ width: `${(component.score / component.max) * 100}%` }} /></div>
                <p>{component.explanation}</p>
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
    </>
  );
}
