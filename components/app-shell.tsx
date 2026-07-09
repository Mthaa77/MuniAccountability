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
import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { Sheet } from "@/components/ui/sheet";
import { Command, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { Skeleton } from "@/components/ui/feedback";

const navGroups = [
  {
    label: "Operate",
    items: [
      { href: "/", label: "Command Centre", icon: Gauge },
      { href: "/municipalities", label: "Municipalities", icon: Landmark },
      { href: "/intervention-queue", label: "Intervention Queue", icon: Siren },
      { href: "/actions", label: "Actions", icon: ClipboardCheck }
    ]
  },
  {
    label: "Analyse",
    items: [
      { href: "/recovery", label: "Recovery War Room", icon: BriefcaseBusiness },
      { href: "/financial-pulse", label: "Financial Pulse", icon: BarChart3 },
      { href: "/briefings", label: "Briefings", icon: FileText },
      { href: "/search", label: "Evidence Search", icon: Search },
      { href: "/sources", label: "Sources", icon: Database }
    ]
  },
  {
    label: "Distribute",
    items: [
      { href: "/municheck", label: "MuniCheck", icon: ShieldCheck },
      { href: "/munidata", label: "MuniData", icon: Archive },
      { href: "/admin", label: "Admin", icon: Layers3 }
    ]
  }
];

const quickActions = [
  { href: "/intervention-queue", label: "Open intervention queue", hint: "Ranked AGSA-backed worklist" },
  { href: "/actions", label: "Review action board", hint: "Workflow and evidence lifecycle" },
  { href: "/briefings", label: "Generate weekly brief", hint: "Source-cited briefing workspace" },
  { href: "/sources", label: "Inspect source health", hint: "Freshness, gates, and guardrails" },
  { href: "/admin/agsa-review", label: "Resolve AGSA review issues", hint: "Publication blockers and corrections" }
];

function isActive(pathname: string, href: string) {
  if (href === "/") return pathname === "/";
  return pathname === href || pathname.startsWith(`${href}/`);
}

function NavigationContent({ pathname, onNavigate }: { pathname: string; onNavigate?: () => void }) {
  return (
    <>
      <div className="sidebar-topline">
        <Link href="/" className="brand-lockup premium-brand" onClick={onNavigate}>
          <div className="brand-mark">MC</div>
          <div>
            <strong>MuniCommand</strong>
            <span>Oversight OS</span>
          </div>
        </Link>
      </div>
      <nav className="nav-groups">
        {navGroups.map((group) => (
          <div className="nav-group" key={group.label}>
            <span>{group.label}</span>
            {group.items.map((item) => {
              const Icon = item.icon;
              return (
                <Link
                  href={item.href}
                  key={item.href}
                  className={isActive(pathname, item.href) ? "active" : ""}
                  onClick={onNavigate}
                >
                  <Icon size={17} />
                  {item.label}
                </Link>
              );
            })}
          </div>
        ))}
      </nav>
      <div className="sidebar-card evidence-lock">
        <strong>Evidence guardrail</strong>
        <span>No source, no assertion. Treasury telemetry remains pending validation.</span>
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
      [...navGroups.flatMap((group) => group.items.map((item) => ({ ...item, hint: group.label }))), ...quickActions].filter((item) =>
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
    <main className="premium-shell">
      <aside className="premium-sidebar" aria-label="Primary navigation">
        <NavigationContent pathname={pathname} />
      </aside>

      <div className="premium-workspace">
        <header className="topbar premium-topbar">
          <button className="icon-button mobile-menu" aria-label="Open menu" onClick={() => setMenuOpen(true)}>
            <Menu size={18} />
          </button>
          <div>
            <p className="eyeless">Provincial Treasury pilot workspace</p>
            <h1>MuniAccountability Command</h1>
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
              Source gates
            </Link>
            <Link className="primary-action glass-action" href="/briefings">
              <WandSparkles size={17} />
              Generate brief
            </Link>
          </div>
        </header>
        {children}
      </div>

      <Sheet open={menuOpen} onOpenChange={setMenuOpen} title="MuniCommand navigation">
        <div className="mobile-nav-panel">
          <NavigationContent pathname={pathname} onNavigate={() => setMenuOpen(false)} />
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
