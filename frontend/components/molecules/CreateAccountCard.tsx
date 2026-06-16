import Link from "next/link";
import Image from "next/image";
import { Button } from "../atoms/Button";
import { InfoBox } from "./InfoBox";

const benefits = [
  "Gérer plusieurs profils",
  "Recevoir les rappels de renouvellement",
  "Suivre les dossiers et justificatifs",
  "Déclarer une perte de passe",
];

export function CreateAccountCard() {
  return (
    <div className="grid gap-5">
      <Image
        src="/assets/illustrations/navigo-card-and-paper-tickets.png"
        alt="Carte Navigo et billets Île-de-France Mobilités"
        width={320}
        height={220}
        className="mx-auto rounded-2xl bg-idfm-light p-4"
      />
      <p className="text-sm leading-6 text-neutral-medium">
        Créez votre espace famille pour gérer vos titres et ceux de vos proches : enfant, jeune, retraité ou proche aidé.
      </p>
      <ul className="grid gap-2 text-sm text-idfm-anthracite">
        {benefits.map((benefit) => (
          <li key={benefit} className="flex items-center gap-2">
            <span className="flex h-5 w-5 items-center justify-center rounded-full bg-idfm-medium text-xs font-bold text-idfm-focus" aria-hidden="true">✓</span>
            {benefit}
          </li>
        ))}
      </ul>
      <InfoBox>
        Le compte famille vous aide à passer d&apos;un compte individuel administratif à un espace de gestion partagé.
      </InfoBox>
      <Link href="/register" className="contents">
        <Button variant="secondary" className="w-full">Créer mon espace famille</Button>
      </Link>
    </div>
  );
}
