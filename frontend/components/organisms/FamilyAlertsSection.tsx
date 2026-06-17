import Link from "next/link";
import { Button } from "../atoms/Button";
import { AlertCard } from "../molecules/AlertCard";
import { EmptyState } from "../molecules/EmptyState";
import type { DashboardNotification } from "@/lib/api/types";

type FamilyAlertsSectionProps = {
  notifications: DashboardNotification[];
};

function getNotificationHref(notification: DashboardNotification) {
  if (!notification.memberId) {
    return "/dashboard/family?tab=help";
  }

  if (notification.type === "RENEWAL") {
    return `/dashboard/family/titles/recommendation?memberId=${notification.memberId}`;
  }

  return `/dashboard/family/members/${notification.memberId}`;
}

function getNotificationActionLabel(notification: DashboardNotification) {
  if (notification.type === "RENEWAL") {
    return "Renouveler";
  }

  if (notification.type === "OFFER_RECOMMENDATION") {
    return "Choisir une offre";
  }

  if (notification.type === "SUPPORT_UPDATE") {
    return "Suivre le dossier";
  }

  return "Comprendre";
}

export function FamilyAlertsSection({ notifications }: FamilyAlertsSectionProps) {
  const visibleNotifications = notifications.slice(0, 3);

  return (
    <section id="alerts">
      <div className="flex items-end justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-idfm-anthracite">Alertes importantes</h2>
          <p className="mt-2 text-sm leading-6 text-neutral-medium">
            Les prochaines actions sont mises en avant pour vous aider a prioriser le foyer.
          </p>
        </div>
      </div>

      {visibleNotifications.length ? (
        <div className="mt-6 grid gap-4 lg:grid-cols-3">
          {visibleNotifications.map((notification) => (
            <AlertCard
              key={notification.id}
              message={notification.message}
              severity={notification.severity}
              title={notification.title}
              action={(
                <Link href={getNotificationHref(notification)} className="contents">
                  <Button type="button" variant="secondary">{getNotificationActionLabel(notification)}</Button>
                </Link>
              )}
            />
          ))}
        </div>
      ) : (
        <div className="mt-6">
          <EmptyState
            title="Aucune alerte prioritaire"
            description="Les prochaines alertes importantes apparaitront ici."
          />
        </div>
      )}
    </section>
  );
}
