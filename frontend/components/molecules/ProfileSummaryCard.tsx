import type { ReactNode } from "react";
import { Badge } from "../atoms/Badge";
import { IconPlaceholder } from "../atoms/IconPlaceholder";

type ProfileSummaryCardProps = {
  actions?: ReactNode;
  badges: string[];
  currentProduct?: string | null;
  description?: string;
  icon?: string;
  meta?: string[];
  name: string;
  status?: ReactNode;
  subtitle: string;
};

export function ProfileSummaryCard({
  actions,
  badges,
  currentProduct,
  description,
  icon,
  meta,
  name,
  status,
  subtitle,
}: ProfileSummaryCardProps) {
  return (
    <article className="flex h-full flex-col rounded-2xl border border-neutral-light bg-white p-5 shadow-sm">
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-center gap-3">
          <IconPlaceholder label={name} src={icon} />
          <div>
            <h3 className="text-lg font-bold text-idfm-anthracite">{name}</h3>
            <p className="mt-1 text-sm text-neutral-medium">{subtitle}</p>
          </div>
        </div>
        {status}
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        {badges.map((badge) => (
          <Badge key={badge}>{badge}</Badge>
        ))}
      </div>

      {currentProduct ? (
        <p className="mt-4 text-base font-semibold text-idfm-anthracite">{currentProduct}</p>
      ) : null}

      {description ? <p className="mt-3 text-sm leading-6 text-neutral-medium">{description}</p> : null}

      {meta?.length ? (
        <div className="mt-4 grid flex-1 gap-2 text-sm text-neutral-medium">
          {meta.map((item) => (
            <p key={item}>{item}</p>
          ))}
        </div>
      ) : <div className="flex-1" />}

      {actions ? <div className="mt-5 pt-2">{actions}</div> : null}
    </article>
  );
}
