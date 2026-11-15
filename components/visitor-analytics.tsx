"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import Script from "next/script";

export function VisitorAnalytics({ origin }: { origin: string }) {
  const pathname = usePathname();
  useEffect(() => {
    // No route value crosses the bridge. The external script selects constants.
    window.dispatchEvent(new Event("lumix:route"));
  }, [pathname]);

  return <Script id="lumix-visitors" src="/visitor-analytics.js" strategy="afterInteractive" async
    data-site="lumix-analytics" data-origin={origin} referrerPolicy="no-referrer" />;
}
