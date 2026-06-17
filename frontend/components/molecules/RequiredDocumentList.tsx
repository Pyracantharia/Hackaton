import { Badge } from "../atoms/Badge";
import type { OfferRequiredDocument, SubscriptionRequestResponse } from "@/lib/api/types";
import { DocumentStatusBadge } from "./DocumentStatusBadge";

type RequiredDocumentListProps = {
  documents: OfferRequiredDocument[] | SubscriptionRequestResponse["documents"];
};

export function RequiredDocumentList({ documents }: RequiredDocumentListProps) {
  if (!documents.length) {
    return (
      <div className="rounded-2xl border border-neutral-light bg-white p-5 text-sm text-neutral-medium">
        Aucun document spécifique n'est requis pour l'instant.
      </div>
    );
  }

  return (
    <div className="grid gap-3">
      {documents.map((document) => (
        <div key={document.id} className="flex items-center justify-between gap-4 rounded-2xl border border-neutral-light bg-white p-4">
          <div>
            <p className="font-semibold text-idfm-anthracite">{document.label}</p>
            <p className="mt-1 text-xs uppercase tracking-wide text-neutral-medium">{document.documentType}</p>
          </div>
          {"status" in document ? (
            <DocumentStatusBadge status={document.status} />
          ) : (
            <Badge tone={document.required ? "orange" : "blue"}>{document.required ? "Requis" : "Optionnel"}</Badge>
          )}
        </div>
      ))}
    </div>
  );
}
