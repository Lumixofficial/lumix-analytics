import type { ReactNode, SVGProps } from "react";

export type IconName =
  | "arrow-right"
  | "chevron-down"
  | "chevron-left"
  | "chevron-right"
  | "copy"
  | "check"
  | "close"
  | "external"
  | "info"
  | "refresh"
  | "route"
  | "search"
  | "sliders";

type IconProps = SVGProps<SVGSVGElement> & { name: IconName; size?: number };

const paths: Record<IconName, ReactNode> = {
  "arrow-right": <><path d="M4 12h15" /><path d="m13.5 6.5 5.5 5.5-5.5 5.5" /></>,
  "chevron-down": <path d="m7 9 5 5 5-5" />,
  "chevron-left": <path d="m15 6-6 6 6 6" />,
  "chevron-right": <path d="m9 6 6 6-6 6" />,
  copy: <><rect x="8" y="8" width="12" height="12" rx="2" /><path d="M16 8V4H4v12h4" /></>,
  check: <path d="m5 12 4 4L19 6" />,
  close: <><path d="m6 6 12 12" /><path d="m18 6-12 12" /></>,
  external: <><path d="M14 4h6v6" /><path d="m20 4-9 9" /><path d="M18 13v6a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1h6" /></>,
  info: <><circle cx="12" cy="12" r="9" /><path d="M12 11v6" /><path d="M12 7h.01" /></>,
  refresh: <><path d="M20 7v5h-5" /><path d="M4 17v-5h5" /><path d="M6.1 8A7 7 0 0 1 18 6l2 6" /><path d="M17.9 16A7 7 0 0 1 6 18l-2-6" /></>,
  route: <><circle cx="5" cy="6" r="2" /><circle cx="19" cy="18" r="2" /><path d="M7 6h5a3 3 0 0 1 3 3v0a3 3 0 0 1-3 3h0a3 3 0 0 0-3 3v0a3 3 0 0 0 3 3h5" /></>,
  search: <><circle cx="11" cy="11" r="7" /><path d="m20 20-4-4" /></>,
  sliders: <><path d="M4 7h9" /><path d="M17 7h3" /><circle cx="15" cy="7" r="2" /><path d="M4 17h3" /><path d="M11 17h9" /><circle cx="9" cy="17" r="2" /></>,
};

export function Icon({ name, size = 18, ...props }: IconProps) {
  return (
    <svg
      aria-hidden="true"
      fill="none"
      focusable="false"
      height={size}
      viewBox="0 0 24 24"
      width={size}
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="1.7"
      {...props}
    >
      {paths[name]}
    </svg>
  );
}
