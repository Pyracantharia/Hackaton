import type { SupportCaseResolution, SupportCaseStatus } from "@/lib/api/types";

type SupportCaseTimelineProps = {
  chosenResolution: SupportCaseResolution | null;
  status: SupportCaseStatus;
};

function buildSteps(chosenResolution: SupportCaseResolution | null) {
  const resolutionStep =
    chosenResolution === "TRANSFER_TO_PHONE"
      ? "Solution temporaire demandee"
      : "Pass physique a desactiver";

  return [
    "Declaration recue",
    "Verification en cours",
    resolutionStep,
    "Pass retrouve",
    "Client notifie",
    "Pass recupere",
    "Choix final enregistre",
  ];
}

function getActiveIndex(status: SupportCaseStatus) {
  switch (status) {
    case "OPEN":
      return 0;
    case "IN_PROGRESS":
      return 1;
    case "TRANSFER_TO_PHONE_REQUESTED":
    case "PASS_DEACTIVATION_REQUESTED":
      return 2;
    case "PASS_FOUND_WAITING_PICKUP":
      return 4;
    case "PASS_PICKED_UP":
      return 5;
    case "DIGITAL_SUPPORT_CONFIRMED":
    case "PHYSICAL_PASS_REACTIVATION_REQUESTED":
    case "RESOLVED":
      return 6;
    default:
      return 0;
  }
}

export function SupportCaseTimeline({ chosenResolution, status }: SupportCaseTimelineProps) {
  const steps = buildSteps(chosenResolution);
  const isCancelled = status === "CANCELLED_BY_USER";
  const activeIndex = getActiveIndex(status);

  return (
    <ol className="grid gap-0">
      {steps.map((step, index) => {
        const completed = !isCancelled && index < activeIndex;
        const active = !isCancelled && index === activeIndex;
        const isLast = index === steps.length - 1;

        return (
          <li key={step} className="grid grid-cols-[auto_1fr] gap-4">
            <div className="flex flex-col items-center">
              <span
                className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full border-2 text-xs font-bold ${
                  completed
                    ? "border-status-success bg-status-success text-white"
                    : active
                      ? "border-idfm-interaction bg-idfm-interaction text-white"
                      : "border-neutral-light bg-white text-neutral-medium"
                }`}
                aria-hidden="true"
              >
                {completed ? "✓" : index + 1}
              </span>
              {!isLast ? (
                <span
                  className={`min-h-8 w-0.5 flex-1 ${
                    completed ? "bg-status-success" : "bg-neutral-light"
                  }`}
                />
              ) : null}
            </div>
            <div className={isLast ? "pb-0 pt-0.5" : "pb-6 pt-0.5"}>
              <p
                className={`text-sm font-semibold ${
                  active ? "text-idfm-focus" : completed ? "text-idfm-anthracite" : "text-neutral-medium"
                }`}
              >
                {step}
              </p>
              {active ? (
                <p className="mt-1 text-xs text-neutral-medium">Etape en cours</p>
              ) : null}
            </div>
          </li>
        );
      })}

      {isCancelled ? (
        <li className="mt-2 rounded-md border border-status-danger bg-red-50 p-3 text-sm font-semibold text-status-danger">
          Declaration annulee par vos soins.
        </li>
      ) : null}
    </ol>
  );
}
