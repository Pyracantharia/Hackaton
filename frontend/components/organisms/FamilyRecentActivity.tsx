import { EmptyState } from "../molecules/EmptyState";
import type { RecentActivityItem } from "@/lib/api/types";

type FamilyRecentActivityProps = {
  items: RecentActivityItem[];
};

function formatDate(value: string) {
  return new Intl.DateTimeFormat("fr-FR", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "Europe/Paris",
  }).format(new Date(value));
}

export function FamilyRecentActivity({ items }: FamilyRecentActivityProps) {
  return (
    <section id="activity" className="mt-12">
      <div>
        <h2 className="text-2xl font-bold text-idfm-anthracite">Activite recente</h2>
        <p className="mt-2 text-sm leading-6 text-neutral-medium">
          Cette piste d&apos;activite prepare la suite du produit et le futur suivi back-office.
        </p>
      </div>

      {items.length ? (
        <div className="mt-6 rounded-2xl border border-neutral-light bg-white p-5 shadow-sm">
          <ul className="grid gap-4">
            {items.map((item) => (
              <li key={item.id} className="flex flex-col gap-1 border-b border-neutral-light pb-4 last:border-b-0 last:pb-0">
                <span className="text-sm font-semibold text-idfm-anthracite">{item.label}</span>
                <span className="text-xs uppercase tracking-wide text-neutral-medium">{formatDate(item.createdAt)}</span>
              </li>
            ))}
          </ul>
        </div>
      ) : (
        <div className="mt-6">
          <EmptyState
            title="Aucune activite recente"
            description="L'activite recente apparaitra ici lorsque vous interagirez avec les profils et les dossiers."
          />
        </div>
      )}
    </section>
  );
}
