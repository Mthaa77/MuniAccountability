"use client";

import * as React from "react";
import { cn } from "@/lib/cn";

export function DropdownMenu({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("ui-dropdown", className)} {...props} />;
}

export function DropdownMenuTrigger({ className, ...props }: React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return <button className={cn("ui-dropdown-trigger", className)} {...props} />;
}

export function DropdownMenuContent({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("ui-dropdown-content", className)} {...props} />;
}

export function DropdownMenuItem({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("ui-dropdown-item", className)} role="menuitem" {...props} />;
}
