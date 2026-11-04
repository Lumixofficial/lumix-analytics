"use client";

import { createContext, use, useTransition, type ReactNode, type TransitionStartFunction } from "react";

const PendingContext = createContext<{ startTransition: TransitionStartFunction; pending: boolean } | null>(null);

/** Wraps a page so URL-driven controls can dim stale data while the next server render streams in. */
export function PendingRegion({ children, className }: { children: ReactNode; className?: string }) {
  const [pending, startTransition] = useTransition();
  return (
    <PendingContext value={{ startTransition, pending }}>
      <div className={className} data-pending={pending ? "" : undefined} aria-busy={pending || undefined}>
        {children}
      </div>
    </PendingContext>
  );
}

export function usePendingTransition() {
  const context = use(PendingContext);
  if (!context) throw new Error("usePendingTransition must be used inside PendingRegion");
  return context.startTransition;
}

export function PendingContent({ children, fallback }: { children: ReactNode; fallback: ReactNode }) {
  const context = use(PendingContext);
  if (!context) throw new Error("PendingContent must be used inside PendingRegion");
  return context.pending ? fallback : children;
}
