import Link from "next/link";
import { notFound } from "next/navigation";
import { Badge } from "@/components/ui";
import { AtlasEvidenceChip, AtlasHero, AtlasStatusPill } from "@/components/atlas/foundation";
import { getPublicMuniCheckProfile, listPublicMuniCheckProfiles } from "@/lib/public-municheck";

function isPublishablePublicState(state: string) {
  return state === "publishable" || state === "corrected";
}

export function generateStaticParams() {
  return listPublicMuniCheckProfiles().map((profile) => ({ municipalityId: profile.municipalityId }));
}

export default function MuniCheckDetailPage({ params }: { params: { municipalityId: string } }) {
  const profile = getPublicMuniCheckProfile(params.municipalityId);

  if (!profile) notFound();

  return (
    <div className="municheck-public">
      <AtlasHero
        kicker="Public MuniCheck profile"
        title={profile.name}
        emphasis="audit profile."
        description={profile.plainLanguageStatus}
        side={
          <div className="municheck-hero-note">
            <h3>Public profile boundary</h3>
            <p>This page shows public-safe audit context only. It excludes internal action comments, draft remediation work, restricted evidence and unresolved operational notes.</p>
          </div>
        }
      >
        <AtlasStatusPill>Public safe</AtlasStatusPill>
        <AtlasStatusPill tone="gold">Source period {profile.sourcePeriod}</AtlasStatusPill>
        <AtlasStatusPill tone={isPublishablePublicState(profile.publicationState) ? "default" : "risk"}>{profile.publicationState.replaceAll("_", " ")}</AtlasStatusPill>
      </AtlasHero>

      <section className="municheck-profile-grid">
        <article className="municheck-profile-card status-card">
          <div className="municheck-section-header">
            <div>
              <p className="eyeless">What the audit says</p>
              <h2>{profile.auditOutcome}</h2>
            </div>
            <Badge tone="healthy">source-backed</Badge>
          </div>
          <p>{profile.plainLanguageStatus}</p>
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

        <article className="municheck-profile-card">
          <div className="municheck-section-header">
            <div>
              <p className="eyeless">What this means</p>
              <h2>Plain-language interpretation</h2>
            </div>
            <Badge tone="watch">context note</Badge>
          </div>
          <p>
            This profile summarises audit signals that may help the public understand financial governance, service-delivery risk or accountability concerns. It does not replace official audit documents, municipal notices or legal processes.
          </p>
          <div className="municheck-field-list">
            <AtlasEvidenceChip source={profile.auditOutcome} />
            <AtlasEvidenceChip source={profile.sourcePeriod} state="pending" />
            <AtlasEvidenceChip source={profile.reviewStatus.replaceAll("_", " ")} state={profile.reviewStatus === "accepted" ? "reviewed" : "pending"} />
          </div>
        </article>
      </section>

      <section className="municheck-plain-grid">
        <article className="municheck-explainer">
          <div>
            <p className="eyeless">Audit timeline</p>
            <h2>Source-backed history</h2>
          </div>
          <div className="municheck-timeline">
            {profile.auditTimeline.map((entry) => (
              <article key={`${entry?.year}-${entry?.outcome}`}>
                <span className="municheck-soft-pill">{entry?.year}</span>
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

        <article className="municheck-explainer">
          <div>
            <p className="eyeless">Public AGSA signals</p>
            <h2>Findings shown publicly</h2>
          </div>
          <div className="municheck-findings">
            {profile.findings.length ? profile.findings.map((finding) => (
              <article key={finding?.findingId}>
                <span className="municheck-soft-pill">{finding?.findingFamily?.replaceAll("_", " ")}</span>
                <strong>{finding?.subtheme}</strong>
                <p>{finding?.description}</p>
                <small>{finding?.reviewStatus?.replaceAll("_", " ") ?? "not reviewed"} / {finding?.publicationState?.replaceAll("_", " ") ?? "needs review"}</small>
              </article>
            )) : <p>No public findings are currently published for this profile.</p>}
          </div>
        </article>
      </section>

      <section className="municheck-boundary-grid">
        <article className="municheck-soft-note">
          <div>
            <p className="eyeless">What is not shown publicly</p>
            <h2>Public safety boundary</h2>
          </div>
          <div className="municheck-method-list">
            {profile.publicSafety.hiddenFields.map((field) => <span key={field}>{field}</span>)}
          </div>
        </article>

        <article className="municheck-soft-note">
          <div>
            <p className="eyeless">Methodology note</p>
            <h2>How to read this profile</h2>
          </div>
          <div className="municheck-method-list">
            {profile.methodology.map((item) => <span key={item}>{item}</span>)}
          </div>
        </article>
      </section>
    </div>
  );
}
