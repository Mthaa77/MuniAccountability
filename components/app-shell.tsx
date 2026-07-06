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
  Search,
  ShieldCheck,
  Siren,
  UsersRound,
  X
} from "lucide-react";
import { useState } from "react";

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

function isActive(pathname: string, href: string) {
  if (href === "/") return pathname === "/";
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  return (
    <main className="premium-shell">
      <aside className={`premium-sidebar ${open ? "open" : ""}`} aria-label="Primary navigation">
        <div className="sidebar-topline">
          <Link href="/" className="brand-lockup" onClick={() => setOpen(false)}>
            <div className="brand-mark">MC</div>
            <div>
              <strong>MuniCommand</strong>
              <span>Oversight OS</span>
            </div>
          </Link>
          <button className="mobile-close" aria-label="Close menu" onClick={() => setOpen(false)}>
            <X size={18} />
          </button>
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
                    onClick={() => setOpen(false)}
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
      </aside>

      <div className="premium-workspace">
        <header className="topbar premium-topbar">
          <button className="icon-button mobile-menu" aria-label="Open menu" onClick={() => setOpen(true)}>
            <Menu size={18} />
          </button>
          <div>
            <p className="eyeless">Provincial Treasury pilot workspace</p>
            <h1>MuniAccountability Command</h1>
          </div>
          <div className="top-actions" aria-label="Workspace controls">
            <button className="icon-button" aria-label="Search">
              <Search size={18} />
            </button>
            <button className="secondary-action">AGSA verified</button>
            <button className="primary-action">Generate brief</button>
          </div>
        </header>
        {children}
      </div>
    </main>
  );
}
