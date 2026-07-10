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
        kicker="Briefing Builder"
        title="Create clear decision packs people can actually use"
        emphasis="without losing the evidence."
        description="Choose a briefing type, check the required sections and make sure every important statement links back to a source. Financial values stay out until the Treasury checks are complete."
        side={
          <>
            <AtlasEvidenceChip source="Citations required" />
            <AtlasEvidenceChip source="Financial values locked" state="locked" />
            <AtlasEvidenceChip source="Reviewer check needed" state="pending" />
          </>
        }
      >
        <AtlasStatusPill>Build a briefing</AtlasStatusPill>
        <AtlasStatusPill tone="gold">Check sources</AtlasStatusPill>
        <AtlasStatusPill tone="risk">Keep unsafe numbers out</AtlasStatusPill>
      </AtlasHero>

      <section className="atlas-workflow-metrics" aria-label="Briefing workspace summary">
        <AtlasMetricTile title="Briefings" value={String(briefings.length)} note="Decision packs available in this workspace" icon={FileText} />
        <AtlasMetricTile title="In review" value={String(reviewBriefings)} note="Packs waiting for source and wording checks" tone="gold" icon={BookOpenCheck} />
        <AtlasMetricTile title="Drafts" value={String(draftBriefings)} note="Packs still being assembled" tone="blue" icon={LockKeyhole} />
        <AtlasMetricTile title="Source links" value={String(sourceRefs)} note="Evidence references already attached" tone="good" icon={ShieldCheck} />
      </section>

      <section className="briefing-status-grid">
        <article className="briefing-status-card">
          <span>Rule</span>
          <strong>No source, no claim</strong>
          <p>If a statement cannot be traced to evidence, leave it out or mark it for review.</p>
        </article>
        <article className="briefing-status-card">
          <span>Gate</span>
          <strong>Do not use unverified numbers</strong>
          <p>Financial Pulse values stay locked until the source, formula and freshness checks pass.</p>
        </article>
        <article className="briefing-status-card">
          <span>Goal</span>
          <strong>Make decisions easier</strong>
          <p>A good briefing should explain the risk, the evidence, the decision needed and the next step.</p>
        </article>
      </section>

      <BriefingWorkspace />
    </div>
  );
}
