import { AlertTriangle, FileSearch, ShieldCheck, WandSparkles } from "lucide-react";
import { AgsaExtractionReview } from "@/components/interactive";
import { AtlasEvidenceChip, AtlasHero, AtlasMetricTile, AtlasStatusPill } from "@/components/atlas/foundation";
import { extractionIssues } from "@/lib/pilot-data";

export default function AgsaExtractionReviewPage() {
  return (
    <div className="atlas-admin-console">
      <AtlasHero
        kicker="AGSA extraction review"
        title="Review low-confidence pages before publishing derived assertions"
        emphasis="from the corpus."
        description="Inspect source document, page number, extracted text sample, citation IDs and reviewer decisions. Decisions persist to the local AGSA governance store until tenant workflow persistence is added."
        side={
          <>
            <AtlasEvidenceChip source={`${extractionIssues.length} open checks`} state={extractionIssues.length ? "pending" : "reviewed"} />
            <AtlasEvidenceChip source="Local governance store" state="locked" />
            <AtlasEvidenceChip source="Publication overlay active" />
          </>
        }
      >
        <AtlasStatusPill>Human review queue</AtlasStatusPill>
        <AtlasStatusPill tone="gold">Correction overlays</AtlasStatusPill>
        <AtlasStatusPill tone={extractionIssues.length ? "risk" : "default"}>{extractionIssues.length} open checks</AtlasStatusPill>
      </AtlasHero>

      <section className="atlas-admin-metrics" aria-label="AGSA extraction review summary">
        <AtlasMetricTile title="Open checks" value={String(extractionIssues.length)} note="Low-confidence extraction issues requiring review" tone={extractionIssues.length ? "risk" : "good"} icon={AlertTriangle} />
        <AtlasMetricTile title="Queue" value="Active" note="Review decisions can accept, correct or exclude records" tone="gold" icon={FileSearch} />
        <AtlasMetricTile title="Overlay" value="On" note="Public-safe views respect review decisions" tone="good" icon={ShieldCheck} />
        <AtlasMetricTile title="Mode" value="Local" note="Governance decisions persist to local prototype store" tone="blue" icon={WandSparkles} />
      </section>

      <AgsaExtractionReview />
    </div>
  );
}
