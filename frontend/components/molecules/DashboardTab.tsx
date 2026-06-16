import Link from "next/link";
import type { CSSProperties } from "react";

type DashboardTabProps = {
  href: string;
  icon?: string;
  isActive?: boolean;
  label: string;
};

function DashboardTabIcon({ icon, label }: Pick<DashboardTabProps, "icon" | "label">) {
  if (!icon) {
    return (
      <span
        aria-hidden="true"
        className="flex h-9 w-9 items-center justify-center rounded-md bg-idfm-medium text-sm font-bold text-idfm-focus"
      >
        {label.slice(0, 1)}
      </span>
    );
  }

  const maskStyle = {
    WebkitMaskImage: `url("${icon}")`,
    maskImage: `url("${icon}")`,
  } satisfies CSSProperties;

  return (
    <span
      aria-hidden="true"
      className="h-9 w-9 bg-idfm-interaction [mask-position:center] [mask-repeat:no-repeat] [mask-size:contain]"
      style={maskStyle}
    />
  );
}

export function DashboardTab({ href, icon, isActive = false, label }: DashboardTabProps) {
  return (
    <Link
      href={href}
      className={`group flex min-w-24 flex-col items-center gap-2 border-b-4 px-3 pb-4 pt-2 text-center transition ${
        isActive
          ? "border-idfm-interaction text-idfm-anthracite"
          : "border-transparent text-neutral-medium hover:border-idfm-medium hover:text-idfm-anthracite"
      }`}
    >
      <DashboardTabIcon icon={icon} label={label} />
      <span className="text-xs font-semibold uppercase tracking-wide">{label}</span>
    </Link>
  );
}
