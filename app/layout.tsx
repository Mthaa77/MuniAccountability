import type { Metadata } from "next";
import { AppShell } from "@/components/app-shell";
import { PrototypeNotice } from "@/components/prototype-notice";
import "./globals.css";
import "@/components/atlas/atlas.css";
import "@/components/atlas/atlas-pages.css";
import "@/components/atlas/atlas-public.css";
import "@/components/atlas/atlas-admin.css";
import "@/components/atlas/atlas-workflow.css";
import "@/components/atlas/atlas-rescue.css";
import "@/components/atlas/atlas-responsive.css";
import "@/components/atlas/atlas-nav.css";
import "@/components/atlas/atlas-cockpit.css";
import "@/components/atlas/atlas-type.css";
import "@/components/atlas/atlas-components.css";
import "@/components/atlas/atlas-access.css";
import "@/components/atlas/atlas-assistant.css";
import "@/components/atlas/atlas-assistant-mobile-fix.css";
import "@/components/atlas/atlas-action-studio.css";
import "@/components/atlas/atlas-motion.css";
import "@/components/atlas/atlas-action-studio-rescue.css";
import "@/components/atlas/atlas-evidence-drawer.css";

export const metadata: Metadata = {
  title: "MuniAccountability Command",
  description: "Municipal oversight, intervention and recovery operating system."
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <PrototypeNotice />
        <AppShell>{children}</AppShell>
      </body>
    </html>
  );
}
