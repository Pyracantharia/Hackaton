import Link from "next/link";
import { Badge } from "../atoms/Badge";
import { Button } from "../atoms/Button";
import {
  formatSupportCaseDate,
  resolutionLabels,
  supportCaseStatusLabels,
  supportCaseStatusTones,
} from "@/lib/supportCases";
import type { SupportCaseSummary } from "@/lib/api/types";

type SupportCaseCardProps = {
  onCancel?: (supportCase: SupportCaseSummary) => void;
  supportCase: SupportCaseSummary;
};

export function SupportCaseCard({ onCancel, supportCase }: SupportCaseCardProps) {
  return (
    <article className="rounded-2xl border border-neutral-light bg-white p-5 shadow-sm">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-xs font-bold uppercase tracking-wide text-neutral-medium">
            {supportCase.dossierNumber}
          </p>
          <p className="mt-1 font-bold text-idfm-anthracite">
            {supportCase.memberName ?? "Profil du foyer"}
          </p>
        </div>
        <Badge tone={supportCaseStatusTones[supportCase.status]}>
          {supportCaseStatusLabels[supportCase.status]}
        </Badge>
      </div>

      <dl className="mt-4 grid gap-2 text-sm">
        {supportCase.titleLabel ? (
          <div className="flex justify-between gap-4">
            <dt className="text-neutral-medium">Titre</dt>
            <dd className="text-right text-idfm-anthracite">{supportCase.titleLabel}</dd>
          </div>
        ) : null}
        {supportCase.passNumberMasked ? (
          <div className="flex justify-between gap-4">
            <dt className="text-neutral-medium">Pass</dt>
            <dd className="text-right text-idfm-anthracite">{supportCase.passNumberMasked}</dd>
          </div>
        ) : null}
        {supportCase.chosenResolution ? (
          <div className="flex justify-between gap-4">
            <dt className="text-neutral-medium">Option</dt>
            <dd className="text-right text-idfm-anthracite">
              {resolutionLabels[supportCase.chosenResolution]}
            </dd>
          </div>
        ) : null}
        <div className="flex justify-between gap-4">
          <dt className="text-neutral-medium">Cree le</dt>
          <dd className="text-right text-idfm-anthracite">
            {formatSupportCaseDate(supportCase.createdAt)}
          </dd>
        </div>
      </dl>

      {supportCase.nextStep ? (
        <p className="mt-3 rounded-md bg-idfm-light px-3 py-2 text-xs leading-5 text-idfm-anthracite">
          {supportCase.nextStep}
        </p>
      ) : null}

      <div className="mt-4 grid gap-2 sm:grid-cols-2">
        <Link href={`/dashboard/family/support-cases/${supportCase.id}`} className="contents">
          <Button type="button" variant="secondary" className="w-full">
            Voir le suivi
          </Button>
        </Link>
        {supportCase.cancellable && onCancel ? (
          <Button type="button" variant="ghost" onClick={() => onCancel(supportCase)}>
            Annuler la declaration
          </Button>
        ) : null}
      </div>
    </article>
  );
}
