import * as React from "react";
import { cn } from "@/lib/cn";

export function Tooltip({ className, label, children }: { className?: string; label: string; children: React.ReactNode }) {
  return (
    <span className={cn("ui-tooltip", className)}>
      {children}
      <span role="tooltip">{label}</span>
    </span>
  );
}
