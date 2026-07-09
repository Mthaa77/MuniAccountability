"use client";

import * as React from "react";
import { X } from "lucide-react";
import { cn } from "@/lib/cn";

type SheetProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  children: React.ReactNode;
  className?: string;
};

export function Sheet({ open, onOpenChange, title, children, className }: SheetProps) {
  React.useEffect(() => {
    if (!open) return;
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") onOpenChange(false);
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [onOpenChange, open]);

  if (!open) return null;

  return (
    <div className="ui-sheet-root" role="presentation" onMouseDown={() => onOpenChange(false)}>
      <aside
        aria-modal="true"
        className={cn("ui-sheet-content", className)}
        role="dialog"
        onMouseDown={(event) => event.stopPropagation()}
      >
        <div className="ui-dialog-header">
          <h2>{title}</h2>
          <button className="ui-icon-button" aria-label="Close" onClick={() => onOpenChange(false)}>
            <X size={18} />
          </button>
        </div>
        {children}
      </aside>
    </div>
  );
}
