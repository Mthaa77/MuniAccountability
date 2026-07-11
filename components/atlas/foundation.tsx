import type { LucideIcon } from "lucide-react";

export function AtlasStatusPill({ children, tone = "default" }: { children: React.ReactNode; tone?: "default" | "gold" | "risk" | "blue" }) {
  return (
    <span className="atlas-status-pill" data-tone={tone}>
      {children}
    </span>
  );
}

export function AtlasHero({
  kicker,
  title,
  emphasis,
  description,
  children,
  side
}: {
  kicker: string;
  title: string;
  emphasis?: string;
  description: string;
  children?: React.ReactNode;
  side?: React.ReactNode;
}) {
  return (
    <section className="atlas-hero">
      <div className="atlas-hero-grid">
        <div className="atlas-hero-copy">
          <p className="eyeless">{kicker}</p>
          <h1>
            {title} {emphasis ? <em>{emphasis}</em> : null}
          </h1>
          <p>{description}</p>
          {children ? <div className="atlas-hero-actions">{children}</div> : null}
        </div>
        {side ? <aside className="atlas-hero-side">{side}</aside> : null}
      </div>
    </section>
  );
}

export function AtlasMetricTile({
  title,
  value,
  note,
  icon: Icon,
  tone = "default"
}: {
  title: string;
  value: string;
  note: string;
  icon: LucideIcon;
  tone?: "default" | "risk" | "gold" | "good" | "blue";
}) {
  return (
    <section className="atlas-tile" data-tone={tone} aria-label={`${title}: ${value}`}>
      <span className="atlas-tile-signal" aria-hidden="true" />
      <div className="atlas-tile-icon">
        <Icon size={20} />
      </div>
      <span className="atlas-tile-label">{title}</span>
      <strong className="atlas-tile-value">{value}</strong>
      <p className="atlas-tile-note">{note}</p>
    </section>
  );
}

export function AtlasSectionHeading({ kicker, title, action }: { kicker: string; title: string; action?: React.ReactNode }) {
  return (
    <div className="atlas-section-heading panel-header">
      <div>
        <p className="eyeless">{kicker}</p>
        <h2>{title}</h2>
      </div>
      {action}
    </div>
  );
}

export function AtlasEvidenceChip({ source, state = "reviewed" }: { source: string; state?: "reviewed" | "pending" | "locked" }) {
  const tone = state === "reviewed" ? "default" : state === "pending" ? "gold" : "risk";
  return <AtlasStatusPill tone={tone}>{source}</AtlasStatusPill>;
}

export function AtlasInsightCard({ title, children, footer }: { title: string; children: React.ReactNode; footer?: React.ReactNode }) {
  return (
    <article className="atlas-insight-card">
      <p className="eyeless">Intelligence note</p>
      <h3>{title}</h3>
      <div>{children}</div>
      {footer ? <footer>{footer}</footer> : null}
    </article>
  );
}
