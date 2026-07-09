import * as React from "react";
import { cn } from "@/lib/cn";

export function Command({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("ui-command", className)} {...props} />;
}

export function CommandInput(props: React.InputHTMLAttributes<HTMLInputElement>) {
  return <input className="ui-command-input" {...props} />;
}

export function CommandList({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("ui-command-list", className)} {...props} />;
}

export function CommandGroup({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("ui-command-group", className)} {...props} />;
}

export function CommandItem({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("ui-command-item", className)} {...props} />;
}
