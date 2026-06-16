import Image from "next/image";
import type { ReactNode } from "react";
import { Badge } from "../atoms/Badge";
import { IconPlaceholder } from "../atoms/IconPlaceholder";

type ChoiceCardProps = {
  action?: ReactNode;
  badge?: string;
  description: string;
  icon?: string;
  imageSrc?: string;
  onClick?: () => void;
  title: string;
};

export function ChoiceCard({ action, badge, description, icon, imageSrc, onClick, title }: ChoiceCardProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="group flex h-full w-full flex-col rounded-md border border-neutral-light bg-white p-5 text-left shadow-sm transition hover:border-idfm-interaction hover:shadow-md focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-idfm-focus"
    >
      <span className="mb-4 flex items-start justify-between gap-3">
        {imageSrc ? (
          <span className="flex h-16 w-16 items-center justify-center overflow-hidden rounded-xl bg-idfm-light">
            <Image src={imageSrc} alt="" width={64} height={64} className="h-14 w-14 object-contain" aria-hidden="true" />
          </span>
        ) : (
          <IconPlaceholder label={title} src={icon} />
        )}
        {badge ? <Badge tone={badge === "Actif" ? "green" : "orange"}>{badge}</Badge> : null}
      </span>
      <span className="text-lg font-bold text-idfm-anthracite">{title}</span>
      <span className="mt-2 flex-1 text-sm leading-6 text-neutral-medium">{description}</span>
      {action ? <span className="mt-5 text-sm font-bold text-idfm-interaction">{action}</span> : null}
    </button>
  );
}
