import Link from "next/link";
import { AlertTriangle, CheckCircle2, Database, FileSearch, LockKeyhole, ShieldCheck } from "lucide-react";
import { AdminConsole, SourceHealthTabs } from "@/components/interactive";
import { Badge } from "@/components/ui";
import { AtlasEvidenceChip, AtlasHero, AtlasMetricTile, AtlasStatusPill } from "@/components/atlas/foundation";
import { agsaReadinessSummary } from "@/lib/agsa-readiness-ledger";
import { buildProductionEvidencePack } from "@/lib/production-evidence";

function gateTone(status: string): "default" | "gold" | "risk" {
  if (["complete", "pass"].includes(status)) return "default";
  if (["blocked", "blocked_external"].includes(status)) return "risk";
  return "gold";
}

export default function AdminPage() {
  const productionEvidencePack = buildProductionEvidencePack();
  const preflight = productionEvidencePack.preflight;
  const readinessPercent = Math.round((agsaReadinessSummary.complete / agsaReadinessSummary.total) * 100);
  const openIntakeGates = productionEvidencePack.intakeRequirements.filter((requirement) => requirement.status !== "pass").length;
  const blockedChecks = preflight.gates.flatMap((gate) => gate.checks).filter((check) => check.status === "blocked").length;
  const reviewStats = productionEvidencePack.reviewGovernance.stats.byStatus;

  return (
    <div className="atlas-admin-console">
      <AtlasHero
        kicker="Production readiness gate-room"
        title="Publication controls, validation gates and operational proof"
        emphasis="in one console."
        description="Institutional-only controls for AGSA review, source validation, durable workflow readiness, Treasury unlocks and release evidence. Public MuniCheck must never leak restricted workflow data."
        side={
          <>
            <AtlasEvidenceChip source="Tenant scoped admin" state="pending" />
            <AtlasEvidenceChip source="Production gated" state={productionEvidencePack.productionReady ? "reviewed" : "locked"} />
            <AtlasEvidenceChip source="Public boundary enforced" />
          </>
        }
      >
        <AtlasStatusPill>Human-in-the-loop review</AtlasStatusPill>
        <AtlasStatusPill tone="gold">External evidence required</AtlasStatusPill>
        <AtlasStatusPill tone={productionEvidencePack.productionReady ? "default" : "risk"}>{productionEvidencePack.productionReady ? "Production ready" : "Not production ready"}</AtlasStatusPill>
      </AtlasHero>

      <section className="atlas-admin-metrics" aria-label="Admin readiness summary">
        <AtlasMetricTile title="Readiness" value={`${readinessPercent}%`} note={`${agsaReadinessSummary.complete}/${agsaReadinessSummary.total} readiness slices complete`} tone="blue" icon={ShieldCheck} />
        <AtlasMetricTile title="Input gates" value={String(openIntakeGates)} note="Production evidence gates still waiting for proof" tone="gold" icon={FileSearch} />
        <AtlasMetricTile title="Blocked checks" value={String(blockedChecks)} note="Preflight checks blocked by missing source or infrastructure evidence" tone={blockedChecks ? "risk" : "good"} icon={AlertTriangle} />
        <AtlasMetricTile title="Accepted reviews" value={String(reviewStats.accepted)} note="Production gate reviews accepted in the governance store" tone="good" icon={CheckCircle2} />
      </section>

      <section className="atlas-admin-grid">
        <aside className="atlas-readiness-seal">
          <div className="atlas-readiness-orb">
            <strong>{readinessPercent}</strong>
          </div>
          <div>
            <p className="eyeless">Production readiness seal</p>
            <h2>{productionEvidencePack.productionReady ? "Ready to promote" : "Evidence still required"}</h2>
            <p>{productionEvidencePack.summary}</p>
          </div>
          <div className="atlas-evidence-pills">
            <span>{agsaReadinessSummary.readyForInput} ready-for-input</span>
            <span>{agsaReadinessSummary.blockedExternal} blocked external</span>
            <span>{preflight.externalDependencies.length} dependency group(s)</span>
          </div>
        </aside>

        <section className="atlas-gate-room">
          <div className="atlas-gate-header">
            <div>
              <p className="eyeless">Ten-slice completion ledger</p>
              <h2>Readiness gate ladder</h2>
            </div>
            <Badge tone={agsaReadinessSummary.productionReady ? "healthy" : "watch"}>
              {agsaReadinessSummary.complete}/{agsaReadinessSummary.total} complete
            </Badge>
          </div>
          <p className="lead">Each gate shows whether it is complete, waiting for operator input or blocked by external evidence.</p>
          <div className="atlas-gate-ladder">
            {agsaReadinessSummary.ledger.map((slice) => (
              <article className="atlas-gate-card" data-status={slice.status} key={slice.id}>
                <header>
                  <strong>{slice.title}</strong>
                  <AtlasStatusPill tone={gateTone(slice.status)}>{slice.status.replaceAll("_", " ")}</AtlasStatusPill>
                </header>
                <p>{slice.remainingDependency ?? slice.evidence[0]}</p>
                <div className="atlas-evidence-pills">
                  {slice.evidence.slice(0, 3).map((item) => <span key={item}>{item}</span>)}
                </div>
                <div className="atlas-command-pills">
                  {slice.verification.slice(0, 2).map((command) => <code key={command}>{command}</code>)}
                </div>
              </article>
            ))}
          </div>
        </section>
      </section>

      <section className="atlas-intake-room">
        <div className="atlas-intake-header">
          <div>
            <p className="eyeless">Production evidence intake</p>
            <h2>Remaining unlock gates</h2>
          </div>
          <Badge tone={productionEvidencePack.productionReady ? "healthy" : "pending_validation"}>
            {productionEvidencePack.productionReady ? "ready" : "evidence required"}
          </Badge>
        </div>
        <p className="lead">These gates stay read-only until official files, validation proof or hosted infrastructure evidence is supplied.</p>
        <div className="case-meta">
          <span>{reviewStats.accepted} accepted evidence review(s)</span>
          <span>{reviewStats.needs_correction} correction required</span>
          <span>{reviewStats.excluded} excluded</span>
        </div>
        <div className="atlas-intake-list">
          {productionEvidencePack.intakeRequirements.map((requirement) => (
            <article className="atlas-intake-card" data-status={requirement.status} key={requirement.gateId}>
              <header>
                <strong>{requirement.title}</strong>
                <AtlasStatusPill tone={gateTone(requirement.status)}>{requirement.status.replaceAll("_", " ")}</AtlasStatusPill>
              </header>
              <p>{requirement.requiredEvidence[0]}</p>
              <div className="atlas-evidence-pills">
                {requirement.requiredEvidence.slice(1, 4).map((item) => <span key={item}>{item}</span>)}
              </div>
              <div className="atlas-command-pills">
                {requirement.safeValidationCommands.slice(0, 2).map((command) => <code key={command}>{command}</code>)}
              </div>
              {requirement.latestReview ? (
                <small>Latest review: {requirement.latestReview.status.replaceAll("_", " ")} by {requirement.latestReview.reviewer}</small>
              ) : null}
              <small>{requirement.promotionGuardrail}</small>
            </article>
          ))}
        </div>
        <Link className="primary-link" href="/v1/production-evidence">Open production evidence API</Link>
      </section>

      <section className="atlas-admin-grid">
        <section className="atlas-release-room">
          <div className="atlas-gate-header">
            <div>
              <p className="eyeless">Release checklist</p>
              <h2>Promotion rules</h2>
            </div>
            <LockKeyhole size={22} />
          </div>
          <p>Production promotion should remain locked until every check has evidence, reviewer acceptance and successful verification.</p>
          <div className="atlas-release-list">
            {productionEvidencePack.releaseChecklist.map((item) => <span key={item}>{item}</span>)}
          </div>
        </section>

        <section className="atlas-release-room">
          <div className="atlas-gate-header">
            <div>
              <p className="eyeless">Admin shortcuts</p>
              <h2>Review control surfaces</h2>
            </div>
            <Database size={22} />
          </div>
          <p>Jump into the control surfaces that move data from extracted, to reviewed, to publishable.</p>
          <div className="atlas-release-list">
            <Link className="primary-link" href="/admin/agsa-review">Open AGSA review queue</Link>
            <Link className="secondary-action" href="/admin/data-quality">Open data quality dashboard</Link>
            <Link className="secondary-action" href="/sources">Open source vault</Link>
          </div>
        </section>
      </section>

      <AdminConsole />
      <SourceHealthTabs />
    </div>
  );
}
