import Link from "next/link";
import { Search, ShieldCheck, Sparkles, FileSearch } from "lucide-react";
import { Badge } from "@/components/ui";
import { AtlasEvidenceChip, AtlasHero, AtlasMetricTile, AtlasStatusPill } from "@/components/atlas/foundation";
import { searchAgsaEvidence } from "@/lib/source-search";

const prompts = ["water", "irregular expenditure", "material irregularity", "clean audit", "Tshwane"];

function isPublishableState(state?: string) {
  return state === "publishable" || state === "corrected";
}

export default function SearchPage({ searchParams }: { searchParams: { q?: string } }) {
  const query = searchParams.q ?? "";
  const results = searchAgsaEvidence(query, 12);
  const reviewedCount = results.filter((result) => result.reviewStatus === "accepted" || isPublishableState(result.publicationState)).length;

  return (
    <div className="atlas-page-stack">
      <AtlasHero
        kicker="Ask the evidence"
        title="Search the AGSA corpus without breaking the source chain"
        emphasis="promise."
        description="A source-locked evidence interface for finding municipalities, findings, citations, documents and workflow signals. If the corpus cannot support a claim, the interface should refuse the answer."
        side={
          <>
            <AtlasEvidenceChip source="No source, no assertion" />
            <AtlasEvidenceChip source="Review state visible" state="pending" />
            <AtlasEvidenceChip source="Publication guarded" state="locked" />
          </>
        }
      >
        <AtlasStatusPill>Source-locked search</AtlasStatusPill>
        <AtlasStatusPill tone="gold">Citation trail</AtlasStatusPill>
        <AtlasStatusPill tone={results.length ? "default" : "risk"}>{results.length ? `${results.length} result(s)` : "No sourced answer"}</AtlasStatusPill>
      </AtlasHero>

      <section className="atlas-queue-brief" aria-label="Search state summary">
        <AtlasMetricTile title="Results" value={String(results.length)} note={query ? `Current query: ${query}` : "Submit a source-backed query"} icon={Search} />
        <AtlasMetricTile title="Reviewed" value={String(reviewedCount)} note="Results with accepted or publishable state" tone="good" icon={ShieldCheck} />
        <AtlasMetricTile title="Guardrail" value="1" note="Unsupported answers remain blocked by design" tone="gold" icon={Sparkles} />
        <AtlasMetricTile title="Corpus" value="AGSA" note="Search is restricted to extracted governed evidence" tone="blue" icon={FileSearch} />
      </section>

      <section className="panel atlas-search-console">
        <form className="atlas-search-form" action="/search">
          <label htmlFor="q">Search AGSA evidence</label>
          <div className="atlas-search-box">
            <input id="q" name="q" defaultValue={query} placeholder="Try irregular expenditure, water, material irregularity, clean audit..." />
            <button className="primary-action" type="submit">Search</button>
          </div>
        </form>
        <div className="atlas-search-prompts" aria-label="Suggested searches">
          {prompts.map((prompt) => (
            <Link key={prompt} href={`/search?q=${encodeURIComponent(prompt)}`}>{prompt}</Link>
          ))}
        </div>
      </section>

      {!query ? (
        <section className="panel atlas-source-thread">
          <h3>Start with a source question</h3>
          <p>Try a municipality name, an audit phrase, a risk theme or a public service topic. The result card will show confidence, review state and the source location where available.</p>
        </section>
      ) : null}

      {query && !results.length ? (
        <section className="panel atlas-source-thread">
          <Badge tone="watch">unsupported</Badge>
          <h3>No sourced answer</h3>
          <p>No AGSA source in the current corpus supports this query. The platform should not assert an answer without evidence.</p>
        </section>
      ) : null}

      <section className="atlas-search-results">
        {results.map((result) => (
          <article className="atlas-search-result" key={`${result.type}-${result.id}`}>
            <header>
              <div>
                <p className="eyeless">{result.type.replaceAll("_", " ")}</p>
                <h2>{result.title}</h2>
              </div>
              <Badge tone={isPublishableState(result.publicationState) ? "healthy" : "watch"}>{result.publicationState?.replaceAll("_", " ") ?? "needs review"}</Badge>
            </header>
            <p>{result.summary}</p>
            <small>
              {result.citation
                ? `${result.citation.source} · ${result.citation.location}`
                : result.documentId
                  ? `Document: ${result.documentId}`
                  : "Citation pending review"}
            </small>
            <div className="atlas-result-meta">
              <AtlasEvidenceChip source={result.confidence.replaceAll("_", " ")} state={result.confidence === "high" ? "reviewed" : "pending"} />
              {result.reviewStatus ? <AtlasEvidenceChip source={result.reviewStatus.replaceAll("_", " ")} state="pending" /> : null}
              {result.period ? <AtlasEvidenceChip source={result.period} /> : null}
            </div>
            <footer>
              <Link className="primary-link" href={result.path ?? "/sources"}>Open evidence</Link>
              <Link className="secondary-action" href="/sources">Source vault</Link>
            </footer>
          </article>
        ))}
      </section>
    </div>
  );
}
