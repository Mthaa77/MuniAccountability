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
        kicker="Find evidence"
        title="Search first, then make the claim"
        emphasis="with proof attached."
        description="Use this page to find audit evidence, source documents, findings and municipal references. If the current source library does not support a claim, the platform should say so clearly instead of guessing."
        side={
          <>
            <AtlasEvidenceChip source="Claims need sources" />
            <AtlasEvidenceChip source="Review state shown" state="pending" />
            <AtlasEvidenceChip source="Unsafe claims blocked" state="locked" />
          </>
        }
      >
        <AtlasStatusPill>Source search</AtlasStatusPill>
        <AtlasStatusPill tone="gold">Citations visible</AtlasStatusPill>
        <AtlasStatusPill tone={results.length ? "default" : "risk"}>{results.length ? `${results.length} result(s)` : "No result yet"}</AtlasStatusPill>
      </AtlasHero>

      <section className="atlas-queue-brief" aria-label="Search state summary">
        <AtlasMetricTile title="Results" value={String(results.length)} note={query ? `Showing matches for: ${query}` : "Type a topic, place or audit phrase"} icon={Search} />
        <AtlasMetricTile title="Reviewed" value={String(reviewedCount)} note="Results already accepted or ready to publish" tone="good" icon={ShieldCheck} />
        <AtlasMetricTile title="Safety rule" value="On" note="Unsupported answers stay blocked" tone="gold" icon={Sparkles} />
        <AtlasMetricTile title="Library" value="AGSA" note="Search currently uses the governed audit source library" tone="blue" icon={FileSearch} />
      </section>

      <section className="panel atlas-search-console">
        <form className="atlas-search-form" action="/search">
          <label htmlFor="q">What do you want to verify?</label>
          <div className="atlas-search-box">
            <input id="q" name="q" defaultValue={query} placeholder="Try water, clean audit, irregular expenditure, Tshwane..." />
            <button className="primary-action" type="submit">Search evidence</button>
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
          <h3>Start with a question the evidence can answer</h3>
          <p>Search for a municipality, audit phrase, service-delivery issue or risk theme. Each result shows where the information came from and whether it has been reviewed.</p>
        </section>
      ) : null}

      {query && !results.length ? (
        <section className="panel atlas-source-thread">
          <Badge tone="watch">not supported yet</Badge>
          <h3>No source-backed answer found</h3>
          <p>The current evidence library does not support this query. Do not publish the claim until a source is added or reviewed.</p>
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
                  : "Citation still needs review"}
            </small>
            <div className="atlas-result-meta">
              <AtlasEvidenceChip source={result.confidence.replaceAll("_", " ")} state={result.confidence === "high" ? "reviewed" : "pending"} />
              {result.reviewStatus ? <AtlasEvidenceChip source={result.reviewStatus.replaceAll("_", " ")} state="pending" /> : null}
              {result.period ? <AtlasEvidenceChip source={result.period} /> : null}
            </div>
            <footer>
              <Link className="primary-link" href={result.path ?? "/sources"}>Open evidence</Link>
              <Link className="secondary-action" href="/sources">View source library</Link>
            </footer>
          </article>
        ))}
      </section>
    </div>
  );
}
