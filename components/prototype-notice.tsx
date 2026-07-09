import Link from "next/link";
import styles from "./prototype-notice.module.css";

export function PrototypeNotice() {
  if (process.env.NEXT_PUBLIC_DEMO_MODE !== "true") return null;

  return (
    <section className={styles.notice} aria-label="Prototype information">
      <span>Prototype mode: AGSA-backed extracted data, review overlays, and gated Treasury telemetry.</span>
      <Link href="/disclaimer">Read more</Link>
    </section>
  );
}
