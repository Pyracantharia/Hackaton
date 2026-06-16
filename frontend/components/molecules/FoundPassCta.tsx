import Link from "next/link";
import { Button } from "../atoms/Button";
import { InfoBox } from "./InfoBox";

export function FoundPassCta() {
  return (
    <InfoBox>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="font-semibold text-idfm-anthracite">J&apos;ai trouve un passe Navigo</p>
          <p className="mt-1 text-sm text-neutral-medium">
            Signalez un passe trouve sans exposer l&apos;identite de son proprietaire.
          </p>
        </div>
        <Link href="/found-pass" className="contents">
          <Button type="button" variant="secondary">Signaler un passe trouve</Button>
        </Link>
      </div>
    </InfoBox>
  );
}
