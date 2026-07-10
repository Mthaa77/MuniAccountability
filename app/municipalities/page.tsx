import { Building2, FileSearch, Gauge, ShieldCheck } from "lucide-react";
import { MunicipalityDirectory } from "@/components/interactive";
import { AtlasEvidenceChip, AtlasHero, AtlasMetricTile, AtlasStatusPill } from "@/components/atlas/foundation";
import { municipalities } from "@/lib/pilot-data";

export default function MunicipalitiesPage() {
  const critical = municipalities.filter((municipality) => municipality.interventionPriority === "critical").length;
  const sourceBacked = municipalities.filter((municipality) => municipality.auditOutcome).length;

  return (
    <div className="atlas-page-stack">
      <AtlasHero
        kicker="Municipality directory"
        title="Find and open every pilot case file"
        emphasis="with source context."
        description="Search municipalities by name, audit posture, category or intervention priority. Each card opens a source-backed Municipality 360 dossier."
        side={
          <>
            <AtlasEvidenceChip source="Municipality 360 ready" />
            <AtlasEvidenceChip source="Audit posture visible" state="pending" />
            <AtlasEvidenceChip source="Internal workflow separated" state="locked" />
          </>
        }
      >
        <AtlasStatusPill>Directory</AtlasStatusPill>
        <AtlasStatusPill tone="gold">Pilot cohort</AtlasStatusPill>
        <AtlasStatusPill tone={critical ? "risk" : "default"}>{critical} critical</AtlasStatusPill>
      </AtlasHero>

      <section className="atlas-queue-brief" aria-label="Municipality directory summary">
        <AtlasMetricTile title="Municipalities" value={String(municipalities.length)} note="Pilot municipalities currently represented" icon={Building2} />
        <AtlasMetricTile title="Critical" value={String(critical)} note="Municipalities requiring priority oversight attention" tone={critical ? "risk" : "good"} icon={Gauge} />
        <AtlasMetricTile title="Source-backed" value={String(sourceBacked)} note="Profiles with audit outcome context available" tone="good" icon={ShieldCheck} />
        <AtlasMetricTile title="Searchable" value="Yes" note="Directory cards support fast case-file navigation" tone="blue" icon={FileSearch} />
      </section>

      <MunicipalityDirectory />
    </div>
  );
}
