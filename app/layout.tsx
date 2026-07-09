import type { Metadata } from "next";
import { AppShell } from "@/components/app-shell";
import { PrototypeNotice } from "@/components/prototype-notice";
import "./globals.css";

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
