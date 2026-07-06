import Link from "next/link";
import { Badge, PageHeader } from "@/components/ui";
import { publicProfiles } from "@/lib/pilot-data";

export default function MuniCheckPage() {
  return (
    <>
      <PageHeader
        kicker="Public transparency layer"
        title="MuniCheck plain-language profiles."
        description="Public users see source-backed audit context and methodology notes, never internal workflow comments or restricted evidence."
      />
      <section className="directory-grid">
        {publicProfiles.map((profile) => (
          <article className="directory-card" key={profile.municipalityId}>
            <div>
              <span>Public profile</span>
              <Badge tone="healthy">public safe</Badge>
            </div>
            <strong>{profile.name}</strong>
            <p>{profile.plainLanguageStatus}</p>
            <div className="check-list compact">
              {profile.publicFields.map((field) => <span key={field}>{field}</span>)}
            </div>
            <Link className="primary-link" href={`/municipalities/${profile.municipalityId}`}>View institutional case</Link>
          </article>
        ))}
      </section>
    </>
  );
}
