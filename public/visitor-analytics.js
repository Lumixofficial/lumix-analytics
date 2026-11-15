/* First-party pageviews. No browser identifiers, tracking cookies, or event queue. */
(function () {
  "use strict";
  var script = document.currentScript;
  if (!script || script.dataset.site !== "lumix-analytics" || window.__lumixVisitorLoaded || window.top !== window.self) return;
  if (script.dataset.origin && script.dataset.origin !== location.origin) return;
  window.__lumixVisitorLoaded = true;
  var lastRoute;
  var active = new Set();
  var routes = ["/", "/transactions"];

  function blocked() {
    if (window.__lumixVisitorOptOut || navigator.globalPrivacyControl === true ||
        navigator.doNotTrack === "1" || navigator.doNotTrack === "yes" || window.doNotTrack === "1") return true;
    try { return localStorage.getItem("lumix:visitor-opt-out") !== null; }
    catch { return true; }
  }

  function record() {
    var route = location.pathname.replace(/\/+$/, "") || "/";
    if (routes.indexOf(route) === -1) { lastRoute = null; return; }
    if (blocked() || document.visibilityState !== "visible" || document.prerendering || route === lastRoute) return;
    lastRoute = route;
    // Only canonical route constants enter the event; never location.href/search/hash.
    route = routes[routes.indexOf(route)];
    var controller = new AbortController();
    active.add(controller);
    var timer = setTimeout(function () { controller.abort(); }, 2000);
    try {
      fetch("/api/visitors", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ v: 1, type: "pageview", site: "lumix-analytics", route: route }),
        credentials: "omit", referrerPolicy: "no-referrer", cache: "no-store",
        keepalive: true, mode: "same-origin", signal: controller.signal
      }).catch(function () {}).finally(function () { clearTimeout(timer); active.delete(controller); });
    } catch { clearTimeout(timer); active.delete(controller); }
    // No retries: failures undercount rather than risking duplicates or persistent queues.
  }

  function privacyChanged() {
    if (blocked()) active.forEach(function (controller) { controller.abort(); });
  }
  window.addEventListener("lumix:route", record);
  window.addEventListener("lumix:privacy", privacyChanged);
  window.addEventListener("storage", privacyChanged);
  document.addEventListener("visibilitychange", record);
  record();
})();
