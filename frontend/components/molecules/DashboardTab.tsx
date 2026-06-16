import Link from "next/link";
import { IconPlaceholder } from "../atoms/IconPlaceholder";

type DashboardTabProps = {
  href: string;
  icon?: string;
  isActive?: boolean;
  label: string;
};

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
      <IconPlaceholder label={label} src={icon} />
      <span className="text-xs font-semibold uppercase tracking-wide">{label}</span>
    </Link>
  );
}
