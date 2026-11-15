"use client";

import { useState, useSyncExternalStore } from "react";
import { privacyBlockReason, setVisitorOptOut } from "@/lib/visitors/preferences";

function subscribe(notify: () => void) {
  window.addEventListener("storage", notify);
  window.addEventListener("lumix:privacy", notify);
  return () => {
    window.removeEventListener("storage", notify);
    window.removeEventListener("lumix:privacy", notify);
  };
}

export function VisitorPrivacyControls({ enabled = false, origin }: { enabled?: boolean; origin?: string }) {
  const preference = useSyncExternalStore(subscribe,
    () => origin && location.origin !== origin ? "origin" : privacyBlockReason(), () => "loading");
  const [message, setMessage] = useState("");
  function choose(optOut: boolean) {
    const saved = setVisitorOptOut(optOut);
    setMessage(saved ? (optOut ? "Your objection is saved for this browser." : "Your saved objection has been removed.") :
      optOut ? "Your objection is active in this page, but this browser could not save it for later visits. Use Global Privacy Control or Do Not Track to block future visits, or enable preference storage." :
        "Your browser could not remove the saved objection. Visitor measurement remains blocked.");
  }
  return (
    <section aria-labelledby="visitor-choice" className="privacy-choice">
      <h2 id="visitor-choice">Your choice</h2>
      <p>{preference === "loading" ? "Checking this browser’s privacy preference…" :
        preference === "gpc" ? "Collection is blocked because Global Privacy Control is enabled in this browser." :
        preference === "dnt" ? "Collection is blocked because Do Not Track is enabled in this browser." :
        preference === "storage" ? "Collection is blocked because this browser cannot read privacy preference storage." :
        preference === "origin" ? "Collection is blocked because this address is not the configured measurement site." :
        preference === "out" ? "You have objected to visitor measurement in this browser." :
        enabled ? "No browser objection is active. You can stop visitor measurement here, free of charge." :
          "Collection is off on this deployment. You can still save an objection for future visits."}</p>
      <div className="privacy-actions">
        <button type="button" className="trade-button trade-button--secondary" disabled={preference === "loading" || preference === "out"}
          onClick={() => choose(true)}>Object to visitor measurement</button>
        {preference === "out" && <button type="button" className="trade-button trade-button--ghost" onClick={() => choose(false)}>
          Remove my saved objection
        </button>}
      </div>
      <p role="status" aria-live="polite">{message}</p>
      <p>This choice uses only a local privacy preference, without an identifier. It applies to this browser and site;
        clearing site storage removes it. We also respect Global Privacy Control and Do Not Track.
        Removing an objection does not enable a deployment whose collection is disabled.</p>
      <noscript><p>JavaScript is disabled, so no browser pageview events are sent.</p></noscript>
    </section>
  );
}
