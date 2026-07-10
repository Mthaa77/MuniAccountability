"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Archive,
  BarChart3,
  BriefcaseBusiness,
  ClipboardCheck,
  Database,
  FileText,
  Gauge,
  Landmark,
  Layers3,
  Menu,
  PanelRightOpen,
  Search,
  ShieldCheck,
  Siren,
  UsersRound,
  WandSparkles
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { apiGet } from "@/lib/client-api";
import type { SourceHealth } from "@/lib/types";
import { Dialog } from "@/components/ui/dialog";
import { Sheet } from "@/components/ui/sheet";
import { Command, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { Skeleton } from "@/components/ui/feedback";

const navGroups = [
  {
    label: "Command",
    eyebrow: "Live workspace",
    items: [
      { href: "/", label: "Overview", hint: "Executive cockpit", icon: Gauge, badge: "Core" },
      { href: "/intervention-queue", label: "Intervention Queue", hint: "Ranked risk worklist", icon: Siren, badge: "Priority" },
      { href: "/search", label: "Ask the Evidence", hint: "Source-locked search", icon: Search, badge: "Ctrl K" }
    ]
  },
  {
    label: "Evidence",
    eyebrow: "Source chain",
    items: [
      { href: "/municipalities", label: "Municipalities", hint: "Case-file directory", icon: Landmark },
      { href: "/findings", label: "Findings", hint: "AGSA issue register", icon: ClipboardCheck },
      { href: "/sources", label: "Source Vault", hint: "Provenance & freshness", icon: Database, badge: "Guarded" },
      { href: "/admin/data-quality", label: "Data Quality", hint: "Validation console", icon: ShieldCheck }
    ]
  },
  {
    label: "Workflow",
    eyebrow: "Execution layer",
    items: [
      { href: "/actions", label: "Action Board", hint: "Evidence lifecycle", icon: ClipboardCheck },
      { href: "/recovery", label: "Recovery Room", hint: "Weekly rhythm", icon: BriefcaseBusiness },
      { href: "/briefings", label: "Briefings", hint: "Decision packs", icon: FileText, badge: "Build" },
      { href: "/financial-pulse", label: "Financial Pulse", hint: "Treasury-gated telemetry", icon: BarChart3, badge: "Locked" }
    ]
  },
  {
    label: "Public",
    eyebrow: "Citizen layer",
    items: [
      { href: "/municheck", label: "MuniCheck", hint: "Plain-language profiles", icon: ShieldCheck },
      { href: "/munidata", label: "MuniData", hint: "API and export catalogue", icon: Archive }
    ]
  },
  {
    label: "System",
    eyebrow: "Controls",
    items: [
      { href: "/admin", label: "Admin", hint: "Readiness gate-room", icon: Layers3, badge: "Gate" },
      { href: "/docs-api", label: "API Docs", hint: "OpenAPI contract", icon: UsersRound }
    ]
  }
];

const quickActions = [
  { href: "/intervention-queue", label: "Open intervention queue", hint: "Ranked AGSA-backed worklist" },
  { href: "/actions", label: "Review action board", hint: "Workflow and evidence lifecycle" },
  { href: "/briefings", label: "Generate weekly brief", hint: "Source-cited briefing workspace" },
  { href: "/sources", label: "Inspect source vault", hint: "Freshness, gates, and guardrails" },
  { href: "/admin/agsa-review", label: "Resolve AGSA review issues", hint: "Publication blockers and corrections" }
];

function isActive(pathname: string, href: string) {
  if (href === "/") return pathname === "/";
  return pathname === href || pathname.startsWith(`${href}/`);
}

function NavigationContent({ pathname, onNavigate, sourceState, healthLabel }: { pathname: string; onNavigate?: () => void; sourceState?: "loading" | "ready" | "error"; healthLabel?: string }) {
  return (
    <>
      <div className="sidebar-topline">
        <Link href="/" className="brand-lockup premium-brand nav-brand-card" onClick={onNavigate}>
          <div className="brand-mark">MA</div>
          <div className="nav-brand-copy">
            <strong>MuniAtlas</strong>
            <span>Evidence Command</span>
          </div>
        </Link>
      </div>

      <div className="nav-command-card" aria-label="Navigation status">
        <div>
          <span className="nav-command-kicker">Command status</span>
          <strong>{healthLabel ?? "Source-aware workspace"}</strong>
        </div>
        <span className={`nav-status-light ${sourceState ?? "ready"}`} />
      </div>

      <nav className="nav-groups" aria-label="Primary sections">
        {navGroups.map((group) => {
          const groupActive = group.items.some((item) => isActive(pathname, item.href));
          return (
            <section className={groupActive ? "nav-group active-group" : "nav-group"} key={group.label}>
              <div className="nav-group-heading">
                <span>{group.label}</span>
                <small>{group.eyebrow}</small>
              </div>
              <div className="nav-group-links">
                {group.items.map((item) => {
                  const Icon = item.icon;
                  const active = isActive(pathname, item.href);
                  return (
                    <Link
                      href={item.href}
                      key={item.href}
                      className={active ? "active nav-item" : "nav-item"}
                      aria-current={active ? "page" : undefined}
                      onClick={onNavigate}
                    >
                      <span className="nav-item-icon"><Icon size={17} /></span>
                      <span className="nav-item-copy">
                        <strong>{item.label}</strong>
                        <small>{item.hint}</small>
                      </span>
                      {item.badge ? <span className="nav-item-badge">{item.badge}</span> : null}
                    </Link>
                  );
                })}
              </div>
            </section>
          );
        })}
      </nav>

      <div className="sidebar-card evidence-lock nav-footer-card">
        <div>
          <span className="nav-command-kicker">Evidence thread</span>
          <strong>Claim discipline active</strong>
        </div>
        <p>Every publishable claim should trace back to a source, review state and confidence signal.</p>
        <div className="nav-footer-actions">
          <Link href="/sources" onClick={onNavigate}>Source Vault</Link>
          <Link href="/admin" onClick={onNavigate}>Gate Room</Link>
        </div>
      </div>
    </>
  );
}

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);
  const [commandOpen, setCommandOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [sourceState, setSourceState] = useState<"loading" | "ready" | "error">("loading");
  const [sources, setSources] = useState<SourceHealth[]>([]);
  const commandItems = useMemo(
    () =>
      [...navGroups.flatMap((group) => group.items.map((item) => ({ ...item, hint: `${group.label} / ${item.hint}` }))), ...quickActions].filter((item) =>
        `${item.label} ${item.hint}`.toLowerCase().includes(query.toLowerCase())
      ),
    [query]
  );
  const degradedCount = sources.filter((source) => source.status !== "healthy").length;
  const healthLabel = sourceState === "loading" ? "Loading source health" : sourceState === "error" ? "Source status unavailable" : degradedCount ? `${degradedCount} source gate(s)` : "Sources healthy";

  useEffect(() => {
    const controller = new AbortController();

    apiGet<{ sources?: SourceHealth[] }>("/v1/sources", controller.signal)
      .then((payload) => {
        setSources(payload.data.sources ?? []);
        setSourceState("ready");
      })
      .catch(() => setSourceState("error"));

    return () => controller.abort();
  }, []);

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        setCommandOpen(true);
      }
    }

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  return (
    <main className="premium-shell atlas-shell">
      <aside className="premium-sidebar atlas-sidebar" aria-label="Primary navigation">
        <NavigationContent pathname={pathname} sourceState={sourceState} healthLabel={healthLabel} />
      </aside>

      <div className="premium-workspace atlas-workspace">
        <header className="topbar premium-topbar atlas-topbar">
          <button className="icon-button mobile-menu" aria-label="Open menu" onClick={() => setMenuOpen(true)}>
            <Menu size={18} />
          </button>
          <div>
            <p className="eyeless">Source-backed municipal intelligence</p>
            <h1>MuniAccountability Atlas</h1>
          </div>
          <div className="top-actions" aria-label="Workspace controls">
            <button className="command-trigger" aria-label="Open command search" onClick={() => setCommandOpen(true)}>
              <Search size={18} />
              <span>Search command</span>
              <kbd>Ctrl K</kbd>
            </button>
            <div className={`source-pill ${sourceState}`}>
              {sourceState === "loading" ? <Skeleton className="source-skeleton" /> : <span />}
              <strong>{healthLabel}</strong>
            </div>
            <Link className="secondary-action glass-action" href="/sources">
              <PanelRightOpen size={17} />
              Source vault
            </Link>
            <Link className="primary-action glass-action" href="/briefings">
              <WandSparkles size={17} />
              Generate brief
            </Link>
          </div>
        </header>
        {children}
      </div>

      <Sheet open={menuOpen} onOpenChange={setMenuOpen} title="MuniAtlas navigation">
        <div className="mobile-nav-panel">
          <NavigationContent pathname={pathname} onNavigate={() => setMenuOpen(false)} sourceState={sourceState} healthLabel={healthLabel} />
        </div>
      </Sheet>

      <Dialog open={commandOpen} onOpenChange={setCommandOpen} title="Command palette" className="command-dialog">
        <Command>
          <CommandInput
            autoFocus
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search routes, workflows, source gates..."
          />
          <CommandList>
            <CommandGroup>
              {commandItems.map((item) => (
                <CommandItem key={`${item.href}-${item.label}`}>
                  <Link href={item.href} onClick={() => setCommandOpen(false)}>
                    <strong>{item.label}</strong>
                    <span>{item.hint}</span>
                  </Link>
                </CommandItem>
              ))}
              {!commandItems.length ? <div className="command-empty">No matching command.</div> : null}
            </CommandGroup>
          </CommandList>
        </Command>
      </Dialog>
    </main>
  );
}
