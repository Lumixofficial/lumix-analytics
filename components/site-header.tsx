"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import icon from "../design-system/assets/lumix-logo-icon-white.png";
import wordmark from "../design-system/assets/lumix-logo-type-white.png";
import { Icon } from "./icon";

const NAVIGATION = [
  { label: "Overview", href: "/" },
  { label: "Transactions", href: "/transactions" },
] as const;

export function SiteHeader() {
  const pathname = usePathname();
  const isActive = (href: string) => (href === "/" ? pathname === "/" : pathname.startsWith(href));

  return (
    <header className="trade-app-header" aria-label="Application header">
      <div className="trade-header-inner trade-header-primary">
        <Link className="trade-brand-slot analytics-brand" href="/" aria-label="Lumix Analytics overview">
          <Image className="lumix-wordmark" src={wordmark} alt="" aria-hidden="true" priority />
          <Image className="lumix-app-icon" src={icon} alt="" aria-hidden="true" priority />
          <span className="analytics-brand-divider" aria-hidden="true" />
          <span className="analytics-brand-label">Analytics</span>
        </Link>

        <div className="header-flex-spacer" aria-hidden="true" />

        <a
          className="trade-button trade-button--secondary trade-button--sm header-launch"
          href="https://app.lumixmarket.com"
          target="_blank"
          rel="noopener noreferrer"
        >
          Launch app
          <Icon name="external" size={13} />
        </a>
      </div>

      <nav className="trade-nav trade-header-inner trade-header-navigation header-product-nav" aria-label="Analytics navigation">
        {NAVIGATION.map((item) => (
          <Link
            key={item.href}
            className={isActive(item.href) ? "is-active" : undefined}
            href={item.href}
            aria-current={isActive(item.href) ? "page" : undefined}
          >
            {item.label}
          </Link>
        ))}
      </nav>
    </header>
  );
}
