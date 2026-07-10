"use client";

import { usePathname } from "next/navigation";
import { MouseEvent, useEffect, useState } from "react";

function isModifiedClick(event: MouseEvent<Document>) {
  return event.metaKey || event.ctrlKey || event.shiftKey || event.altKey || event.button !== 0;
}

export function PageTransition() {
  const pathname = usePathname();
  const [pending, setPending] = useState(false);

  useEffect(() => {
    setPending(false);
    const timer = window.setTimeout(() => setPending(false), 160);
    return () => window.clearTimeout(timer);
  }, [pathname]);

  useEffect(() => {
    function onDocumentClick(event: globalThis.MouseEvent) {
      if (event.defaultPrevented || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey || event.button !== 0) return;
      const target = event.target instanceof Element ? event.target.closest("a") : null;
      if (!target) return;
      const href = target.getAttribute("href");
      const targetAttr = target.getAttribute("target");
      if (!href || href.startsWith("#") || href.startsWith("mailto:") || href.startsWith("tel:") || targetAttr === "_blank") return;

      const nextUrl = new URL(href, window.location.href);
      if (nextUrl.origin !== window.location.origin) return;
      if (nextUrl.pathname === window.location.pathname && nextUrl.search === window.location.search) return;

      setPending(true);
      window.setTimeout(() => setPending(false), 1600);
    }

    document.addEventListener("click", onDocumentClick, true);
    return () => document.removeEventListener("click", onDocumentClick, true);
  }, []);

  return (
    <div className={pending ? "page-transition is-active" : "page-transition"} aria-hidden="true">
      <span />
      <strong>Loading workspace</strong>
    </div>
  );
}
