import { notFound } from "next/navigation";
import Link from "next/link";
import { Badge, PageHeader } from "@/components/ui";
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

  return (
    <>
      <PageHeader
        kicker="Source document viewer"
        title={detail.document.title}
        description={`${detail.document.fileName} - ${detail.document.reportYear}. Review extracted pages, citations, findings and outcome mappings before publication.`}
        actions={<Badge tone={detail.lowConfidencePages.length ? "watch" : "healthy"}>{detail.lowConfidencePages.length} low-confidence pages</Badge>}
      />
      <section className="case-file-grid">
        <section className="panel">
          <div className="panel-header">
            <div>
              <p className="eyeless">Document metadata</p>
              <h2>{detail.document.reportFamily}</h2>
            </div>
            <Badge tone={detail.document.qualityState}>{detail.document.qualityState.replaceAll("_", " ")}</Badge>
          </div>
          <dl className="evidence-list">
            <div><dt>File</dt><dd>{detail.document.fileName}</dd></div>
            <div><dt>Pages</dt><dd>{detail.document.pageCount}</dd></div>
            <div><dt>Priority</dt><dd>{detail.document.priority}</dd></div>
            <div><dt>SHA-256</dt><dd>{detail.document.sha256.slice(0, 16)}...</dd></div>
          </dl>
        </section>

        <section className="panel">
          <div className="panel-header">
            <div>
              <p className="eyeless">Extracted records</p>
              <h2>Linked facts</h2>
            </div>
            <Badge tone="healthy">{detail.citations.length} citations</Badge>
          </div>
          <dl className="evidence-list">
            <div><dt>Findings</dt><dd>{detail.relatedFindings.length}</dd></div>
            <div><dt>Outcomes</dt><dd>{detail.relatedOutcomes.length}</dd></div>
            <div><dt>Sampled pages</dt><dd>{detail.pageSamples.length}</dd></div>
          </dl>
          <Link className="primary-link" href={`/admin/agsa-review?documentId=${detail.document.documentId}`}>Open extraction review</Link>
        </section>

        <section className="panel wide">
          <div className="panel-header">
            <div>
              <p className="eyeless">Citation register</p>
              <h2>Pages and review state</h2>
            </div>
          </div>
          <div className="source-grid">
            {detail.citations.slice(0, 12).map((citation) => (
              <article className="source-card" key={citation.citationId}>
                <span>Page {citation.pageNumber}</span>
                <strong>{citation.sectionTitle ?? "Unsectioned citation"}</strong>
                <p>{citation.quoteSnippet ?? "No extracted snippet available."}</p>
                <small>{citation.extractionConfidence} / {decisionByCitation.get(citation.citationId) ?? "not reviewed"}</small>
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
          </div>
          <div className="timeline">
            {detail.lowConfidencePages.slice(0, 8).map((page) => (
              <article key={page.pageNumber}>
                <span>Page {page.pageNumber}</span>
                <strong>{page.sectionTitle ?? "Needs section review"}</strong>
                <p>{page.textSample || "No text extracted."}</p>
              </article>
            ))}
          </div>
        </section>
      </section>
    </>
  );
}
