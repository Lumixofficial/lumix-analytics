import type { Metadata, Viewport } from "next";
import "@fontsource-variable/inter";
import "./globals.css";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { connection } from "next/server";
import { VisitorAnalytics } from "@/components/visitor-analytics";
import { visitorConfig } from "@/lib/visitors/config";

export const metadata: Metadata = {
  title: { default: "Lumix Analytics", template: "%s | Lumix Analytics" },
  description: "Volume, swap count, and traction for spot swaps made through Lumix on Stellar.",
};

export const viewport: Viewport = {
  themeColor: "#0a0a0b",
  colorScheme: "dark",
};

export default async function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  // Read the fail-closed gate at runtime, including in a standalone Docker image.
  await connection();
  const visitors = visitorConfig();
  return (
    <html lang="en" data-theme="dark">
      <body>
        <div className="trade-app-shell analytics-shell">
          <a className="skip-link" href="#main">
            Skip to content
          </a>
          <SiteHeader />
          <main className="analytics-main" id="main">
            {children}
          </main>
          <SiteFooter />
        </div>
        {visitors ? <VisitorAnalytics origin={visitors.origin} /> : null}
      </body>
    </html>
  );
}
