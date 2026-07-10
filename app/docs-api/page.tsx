import { Code2, FileText, LockKeyhole, ShieldCheck } from "lucide-react";
import { AtlasEvidenceChip, AtlasHero, AtlasMetricTile, AtlasStatusPill } from "@/components/atlas/foundation";

const routes = [
  "GET /v1/municipalities",
  "GET /v1/intervention-queue",
  "GET /v1/findings",
  "GET /v1/search",
  "POST /v1/assistant/query",
  "GET /v1/production-readiness",
  "GET /v1/production-evidence",
  "GET /v1/municheck"
];

export default function ApiDocsPage() {
  return (
    <div className="atlas-page-stack">
      <AtlasHero
        kicker="Developer interface"
        title="MuniData API documentation"
        emphasis="for source-aware integrations."
        description="The OpenAPI source file is docs/openapi.yaml. Routes expose municipalities, case files, intervention queues, search, production readiness, MuniCheck and partner-facing MuniData surfaces."
        side={
          <>
            <AtlasEvidenceChip source="OpenAPI YAML available" />
            <AtlasEvidenceChip source="Source-aware routes" />
            <AtlasEvidenceChip source="Write routes protected" state="locked" />
          </>
        }
      >
        <AtlasStatusPill>Developer docs</AtlasStatusPill>
        <AtlasStatusPill tone="gold">Integration ready</AtlasStatusPill>
        <AtlasStatusPill tone="risk">Auth boundary required</AtlasStatusPill>
      </AtlasHero>

      <section className="atlas-queue-brief" aria-label="API documentation summary">
        <AtlasMetricTile title="Routes" value={String(routes.length)} note="Core API routes highlighted on this page" icon={Code2} />
        <AtlasMetricTile title="Spec" value="YAML" note="Primary contract lives at docs/openapi.yaml" tone="blue" icon={FileText} />
        <AtlasMetricTile title="Public" value="MuniCheck" note="Public-safe surfaces remain separated" tone="good" icon={ShieldCheck} />
        <AtlasMetricTile title="Protected" value="Writes" note="Write and admin routes require role boundaries" tone="gold" icon={LockKeyhole} />
      </section>

      <section className="panel wide">
        <p className="lead">Core routes include municipalities, case files, intervention queue, findings, source search, assistant query, production readiness, production evidence, MuniCheck and MuniData.</p>
        <div className="check-list">
          {routes.map((route) => <span key={route}>{route}</span>)}
        </div>
      </section>
    </div>
  );
}
