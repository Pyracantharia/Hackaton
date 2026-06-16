import type { ReactNode } from "react";

type EmptyStateProps = {
  action?: ReactNode;
  description: string;
  title: string;
};

export function EmptyState({ action, description, title }: EmptyStateProps) {
  return (
    <div className="rounded-2xl border border-dashed border-neutral-light bg-white p-6 text-center">
      <h3 className="text-lg font-bold text-idfm-anthracite">{title}</h3>
      <p className="mt-3 text-sm leading-6 text-neutral-medium">{description}</p>
      {action ? <div className="mt-5 flex justify-center">{action}</div> : null}
    </div>
  );
}
