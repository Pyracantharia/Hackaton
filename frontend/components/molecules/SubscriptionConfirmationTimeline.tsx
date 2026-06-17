import type { SubscriptionRequestResponse } from "@/lib/api/types";

type SubscriptionConfirmationTimelineProps = {
  timeline: SubscriptionRequestResponse["timeline"];
};

export function SubscriptionConfirmationTimeline({ timeline }: SubscriptionConfirmationTimelineProps) {
  return (
    <ol className="grid gap-3">
      {timeline.map((item) => (
        <li key={item.key} className="flex items-center gap-4 rounded-2xl border border-neutral-light bg-white p-4">
          <span
            className={`h-4 w-4 rounded-full ${
              item.status === "DONE"
                ? "bg-status-success"
                : item.status === "CURRENT"
                  ? "bg-idfm-interaction"
                  : "bg-neutral-light"
            }`}
            aria-hidden="true"
          />
          <span className="font-semibold text-idfm-anthracite">{item.label}</span>
          <span className="ml-auto text-xs font-bold uppercase tracking-wide text-neutral-medium">
            {item.status === "DONE" ? "Terminé" : item.status === "CURRENT" ? "En cours" : "À venir"}
          </span>
        </li>
      ))}
    </ol>
  );
}
