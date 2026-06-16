"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { Button } from "@/components/atoms/Button";
import { InfoBox } from "@/components/molecules/InfoBox";
import { ProfileSummaryCard } from "@/components/molecules/ProfileSummaryCard";
import type { RegisterFamilyResponse } from "@/lib/api/types";

const fallback: RegisterFamilyResponse = {
  accessToken: "",
  household: {
    id: "demo",
    name: "Famille Martin",
  },
  members: [
    {
      id: "parent",
      firstName: "Sophie",
      lastName: "Martin",
      relationship: "SELF",
      isHolder: false,
      isPayer: true,
      isLegalRepresentative: true,
    },
    {
      id: "child",
      firstName: "Lucas",
      lastName: "Martin",
      relationship: "CHILD",
      isHolder: true,
      isPayer: false,
      isLegalRepresentative: false,
    },
  ],
  nextAction: {
    type: "RECOMMEND_PRODUCT",
    label: "Voir le forfait recommandé pour Lucas",
  },
  user: {
    id: "demo",
    firstName: "Sophie",
    lastName: "Martin",
    email: "sophie.martin@example.com",
  },
};

export default function FamilyDashboardPage() {
  const [data] = useState<RegisterFamilyResponse>(() => {
    if (typeof window === "undefined") return fallback;

    const stored = sessionStorage.getItem("familyRegisterResult");
    if (!stored) return fallback;

    try {
      return JSON.parse(stored) as RegisterFamilyResponse;
    } catch {
      return fallback;
    }
  });

  const parent =
    data.members.find((member) => member.relationship === "SELF") ??
    fallback.members[0];
  const child =
    data.members.find((member) => member.relationship === "CHILD") ??
    fallback.members[1];

  return (
    <main className="min-h-screen bg-neutral-xlight">
      <header className="border-b border-neutral-light bg-white px-5 py-4">
        <div className="mx-auto flex max-w-6xl items-center justify-between">
          <Image
            src="/assets/logos/idfm-connect-logo.svg"
            alt="Île-de-France Mobilités Connect"
            width={240}
            height={48}
            className="h-8 w-auto"
          />
          <Link
            href="/register"
            className="text-sm font-semibold text-idfm-interaction"
          >
            Nouvelle inscription
          </Link>
        </div>
      </header>
      <section className="mx-auto w-full max-w-6xl px-5 py-8">
        <p className="text-sm font-bold text-idfm-interaction">
          {data.household.name}
        </p>
        <h1 className="mt-3 text-3xl font-bold text-idfm-anthracite">
          Bonjour {data.user.firstName}
        </h1>
        <p className="mt-3 max-w-2xl text-base leading-7 text-neutral-medium">
          Votre espace famille centralise les profils, les rôles et les
          prochaines actions liées aux titres de transport.
        </p>

        <div className="mt-8 grid gap-4 md:grid-cols-2">
          <ProfileSummaryCard
            badges={[
              "Compte principal",
              parent.isPayer ? "Payeur" : "Gestionnaire",
            ]}
            name={`${parent.firstName} ${parent.lastName}`}
            subtitle="Compte principal"
          />
          <ProfileSummaryCard
            badges={["Profil enfant", child.isHolder ? "Porteur" : "Suivi"]}
            name={`${child.firstName} ${child.lastName}`}
            subtitle="Profil rattaché au foyer"
          />
        </div>

        <div className="mt-8 grid gap-4 lg:grid-cols-[1.4fr_0.8fr]">
          <InfoBox tone="orange">
            Renouvellement Imagine R disponible prochainement. Une alerte vous
            préviendra dès que le dossier pourra être complété.
          </InfoBox>
          <Button type="button">{data.nextAction.label}</Button>
        </div>
      </section>
    </main>
  );
}
