import type { ReactNode } from "react";

type AlertCardProps = {
  action?: ReactNode;
  message: string;
  severity: "INFO" | "WARNING" | "SUCCESS" | "DANGER";
  title: string;
};

const tones = {
  INFO: "border-idfm-medium bg-idfm-light",
  WARNING: "border-status-warning bg-orange-50",
  SUCCESS: "border-status-successLight bg-green-50",
  DANGER: "border-status-danger bg-red-50",
};

export function AlertCard({ action, message, severity, title }: AlertCardProps) {
  return (
    <article className={`flex h-full flex-col rounded-2xl border p-5 shadow-sm ${tones[severity]}`}>
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1">
          <h3 className="text-lg font-bold text-idfm-anthracite">{title}</h3>
          <p className="mt-2 text-sm leading-6 text-neutral-medium">{message}</p>
        </div>
        <span
          aria-hidden="true"
          className="mt-1 h-3 w-3 shrink-0 rounded-full bg-idfm-interaction"
        />
      </div>
      {action ? <div className="mt-auto pt-5">{action}</div> : null}
    </article>
  );
}
