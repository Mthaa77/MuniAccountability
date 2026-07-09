import Link from "next/link";

export function PrototypeNotice() {
  if (process.env.NEXT_PUBLIC_DEMO_MODE !== "true") return null;

  return (
    <section className="prototype-notice" aria-label="Prototype data notice">
      <span>Prototype mode: AGSA-backed extracted data, review overlays, and gated Treasury telemetry.</span>
      <Link href="/disclaimer">Read notice</Link>
    </section>
  );
}
