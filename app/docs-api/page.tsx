import { PageHeader } from "@/components/ui";

export default function ApiDocsPage() {
  return (
    <>
      <PageHeader
        kicker="Developer interface"
        title="MuniData API documentation."
        description="The OpenAPI source file is docs/openapi.yaml."
      />
      <section className="panel wide">
        <p className="lead">Core routes include municipalities, case files, intervention queue, findings, source search, assistant query, production readiness, production evidence, MuniCheck and MuniData.</p>
        <div className="check-list">
          <span>GET /v1/municipalities</span>
          <span>GET /v1/intervention-queue</span>
          <span>GET /v1/findings</span>
          <span>GET /v1/search</span>
          <span>POST /v1/assistant/query</span>
          <span>GET /v1/production-readiness</span>
          <span>GET /v1/production-evidence</span>
          <span>GET /v1/municheck</span>
        </div>
      </section>
    </>
  );
}
