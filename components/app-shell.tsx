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
    eyebrow: "Start here",
    items: [
      { href: "/", label: "Home", hint: "What needs attention today", icon: Gauge, badge: "Main" },
      { href: "/intervention-queue", label: "Priority Queue", hint: "Ranked risks and next steps", icon: Siren, badge: "Urgent" },
      { href: "/search", label: "Find Evidence", hint: "Search sources before you claim", icon: Search, badge: "Ctrl K" }
    ]
  },
  {
    label: "Evidence",
    eyebrow: "Proof first",
    items: [
      { href: "/municipalities", label: "Municipalities", hint: "Open a municipal case file", icon: Landmark },
      { href: "/findings", label: "Audit Findings", hint: "Issues found in the source reports", icon: ClipboardCheck },
      { href: "/sources", label: "Source Library", hint: "Documents, freshness and proof", icon: Database, badge: "Proof" },
      { href: "/admin/data-quality", label: "Data Checks", hint: "What still needs review", icon: ShieldCheck }
    ]
  },
  {
    label: "Workflow",
    eyebrow: "Get work done",
    items: [
      { href: "/actions", label: "Action Board", hint: "Track owners, evidence and review", icon: ClipboardCheck },
      { href: "/recovery", label: "Recovery Room", hint: "Follow turnaround milestones", icon: BriefcaseBusiness },
      { href: "/briefings", label: "Briefing Builder", hint: "Create clear decision packs", icon: FileText, badge: "Build" },
      { href: "/financial-pulse", label: "Financial Pulse", hint: "Locked until numbers are verified", icon: BarChart3, badge: "Locked" }
    ]
  },
  {
    label: "Public",
    eyebrow: "Share safely",
    items: [
      { href: "/municheck", label: "MuniCheck", hint: "Public-friendly audit profiles", icon: ShieldCheck },
      { href: "/munidata", label: "MuniData", hint: "API routes and exports", icon: Archive }
    ]
  },
  {
    label: "System",
    eyebrow: "Admin",
    items: [
      { href: "/admin", label: "Readiness Gate", hint: "Production checks and blockers", icon: Layers3, badge: "Gate" },
      { href: "/docs-api", label: "API Docs", hint: "How integrations should connect", icon: UsersRound }
    ]
  }
];

const quickActions = [
  { href: "/intervention-queue", label: "See what needs attention", hint: "Open the ranked municipal risk queue" },
  { href: "/actions", label: "Check action progress", hint: "Review owners, evidence and approvals" },
  { href: "/briefings", label: "Build a briefing", hint: "Prepare a source-backed decision pack" },
  { href: "/sources", label: "Verify a source", hint: "Check documents, freshness and review state" },
  { href: "/admin/agsa-review", label: "Review extraction issues", hint: "Fix low-confidence source text before publishing" }
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
            <span>Municipal Accountability Command</span>
          </div>
        </Link>
      </div>

      <div className="nav-command-card" aria-label="Navigation status">
        <div>
          <span className="nav-command-kicker">System status</span>
          <strong>{healthLabel ?? "Checking source health"}</strong>
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
          <span className="nav-command-kicker">Trust rule</span>
          <strong>No proof, no public claim</strong>
        </div>
        <p>Before anything is published, it should have a source, a review state and a clear confidence signal.</p>
        <div className="nav-footer-actions">
          <Link href="/sources" onClick={onNavigate}>Sources</Link>
          <Link href="/admin" onClick={onNavigate}>Readiness</Link>
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
  const healthLabel = sourceState === "loading" ? "Checking sources" : sourceState === "error" ? "Source status unavailable" : degradedCount ? `${degradedCount} source gate(s) need review` : "Sources look healthy";

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

      <button className="nav-float-button" aria-label="Open navigation menu" onClick={() => setMenuOpen(true)}>
        <Menu size={17} />
        <span>Menu</span>
      </button>

      <div className="premium-workspace atlas-workspace">
        <header className="topbar premium-topbar atlas-topbar">
          <button className="icon-button mobile-menu" aria-label="Open menu" onClick={() => setMenuOpen(true)}>
            <Menu size={18} />
          </button>
          <div>
            <p className="eyeless">Source-backed municipal oversight</p>
            <h1>MuniAccountability Command</h1>
          </div>
          <div className="top-actions" aria-label="Workspace controls">
            <button className="command-trigger" aria-label="Open command search" onClick={() => setCommandOpen(true)}>
              <Search size={18} />
              <span>Search pages and evidence</span>
              <kbd>Ctrl K</kbd>
            </button>
            <div className={`source-pill ${sourceState}`}>
              {sourceState === "loading" ? <Skeleton className="source-skeleton" /> : <span />}
              <strong>{healthLabel}</strong>
            </div>
            <Link className="secondary-action glass-action" href="/sources">
              <PanelRightOpen size={17} />
              Check sources
            </Link>
            <Link className="primary-action glass-action" href="/briefings">
              <WandSparkles size={17} />
              Build briefing
            </Link>
          </div>
        </header>
        {children}
      </div>

      <Sheet open={menuOpen} onOpenChange={setMenuOpen} title="MuniAtlas menu">
        <div className="mobile-nav-panel">
          <NavigationContent pathname={pathname} onNavigate={() => setMenuOpen(false)} sourceState={sourceState} healthLabel={healthLabel} />
        </div>
      </Sheet>

      <Dialog open={commandOpen} onOpenChange={setCommandOpen} title="Search the command centre" className="command-dialog">
        <Command>
          <CommandInput
            autoFocus
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search pages, sources, workflows or review gates..."
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
              {!commandItems.length ? <div className="command-empty">No match yet. Try “sources”, “briefing”, “audit” or “queue”.</div> : null}
            </CommandGroup>
          </CommandList>
        </Command>
      </Dialog>
    </main>
  );
}
