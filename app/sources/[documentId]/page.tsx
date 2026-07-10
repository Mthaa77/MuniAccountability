import { notFound } from "next/navigation";
import Link from "next/link";
import { Archive, FileSearch, Hash, ShieldCheck } from "lucide-react";
import { Badge } from "@/components/ui";
import { AtlasEvidenceChip, AtlasHero, AtlasMetricTile, AtlasStatusPill } from "@/components/atlas/foundation";
import { listAgsaReviewDecisions } from "@/lib/agsa-review-store";
import { agsaDocuments, getSourceDocumentDetail } from "@/lib/pilot-data";

export function generateStaticParams() {
  return agsaDocuments.map((document) => ({ documentId: document.documentId }));
}

export default function SourceDocumentPage({ params }: { params: { documentId: string } }) {
  const detail = getSourceDocumentDetail(params.documentId);
  if (!detail) notFound();

  const decisions = listAgsaReviewDecisions().decisions;
  const decisionByCitation = new Map(decisions.flatMap((decision) => decision.citationIds.map((citationId) => [citationId, decision.status])));
  const reviewedCitations = detail.citations.filter((citation) => decisionByCitation.has(citation.citationId)).length;

  return (
    <div className="atlas-page-stack">
      <AtlasHero
        kicker="Source document viewer"
        title={detail.document.title}
        emphasis="source file."
        description={`${detail.document.fileName} · ${detail.document.reportYear}. Review extracted pages, citations, findings and outcome mappings before publication.`}
        side={
          <>
            <AtlasEvidenceChip source={detail.document.reportFamily} />
            <AtlasEvidenceChip source={detail.document.qualityState.replaceAll("_", " ")} state={detail.lowConfidencePages.length ? "pending" : "reviewed"} />
            <AtlasEvidenceChip source={`${detail.lowConfidencePages.length} low-confidence page(s)`} state={detail.lowConfidencePages.length ? "locked" : "reviewed"} />
          </>
        }
      >
        <AtlasStatusPill>Document metadata</AtlasStatusPill>
        <AtlasStatusPill tone="gold">Citation register</AtlasStatusPill>
        <AtlasStatusPill tone={detail.lowConfidencePages.length ? "risk" : "default"}>Manual review queue</AtlasStatusPill>
      </AtlasHero>

      <section className="atlas-queue-brief" aria-label="Source document summary">
        <AtlasMetricTile title="Pages" value={String(detail.document.pageCount)} note="Total pages tracked for this source document" icon={Archive} />
        <AtlasMetricTile title="Citations" value={String(detail.citations.length)} note="Extracted citation records tied to this source" tone="blue" icon={FileSearch} />
        <AtlasMetricTile title="Reviewed" value={String(reviewedCitations)} note="Citations with explicit review decisions" tone="good" icon={ShieldCheck} />
        <AtlasMetricTile title="Hash" value="SHA" note={`${detail.document.sha256.slice(0, 12)}…`} tone="gold" icon={Hash} />
      </section>

      <section className="atlas-vault-grid">
        <section className="atlas-doc-card">
          <header>
            <div>
              <p className="eyeless">Document metadata</p>
              <h2>{detail.document.reportFamily}</h2>
            </div>
            <Badge tone={detail.document.qualityState}>{detail.document.qualityState.replaceAll("_", " ")}</Badge>
          </header>
          <dl className="evidence-list">
            <div><dt>File</dt><dd>{detail.document.fileName}</dd></div>
            <div><dt>Pages</dt><dd>{detail.document.pageCount}</dd></div>
            <div><dt>Priority</dt><dd>{detail.document.priority}</dd></div>
            <div><dt>SHA-256</dt><dd>{detail.document.sha256.slice(0, 20)}...</dd></div>
          </dl>
          <Link className="primary-link" href={`/admin/agsa-review?documentId=${detail.document.documentId}`}>Open extraction review</Link>
        </section>

        <section className="atlas-doc-card">
          <header>
            <div>
              <p className="eyeless">Extracted records</p>
              <h2>Linked facts</h2>
            </div>
            <Badge tone="healthy">{detail.citations.length} citations</Badge>
          </header>
          <dl className="evidence-list">
            <div><dt>Findings</dt><dd>{detail.relatedFindings.length}</dd></div>
            <div><dt>Outcomes</dt><dd>{detail.relatedOutcomes.length}</dd></div>
            <div><dt>Sampled pages</dt><dd>{detail.pageSamples.length}</dd></div>
          </dl>
          <div className="atlas-source-thread">
            <h3>Review rule</h3>
            <p>Low-confidence pages and unresolved mappings should remain guarded until a reviewer accepts, corrects or excludes the extracted record.</p>
          </div>
        </section>
      </section>

      <section className="panel wide">
        <div className="panel-header">
          <div>
            <p className="eyeless">Citation register</p>
            <h2>Pages and review state</h2>
          </div>
          <Badge tone="healthy">source trail</Badge>
        </div>
        <div className="atlas-document-grid">
          {detail.citations.slice(0, 12).map((citation) => (
            <article className="atlas-search-result" key={citation.citationId}>
              <header>
                <div>
                  <p className="eyeless">Page {citation.pageNumber}</p>
                  <h2>{citation.sectionTitle ?? "Unsectioned citation"}</h2>
                </div>
                <Badge tone={decisionByCitation.has(citation.citationId) ? "healthy" : "watch"}>{decisionByCitation.get(citation.citationId) ?? "not reviewed"}</Badge>
              </header>
              <p>{citation.quoteSnippet ?? "No extracted snippet available."}</p>
              <div className="atlas-result-meta">
                <AtlasEvidenceChip source={citation.extractionConfidence} state={citation.extractionConfidence === "high" ? "reviewed" : "pending"} />
                <AtlasEvidenceChip source={`citation ${citation.citationId}`} />
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className="panel wide">
        <div className="panel-header">
          <div>
            <p className="eyeless">Low-confidence pages</p>
            <h2>Manual review queue</h2>
          </div>
          <Badge tone={detail.lowConfidencePages.length ? "watch" : "healthy"}>{detail.lowConfidencePages.length} page(s)</Badge>
        </div>
        <div className="atlas-audit-ribbon">
          {detail.lowConfidencePages.slice(0, 8).map((page) => (
            <article key={page.pageNumber}>
              <span className="atlas-audit-year">Page {page.pageNumber}</span>
              <div>
                <strong>{page.sectionTitle ?? "Needs section review"}</strong>
                <p>{page.textSample || "No text extracted."}</p>
              </div>
            </article>
          ))}
        </div>
      </section>
    </div>
  );
}
