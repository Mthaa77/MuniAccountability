import Link from "next/link";
import { LockKeyhole, ShieldAlert } from "lucide-react";
import { AtlasHero, AtlasStatusPill } from "@/components/atlas/foundation";

export default function AccessDeniedPage({
  searchParams
}: {
  searchParams?: { reason?: string; returnTo?: string; required?: string };
}) {
  const authenticationRequired = searchParams?.reason === "authentication_required";
  const requiredRoles = searchParams?.required?.split(",").filter(Boolean) ?? [];
  const returnTo = searchParams?.returnTo?.startsWith("/") ? searchParams.returnTo : "/";

  return (
    <div className="access-denied-page">
      <AtlasHero
        kicker="Institutional access control"
        title={authenticationRequired ? "Sign-in is required" : "Your role cannot open this workspace"}
        emphasis="Access remains protected."
        description={
          authenticationRequired
            ? "This route contains institutional evidence, workflow or administration data. A valid signed session is required before it can be opened."
            : "Your authenticated role does not include the permissions required for this route. Ask a workspace administrator to review your assigned role."
        }
        side={
          <div className="access-denied-seal">
            {authenticationRequired ? <LockKeyhole size={30} /> : <ShieldAlert size={30} />}
            <strong>{authenticationRequired ? "Authentication gate" : "Permission gate"}</strong>
            <span>No protected data was disclosed.</span>
          </div>
        }
      >
        <AtlasStatusPill tone="risk">Access blocked</AtlasStatusPill>
        {requiredRoles.length ? <AtlasStatusPill tone="gold">Required: {requiredRoles.join(" or ")}</AtlasStatusPill> : null}
      </AtlasHero>

      <section className="access-denied-actions">
        <article>
          <h2>What to do next</h2>
          <p>
            {authenticationRequired
              ? "Complete the institution’s sign-in flow, then return to the protected workspace."
              : "Contact an administrator and request the minimum role necessary for your work. Access should follow least-privilege principles."}
          </p>
          <div>
            <Link className="primary-action" href={returnTo}>Try the requested route again</Link>
            <Link className="secondary-action" href="/municheck">Open public MuniCheck</Link>
          </div>
        </article>
      </section>
    </div>
  );
}
