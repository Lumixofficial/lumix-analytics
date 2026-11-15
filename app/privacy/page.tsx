import type { Metadata } from "next";
import { connection } from "next/server";
import { PageHeading } from "@/components/page-heading";
import { VisitorPrivacyControls } from "@/components/visitor-privacy-controls";
import { visitorConfig, visitorNotice, visitorStorageConfig } from "@/lib/visitors/config";

export const metadata: Metadata = { title: "Privacy" };

export default async function PrivacyPage() {
  await connection();
  const config = visitorConfig(), notice = visitorNotice(), storage = visitorStorageConfig();
  const estimation = config?.estimator.enabled === true;
  return (
    <div className="trade-container analytics-page">
      <PageHeading title="Privacy and visitor measurement" />
      <article className="privacy-copy">
        <p>{config ? config.localTest ? "Local test measurement is on. These counts are test data." :
          "Pageview measurement is on for this site." : "Visitor measurement is off. This site sends no visitor pageview events."}
          {config && (estimation ? " Daily visitor estimation is also on." : " Daily visitor estimation is off.")}</p>
        <VisitorPrivacyControls enabled={Boolean(config)} origin={config?.origin} />
        <section>
          <h2>What we count</h2>
          <p>When measurement is on, we count visits to Overview and Transactions by UTC day. We send only a pageview
            type, version, fixed site name, and one of those two page routes to our own server. Queries, fragments,
            unknown paths, Privacy, and admin pages are excluded.</p>
          <p>We do not collect wallet addresses, transaction hashes, account IDs, emails, form contents, referrers,
            financial actions, or browser characteristics for visitor measurement. Counts are separate from the
            public Mainnet swap statistics. We use no tracking cookies, cross-site tracking, or session replay.</p>
          <p>{estimation ? "To estimate repeat visits within a UTC day, the server briefly uses your IP address to form a coarse network prefix (IPv4 /24 or IPv6 /48). It combines that prefix with this site and a random daily key to create a temporary pseudonymous value. No raw IP, prefix, user-agent or per-visitor route history is stored in the visitor database. These values are pseudonymous, not anonymous." :
            "Daily estimation is off, so visitor measurement creates no visitor identifier. Pageview counts alone do not measure unique people."}</p>
          {estimation && <p>People sharing a network can count as one estimate. A network change can count someone again.
            This is an approximate daily network count, not a count of unique people. We do not combine daily estimates
            into weekly or monthly people counts.</p>}
        </section>
        <section>
          <h2>Purpose and retention</h2>
          <p>The purpose is to understand use of this website and improve it. Cookie-free measurement still has privacy
            and consent requirements; an exemption in one country does not establish an exemption everywhere.</p>
          {notice.exemption && !config?.localTest && <p>Operator’s stated consent basis: {notice.exemption}</p>}
          <p>For any necessary personal-data processing, the proposed basis is legitimate interests under Article 6(1)(f)
            GDPR or its applicable UK equivalent, subject to the operator’s assessment and visitors’ rights.</p>
          <p>Daily pageview totals expire {storage?.retentionDays ?? 30} days after their UTC day starts. Global abuse
            counters expire after two minutes. Individual pageview events are not stored.</p>
          {estimation && <p>Temporary network values, daily keys and estimation diagnostics expire at the next UTC midnight.
            They contain no page routes and are not used to recognize visitors on another day.</p>}
          <p>Automatic deletion normally follows expiry within about a minute and can take longer under load.</p>
        </section>
        <section>
          <h2>Network delivery and providers</h2>
          <p>Your IP address, user-agent and ordinary request headers necessarily reach the network and host that deliver
            this site. The visitor database does not retain raw addresses or headers. Any separate operational logs,
            backups and support access are handled by the operator and its providers.</p>
          <p>Hosting: {notice.hosting || "Provider and location have not been published."}</p>
          <p>Processors: {notice.processors || "Provider details have not been published."}</p>
          <p>International transfers: {notice.transfers || "Transfer details have not been published."}</p>
        </section>
        <section>
          <h2>Contact and your rights</h2>
          <p>Controller: {notice.controller || "The operator’s legal identity has not been published."}</p>
          <p>{notice.contact && /^[^\s@<>]+@[^\s@<>]+\.[^\s@<>]+$/.test(notice.contact) ?
            <>Privacy contact: <a href={`mailto:${notice.contact}`}>{notice.contact}</a>.</> : "A privacy contact has not been published."}</p>
          <p>You can object using the control above. Contact the controller about applicable access, correction, erasure,
            restriction and objection rights, or complain to your competent data-protection authority. Daily totals do
            not identify a particular person. We will not ask for extra identifying information to link someone to
            aggregate counts.</p>
        </section>
      </article>
    </div>
  );
}
