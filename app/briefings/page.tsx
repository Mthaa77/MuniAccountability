import { BookOpenCheck, FileText, LockKeyhole, ShieldCheck } from "lucide-react";
import { BriefingWorkspace } from "@/components/interactive";
import { AtlasEvidenceChip, AtlasHero, AtlasMetricTile, AtlasStatusPill } from "@/components/atlas/foundation";
import { briefings } from "@/lib/pilot-data";

export default function BriefingsPage() {
  const reviewBriefings = briefings.filter((briefing) => briefing.status === "review").length;
  const draftBriefings = briefings.filter((briefing) => briefing.status === "draft").length;
  const sourceRefs = briefings.reduce((total, briefing) => total + briefing.sourceRefs.length, 0);

  return (
    <div className="atlas-workflow-console">
      <AtlasHero
        kicker="Committee and executive packs"
        title="Generate source-cited decision packs"
        emphasis="with review discipline."
        description="Choose a briefing template, inspect required sections, keep every assertion tied to AGSA-backed evidence, and exclude Treasury-derived values until validation gates pass."
        side={
          <>
            <AtlasEvidenceChip source="AGSA citations required" />
            <AtlasEvidenceChip source="Treasury values excluded" state="locked" />
            <AtlasEvidenceChip source="Reviewer package mode" state="pending" />
          </>
        }
      >
        <AtlasStatusPill>Briefing builder</AtlasStatusPill>
        <AtlasStatusPill tone="gold">Source lock</AtlasStatusPill>
        <AtlasStatusPill tone="risk">Treasury gate respected</AtlasStatusPill>
      </AtlasHero>

      <section className="atlas-workflow-metrics" aria-label="Briefing workspace summary">
        <AtlasMetricTile title="Briefings" value={String(briefings.length)} note="Decision packs available in the prototype workspace" icon={FileText} />
        <AtlasMetricTile title="In review" value={String(reviewBriefings)} note="Briefing packs waiting for reviewer confirmation" tone="gold" icon={BookOpenCheck} />
        <AtlasMetricTile title="Drafts" value={String(draftBriefings)} note="Packs still being assembled with evidence sections" tone="blue" icon={LockKeyhole} />
        <AtlasMetricTile title="Source refs" value={String(sourceRefs)} note="AGSA source references attached to briefing templates" tone="good" icon={ShieldCheck} />
      </section>

      <section className="briefing-status-grid">
        <article className="briefing-status-card">
          <span>Guardrail</span>
          <strong>No source, no claim</strong>
          <p>Briefing output should never make unsupported assertions. Every decision note needs an evidence trail.</p>
        </article>
        <article className="briefing-status-card">
          <span>Gate</span>
          <strong>Treasury excluded</strong>
          <p>Financial Pulse and Municipal Money values stay out until connector, schema, formula and freshness gates pass.</p>
        </article>
        <article className="briefing-status-card">
          <span>Audience</span>
          <strong>Executive-ready</strong>
          <p>Templates should read like decision packs, not raw dashboards, with clear actions, risks and next evidence gates.</p>
        </article>
      </section>

      <BriefingWorkspace />
    </div>
  );
}
