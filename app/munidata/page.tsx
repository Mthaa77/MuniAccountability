import { Badge, PageHeader } from "@/components/ui";
import { muniDataEndpoints } from "@/lib/pilot-data";

export default function MuniDataPage() {
  return (
    <>
      <PageHeader
        kicker="API, exports and partner feeds"
        title="MuniData endpoint catalogue."
        description="Programmatic access stays source-aware, rate-limitable and separated by public, partner and institutional access levels."
      />
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
    </>
  );
}
