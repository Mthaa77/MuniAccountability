import Link from "next/link";
import { Eye, FileText, ShieldCheck, UsersRound } from "lucide-react";
import { Badge } from "@/components/ui";
import { AtlasEvidenceChip, AtlasHero, AtlasMetricTile, AtlasStatusPill } from "@/components/atlas/foundation";
import { listPublicMuniCheckProfiles } from "@/lib/public-municheck";

function isPublishablePublicState(state: string) {
  return state === "publishable" || state === "corrected";
}

export default function MuniCheckPage() {
  const profiles = listPublicMuniCheckProfiles();
  const reviewedProfiles = profiles.filter((profile) => profile.reviewStatus === "accepted" || isPublishablePublicState(profile.publicationState)).length;
  const needsReview = profiles.length - reviewedProfiles;

  return (
    <div className="municheck-public">
      <AtlasHero
        kicker="Public municipal transparency"
        title="MuniCheck explains municipal audit signals"
        emphasis="in plain language."
        description="Citizen-friendly municipal profiles built from source-backed audit context. Public pages show reviewed audit signals, methodology notes and clear limits, not internal workflow comments or restricted evidence."
        side={
          <div className="municheck-hero-note">
            <h3>Public-safe by design</h3>
            <p>MuniCheck is a transparency layer. It explains what the current source corpus can support and keeps unresolved internal work out of public view.</p>
          </div>
        }
      >
        <AtlasStatusPill>Plain-language profiles</AtlasStatusPill>
        <AtlasStatusPill tone="gold">Source reference visible</AtlasStatusPill>
        <AtlasStatusPill tone="risk">Internal workflow hidden</AtlasStatusPill>
      </AtlasHero>

      <section className="atlas-queue-brief" aria-label="MuniCheck public summary">
        <AtlasMetricTile title="Profiles" value={String(profiles.length)} note="Public municipal profiles available in this prototype" icon={UsersRound} />
        <AtlasMetricTile title="Reviewed" value={String(reviewedProfiles)} note="Profiles with accepted or publishable review state" tone="good" icon={ShieldCheck} />
        <AtlasMetricTile title="Needs review" value={String(needsReview)} note="Profiles that should remain clearly labelled for review" tone="gold" icon={Eye} />
        <AtlasMetricTile title="Boundary" value="Public" note="Internal notes, draft workflows and restricted evidence are excluded" tone="blue" icon={FileText} />
      </section>

      <section className="panel municheck-soft-note">
        <div className="municheck-section-header">
          <div>
            <p className="eyeless">How to use MuniCheck</p>
            <h2>Read this as public audit context, not a legal finding.</h2>
          </div>
          <Badge tone="healthy">public safe</Badge>
        </div>
        <p>
          These profiles help residents, journalists and civic teams understand what the audit evidence currently says. They should not be treated as final legal conclusions or live Treasury financial telemetry.
        </p>
        <div className="municheck-field-list">
          <span>AGSA source-published evidence only</span>
          <span>Plain-language explanations</span>
          <span>Methodology visible</span>
          <span>Restricted evidence excluded</span>
        </div>
      </section>

      <section className="municheck-directory" aria-label="Public MuniCheck profiles">
        {profiles.map((profile) => (
          <article className="municheck-card" key={profile.municipalityId}>
            <header>
              <div>
                <p className="eyeless">Public profile</p>
                <h2>{profile.name}</h2>
              </div>
              <Badge tone={isPublishablePublicState(profile.publicationState) ? "healthy" : "watch"}>{profile.publicationState.replaceAll("_", " ")}</Badge>
            </header>
            <p>{profile.plainLanguageStatus}</p>
            <div className="municheck-field-list">
              <AtlasEvidenceChip source={profile.auditOutcome} />
              <AtlasEvidenceChip source={profile.sourcePeriod} state="pending" />
              <AtlasEvidenceChip source={profile.reviewStatus.replaceAll("_", " ")} state={profile.reviewStatus === "accepted" ? "reviewed" : "pending"} />
            </div>
            <div className="municheck-field-list">
              {profile.publicFields.slice(0, 4).map((field) => <span key={field}>{field}</span>)}
            </div>
            <Link className="primary-link" href={`/municheck/${profile.municipalityId}`}>View public profile</Link>
          </article>
        ))}
      </section>
    </div>
  );
}
