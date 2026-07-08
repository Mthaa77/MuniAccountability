import Link from "next/link";
import { Badge, PageHeader } from "@/components/ui";
import { publicProfiles } from "@/lib/pilot-data";
import { getDecisionForCitation, isCitationPublicSafe } from "@/lib/agsa-review-store";

export default function MuniCheckPage() {
  const profiles = publicProfiles
    .filter((profile) => !profile.citation?.id || isCitationPublicSafe(profile.citation.id))
    .map((profile) => ({
      ...profile,
      reviewStatus: profile.citation?.id ? getDecisionForCitation(profile.citation.id)?.status ?? "not_reviewed" : "not_reviewed"
    }));

  return (
    <>
      <PageHeader
        kicker="Public transparency layer"
        title="MuniCheck plain-language profiles."
        description="Public users see source-backed audit context and methodology notes, never internal workflow comments or restricted evidence."
      />
      <section className="directory-grid">
        {profiles.map((profile) => (
          <article className="directory-card" key={profile.municipalityId}>
            <div>
              <span>Public profile</span>
              <Badge tone="healthy">public safe</Badge>
            </div>
            <strong>{profile.name}</strong>
            <p>{profile.plainLanguageStatus}</p>
            <p>Review state: {profile.reviewStatus.replaceAll("_", " ")}</p>
            <div className="check-list compact">
              {profile.publicFields.map((field) => <span key={field}>{field}</span>)}
              <span>AGSA source-published evidence only</span>
              <span>Platform scores are not legal findings</span>
              <span>Treasury telemetry pending validation</span>
            </div>
            <Link className="primary-link" href={`/municipalities/${profile.municipalityId}`}>View institutional case</Link>
          </article>
        ))}
      </section>
    </>
  );
}
