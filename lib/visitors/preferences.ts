export const OPT_OUT_KEY = "lumix:visitor-opt-out";

declare global {
  interface Window { __lumixVisitorOptOut?: boolean; doNotTrack?: string }
  interface Navigator { readonly globalPrivacyControl?: boolean }
}

export function privacyPreference(): "loading" | "blocked" | "out" | "available" {
  const reason = privacyBlockReason();
  return reason === "gpc" || reason === "dnt" || reason === "storage" ? "blocked" : reason;
}

export function privacyBlockReason(): "gpc" | "dnt" | "storage" | "out" | "available" {
  if (navigator.globalPrivacyControl === true) return "gpc";
  if (navigator.doNotTrack === "1" || navigator.doNotTrack === "yes" || window.doNotTrack === "1") return "dnt";
  if (window.__lumixVisitorOptOut) return "out";
  try { return localStorage.getItem(OPT_OUT_KEY) !== null ? "out" : "available"; }
  catch { return "storage"; }
}

export function setVisitorOptOut(optOut: boolean): boolean {
  // If storage fails, keep the objection effective in this document.
  window.__lumixVisitorOptOut = optOut;
  let saved = true;
  try {
    if (optOut) localStorage.setItem(OPT_OUT_KEY, "1");
    else localStorage.removeItem(OPT_OUT_KEY);
  } catch { saved = false; }
  window.dispatchEvent(new Event("lumix:privacy"));
  return saved;
}
