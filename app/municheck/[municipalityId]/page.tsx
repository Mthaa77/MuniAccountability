import Link from "next/link";
import { notFound } from "next/navigation";
import { Badge, PageHeader } from "@/components/ui";
import { getPublicMuniCheckProfile } from "@/lib/public-municheck";

export default function MuniCheckDetailPage({ params }: { params: { municipalityId: string } }) {
  const profile = getPublicMuniCheckProfile(params.municipalityId);

  if (!profile) notFound();

  return (
    <>
      <PageHeader
        kicker="Public MuniCheck profile"
        title={profile.name}
        description={profile.plainLanguageStatus}
        actions={<Badge tone="healthy">public safe</Badge>}
      />

      <section className="detail-grid">
        <article className="panel">
          <p className="eyeless">Current public status</p>
          <h2>{profile.auditOutcome}</h2>
          <dl className="evidence-list">
            <div><dt>Province</dt><dd>{profile.province}</dd></div>
            <div><dt>Municipality type</dt><dd>{profile.category}</dd></div>
            <div><dt>Source period</dt><dd>{profile.sourcePeriod}</dd></div>
            <div><dt>Review state</dt><dd>{profile.reviewStatus.replaceAll("_", " ")}</dd></div>
          </dl>
          {profile.citation ? (
            <Link className="primary-link" href={profile.citation.url ?? "/sources"}>
              Open AGSA source citation
            </Link>
          ) : null}
        </article>

        <article className="panel">
          <p className="eyeless">Public safety rules</p>
          <h2>What this page excludes</h2>
          <div className="check-list">
            {profile.publicSafety.hiddenFields.map((field) => <span key={field}>{field}</span>)}
          </div>
        </article>
      </section>

      <section className="detail-grid">
        <article className="panel">
          <p className="eyeless">Audit timeline</p>
          <h2>Source-backed history</h2>
          <div className="source-list">
            {profile.auditTimeline.map((entry) => (
              <article className="source-card" key={`${entry?.year}-${entry?.outcome}`}>
                <span>{entry?.year}</span>
                <strong>{entry?.outcome}</strong>
                <p>{entry?.note}</p>
                <small>
                  {"mappingConfidence" in entry
                    ? `Mapping: ${String(entry.mappingConfidence).replaceAll("_", " ")}`
                    : "Mapping under review"}
                </small>
              </article>
            ))}
          </div>
        </article>

        <article className="panel">
          <p className="eyeless">Findings</p>
          <h2>Public AGSA signals</h2>
          <div className="source-list">
            {profile.findings.map((finding) => (
              <article className="source-card" key={finding?.findingId}>
                <span>{finding?.findingFamily?.replaceAll("_", " ")}</span>
                <strong>{finding?.subtheme}</strong>
                <p>{finding?.description}</p>
                <small>{finding?.reviewStatus?.replaceAll("_", " ")} / {finding?.publicationState?.replaceAll("_", " ")}</small>
              </article>
            ))}
          </div>
        </article>
      </section>

      <section className="panel">
        <p className="eyeless">Methodology</p>
        <h2>How to read this profile</h2>
        <div className="check-list">
          {profile.methodology.map((item) => <span key={item}>{item}</span>)}
        </div>
      </section>
    </>
  );
}
