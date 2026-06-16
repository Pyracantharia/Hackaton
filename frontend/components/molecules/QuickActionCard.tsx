import Link from "next/link";
import type { ReactNode } from "react";
import { IconPlaceholder } from "../atoms/IconPlaceholder";

type QuickActionCardProps = {
  description: string;
  href?: string;
  icon?: string;
  onClick?: () => void;
  title: string;
  trailing?: ReactNode;
};

const baseClassName =
  "group flex h-full w-full flex-col justify-between rounded-2xl border border-neutral-light bg-white p-5 text-left shadow-sm transition hover:border-idfm-interaction hover:shadow-md focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-idfm-focus";

export function QuickActionCard({
  description,
  href,
  icon,
  onClick,
  title,
  trailing,
}: QuickActionCardProps) {
  const content = (
    <>
      <div className="flex items-start justify-between gap-3">
        <IconPlaceholder label={title} src={icon} />
        {trailing}
      </div>
      <div className="mt-5">
        <h3 className="text-lg font-bold text-idfm-anthracite">{title}</h3>
        <p className="mt-2 text-sm leading-6 text-neutral-medium">{description}</p>
      </div>
    </>
  );

  if (href) {
    return (
      <Link href={href} className={baseClassName}>
        {content}
      </Link>
    );
  }

  return (
    <button type="button" onClick={onClick} className={baseClassName}>
      {content}
    </button>
  );
}
