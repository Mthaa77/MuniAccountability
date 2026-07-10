import Link from "next/link";
import { Archive, Database, FileSearch, ShieldCheck } from "lucide-react";
import { SourceHealthTabs } from "@/components/interactive";
import { AtlasEvidenceChip, AtlasHero, AtlasMetricTile, AtlasStatusPill } from "@/components/atlas/foundation";
import { agsaDocuments, sourceHealth } from "@/lib/pilot-data";

export default function SourcesPage() {
  const degradedSources = sourceHealth.filter((source) => source.status !== "healthy").length;
  const lockedSources = sourceHealth.filter((source) => source.status === "blocked" || source.status === "unknown").length;

  return (
    <div className="atlas-page-stack">
      <AtlasHero
        kicker="Source vault"
        title="Provenance, freshness and publication guardrails"
        emphasis="for every claim."
        description="Monitor the source chain behind the product: AGSA documents, extraction quality, citation coverage, locked Treasury telemetry and reviewer-controlled publication states."
        side={
          <>
            <AtlasEvidenceChip source="AGSA corpus active" />
            <AtlasEvidenceChip source="Treasury validation gated" state="pending" />
            <AtlasEvidenceChip source="Workflow persistence local" state="locked" />
          </>
        }
      >
        <AtlasStatusPill>Source health</AtlasStatusPill>
        <AtlasStatusPill tone="gold">Freshness events</AtlasStatusPill>
        <AtlasStatusPill tone="risk">Publication guardrails</AtlasStatusPill>
      </AtlasHero>

      <section className="atlas-queue-brief" aria-label="Source vault summary">
        <AtlasMetricTile title="Source systems" value={String(sourceHealth.length)} note="Tracked source families and operational gates" icon={Database} />
        <AtlasMetricTile title="Documents" value={String(agsaDocuments.length)} note="AGSA source documents in the prototype corpus" tone="blue" icon={Archive} />
        <AtlasMetricTile title="Needs attention" value={String(degradedSources)} note="Degraded, locked or validation-pending source gates" tone="gold" icon={FileSearch} />
        <AtlasMetricTile title="Locked" value={String(lockedSources)} note="Blocked or unknown sources kept out of product values" tone="risk" icon={ShieldCheck} />
      </section>

      <section className="atlas-vault-grid">
        <section className="atlas-provenance-flow panel">
          <p className="eyeless">Provenance flow</p>
          <h2>PDF to claim chain</h2>
          <p className="lead">The product should make every public-facing statement traceable through a document, extraction, citation, finding, review state and action workflow.</p>
          <div className="atlas-provenance-nodes">
            <span className="atlas-source-node">AGSA PDF</span>
            <span className="atlas-source-node">Extracted page</span>
            <span className="atlas-source-node">Citation</span>
            <span className="atlas-source-node">Finding</span>
            <span className="atlas-source-node">Municipality</span>
            <span className="atlas-source-node">Action</span>
            <span className="atlas-source-node">Briefing</span>
          </div>
          <Link className="primary-link" href="/admin/agsa-review">Review extraction issues</Link>
        </section>
        <SourceHealthTabs />
      </section>
    </div>
  );
}
