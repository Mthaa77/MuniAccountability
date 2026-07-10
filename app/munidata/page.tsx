import { Badge } from "@/components/ui";
import { AtlasEvidenceChip, AtlasHero, AtlasMetricTile, AtlasStatusPill } from "@/components/atlas/foundation";
import { muniDataEndpoints } from "@/lib/pilot-data";
import { DatabaseZap, Globe2, LockKeyhole, ShieldCheck } from "lucide-react";

export default function MuniDataPage() {
  const publicEndpoints = muniDataEndpoints.filter((endpoint) => endpoint.access.toLowerCase().includes("public")).length;
  const protectedEndpoints = muniDataEndpoints.length - publicEndpoints;

  return (
    <div className="atlas-page-stack">
      <AtlasHero
        kicker="API, exports and partner feeds"
        title="MuniData endpoint catalogue"
        emphasis="with access boundaries."
        description="Programmatic access stays source-aware, rate-limitable and separated by public, partner and institutional access levels."
        side={
          <>
            <AtlasEvidenceChip source="OpenAPI documented" />
            <AtlasEvidenceChip source="Access classes visible" state="pending" />
            <AtlasEvidenceChip source="Institutional routes protected" state="locked" />
          </>
        }
      >
        <AtlasStatusPill>Endpoint catalogue</AtlasStatusPill>
        <AtlasStatusPill tone="gold">Partner-ready</AtlasStatusPill>
        <AtlasStatusPill tone="risk">Rate limit required</AtlasStatusPill>
      </AtlasHero>

      <section className="atlas-queue-brief" aria-label="MuniData endpoint summary">
        <AtlasMetricTile title="Endpoints" value={String(muniDataEndpoints.length)} note="Routes exposed in the catalogue" icon={DatabaseZap} />
        <AtlasMetricTile title="Public" value={String(publicEndpoints)} note="Public-safe access routes" tone="good" icon={Globe2} />
        <AtlasMetricTile title="Protected" value={String(protectedEndpoints)} note="Partner or institutional access required" tone="gold" icon={LockKeyhole} />
        <AtlasMetricTile title="Source-aware" value="Yes" note="Routes preserve publication and source boundaries" tone="blue" icon={ShieldCheck} />
      </section>

      <section className="panel wide">
        <div className="table-wrap">
          <table>
            <thead>
              <tr><th>Method</th><th>Path</th><th>Access</th><th>Description</th></tr>
            </thead>
            <tbody>
              {muniDataEndpoints.map((endpoint) => (
                <tr key={endpoint.path}>
                  <td><Badge tone="healthy">{endpoint.method}</Badge></td>
                  <td><code>{endpoint.path}</code></td>
                  <td>{endpoint.access}</td>
                  <td>{endpoint.description}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
