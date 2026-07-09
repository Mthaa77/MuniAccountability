import * as React from "react";
import { cn } from "@/lib/cn";

export function TabsList({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("ui-tabs-list", className)} role="tablist" {...props} />;
}

export function TabsTrigger({ className, active, ...props }: React.ButtonHTMLAttributes<HTMLButtonElement> & { active?: boolean }) {
  return <button className={cn("ui-tabs-trigger", active && "active", className)} role="tab" aria-selected={active} {...props} />;
}
