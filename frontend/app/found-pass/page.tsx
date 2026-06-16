"use client";

import { useState } from "react";
import Link from "next/link";
import { Button } from "@/components/atoms/Button";
import { Checkbox } from "@/components/atoms/Checkbox";
import { FormError } from "@/components/atoms/FormError";
import { Input } from "@/components/atoms/Input";
import { InfoBox } from "@/components/molecules/InfoBox";
import { DashboardLayout } from "@/components/templates/DashboardLayout";
import { createFoundPassSupportCase } from "@/lib/api/households";

function maskPassNumber(passNumber: string) {
  const sanitized = passNumber.replace(/\s+/g, "");
  return `${"*".repeat(Math.max(0, sanitized.length - 4))}${sanitized.slice(-4)}`;
}

export default function FoundPassPage() {
  const [passNumber, setPassNumber] = useState("");
  const [foundLocation, setFoundLocation] = useState("");
  const [depositedAtDesk, setDepositedAtDesk] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState<{ message: string; masked: string } | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit() {
    if (passNumber.trim().length < 6) {
      setError("Indiquez un numero de passe valide.");
      return;
    }

    if (!foundLocation.trim()) {
      setError("Precisez le lieu de decouverte.");
      return;
    }

    setError("");
    setIsSubmitting(true);

    try {
      const response = await createFoundPassSupportCase({
        passNumber: passNumber.trim(),
        foundLocation: foundLocation.trim(),
        depositedAtDesk,
      });

      setSuccess({
        message: response.message,
        masked: response.passNumberMasked,
      });
    } catch {
      setSuccess({
        message: "Signalement enregistre en mode demo. Merci pour votre aide.",
        masked: maskPassNumber(passNumber.trim()),
      });
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <DashboardLayout
      activeTab="help"
      breadcrumbs={[
        { href: "/", label: "Accueil" },
        { label: "Signaler un passe trouve" },
      ]}
      showTabs={false}
      subtitle="Un parcours public, sobre et securise pour aider a restituer un passe sans afficher d'informations sensibles."
      summaryItems={["Parcours public", "Aucune identite exposee"]}
      title="Passe Navigo trouve"
    >
      <div className="mx-auto grid max-w-3xl gap-6">
        <InfoBox>
          Ne communiquez jamais l&apos;identite supposee du proprietaire. Le rapprochement se fera ensuite cote service.
        </InfoBox>

        <section className="rounded-2xl border border-neutral-light bg-white p-6 shadow-sm">
          <div className="grid gap-5">
            <Input
              label="Numero du passe"
              name="pass-number"
              placeholder="123456789"
              value={passNumber}
              onChange={(event) => setPassNumber(event.target.value)}
            />
            <Input
              label="Lieu ou le passe a ete trouve"
              name="found-location"
              placeholder="Gare de Lyon"
              value={foundLocation}
              onChange={(event) => setFoundLocation(event.target.value)}
            />
            <Checkbox
              checked={depositedAtDesk}
              label="Je l'ai depose a un guichet"
              name="deposited-at-desk"
              onChange={(event) => setDepositedAtDesk(event.target.checked)}
            />
            <FormError message={error} />
            <Button type="button" disabled={isSubmitting} onClick={() => void handleSubmit()}>
              {isSubmitting ? "Envoi..." : "Signaler le passe trouve"}
            </Button>
          </div>
        </section>

        {success ? (
          <InfoBox tone="green">
            <span className="font-semibold text-status-success">{success.message}</span>
            <span className="mt-1 block text-neutral-medium">Reference du passe masquee : {success.masked}</span>
          </InfoBox>
        ) : null}

        <div className="flex flex-wrap gap-3">
          <Link href="/login" className="contents">
            <Button type="button" variant="secondary">Acceder a mon espace</Button>
          </Link>
          <Link href="/" className="contents">
            <Button type="button" variant="ghost">Retour a l&apos;accueil</Button>
          </Link>
        </div>
      </div>
    </DashboardLayout>
  );
}
