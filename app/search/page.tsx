import Link from "next/link";
import { Badge, PageHeader } from "@/components/ui";
import { searchAgsaEvidence } from "@/lib/source-search";

export default function SearchPage({ searchParams }: { searchParams: { q?: string } }) {
  const query = searchParams.q ?? "";
  const results = searchAgsaEvidence(query, 12);

  return (
    <>
      <PageHeader
        kicker="Source-locked search"
        title="Search the AGSA evidence corpus."
        description="Search only returns records backed by extracted AGSA documents, page citations or governed workflow evidence. No source means no assertion."
        actions={<Badge tone={results.length ? "healthy" : "watch"}>{results.length ? `${results.length} results` : "no sourced answer"}</Badge>}
      />

      <section className="panel">
        <form className="search-panel" action="/search">
          <label htmlFor="q">Search AGSA evidence</label>
          <div>
            <input id="q" name="q" defaultValue={query} placeholder="Try irregular expenditure, water, material irregularity..." />
            <button className="primary-action" type="submit">Search</button>
          </div>
        </form>
      </section>

      {!query ? (
        <section className="panel">
          <h2>Start with a source question</h2>
          <p className="lead">Examples: “water”, “irregular expenditure”, “material irregularity”, “clean audit”, or a municipality name.</p>
        </section>
      ) : null}

      {query && !results.length ? (
        <section className="panel">
          <Badge tone="watch">unsupported</Badge>
          <h2>No sourced answer</h2>
          <p>No AGSA source in the current corpus supports this query. The platform should not assert an answer without evidence.</p>
        </section>
      ) : null}

      <section className="source-list">
        {results.map((result) => (
          <article className="source-card" key={`${result.type}-${result.id}`}>
            <span>{result.type.replaceAll("_", " ")} / {result.confidence.replaceAll("_", " ")}</span>
            <strong>{result.title}</strong>
            <p>{result.summary}</p>
            <small>
              {result.citation
                ? `${result.citation.source} - ${result.citation.location}`
                : result.documentId
                  ? `Document: ${result.documentId}`
                  : "Citation pending review"}
            </small>
            <div className="review-citations">
              <span>{result.publicationState?.replaceAll("_", " ") ?? "needs review"}</span>
              {result.reviewStatus ? <span>{result.reviewStatus.replaceAll("_", " ")}</span> : null}
            </div>
            <Link className="primary-link" href={result.path ?? "/sources"}>Open evidence</Link>
          </article>
        ))}
      </section>
    </>
  );
}
