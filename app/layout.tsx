import type { Metadata, Viewport } from "next";
import "@fontsource-variable/inter";
import "./globals.css";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";

export const metadata: Metadata = {
  title: { default: "Lumix Analytics", template: "%s | Lumix Analytics" },
  description: "Volume, swap count, and traction for spot swaps made through Lumix on Stellar.",
};

export const viewport: Viewport = {
  themeColor: "#0a0a0b",
  colorScheme: "dark",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
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
      </body>
    </html>
  );
}
