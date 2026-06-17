"use client";

import { useState } from "react";
import { Button } from "@/components/atoms/Button";
import { FormError } from "@/components/atoms/FormError";
import { RegisterConsentsStep } from "@/components/organisms/RegisterConsentsStep";
import { RegisterFamilyMemberStep } from "@/components/organisms/RegisterFamilyMemberStep";
import { RegisterIntentStep } from "@/components/organisms/RegisterIntentStep";
import { RegisterParentAccountStep } from "@/components/organisms/RegisterParentAccountStep";
import { RegisterRolesStep } from "@/components/organisms/RegisterRolesStep";
import { RegisterSuccessStep } from "@/components/organisms/RegisterSuccessStep";
import { RegisterVerificationStep } from "@/components/organisms/RegisterVerificationStep";
import { StepIndicator } from "@/components/molecules/StepIndicator";
import { AuthLayout } from "@/components/templates/AuthLayout";
import { registerFamily } from "@/lib/api/auth";
import type { RegisterFamilyMemberPayload } from "@/lib/api/types";
import type { RegisterErrors, RegisterFormState, RegisterResult } from "@/components/register/types";
import { isStrongPassword } from "@/components/molecules/PasswordChecklist";

const steps = ["Compte", "Vérification", "Profil", "Rôles", "Préférences", "Succès"];

const initialForm: RegisterFormState = {
  parent: {
    confirmationPassword: "Password123!",
    email: "sophie.martin@example.com",
    firstName: "Sophie",
    lastName: "Martin",
    password: "Password123!",
    phone: "+33612345678",
  },
  verification: {
    smsCode: "123456",
    emailCode: "654321",
  },
  members: [{
    birthDate: "2014-09-12",
    department: "94",
    firstName: "Lucas",
    id: "demo-lucas-martin",
    isHolder: true,
    isPayer: false,
    lastName: "Martin",
    relationship: "CHILD",
    schoolLevel: "COLLEGE",
    type: "YOUNG",
  }],
  roles: {
    parentIsLegalRepresentative: true,
    parentIsPayer: true,
    sameAddress: true,
  },
  consents: {
    serviceAlerts: true,
    mobilityNews: true,
    partnerOffers: false,
  },
};

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const phonePattern = /^\+\d{9,15}$/;

function getAge(birthDate: string) {
  const date = new Date(birthDate);
  const today = new Date();
  let age = today.getFullYear() - date.getFullYear();
  const monthDelta = today.getMonth() - date.getMonth();

  if (monthDelta < 0 || (monthDelta === 0 && today.getDate() < date.getDate())) {
    age -= 1;
  }

  return Number.isFinite(age) ? age : null;
}

export default function RegisterPage() {
  const [currentStep, setCurrentStep] = useState(0);
  const [errors, setErrors] = useState<RegisterErrors>({});
  const [form, setForm] = useState<RegisterFormState>(initialForm);
  const [globalError, setGlobalError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [result, setResult] = useState<RegisterResult | null>(null);
  const [unavailable, setUnavailable] = useState("");

  function validateStep(step: number) {
    const nextErrors: RegisterErrors = {};

    if (step === 1) {
      if (!form.parent.firstName.trim()) nextErrors.firstName = "Indiquez votre prénom.";
      if (!form.parent.lastName.trim()) nextErrors.lastName = "Indiquez votre nom.";
      if (!emailPattern.test(form.parent.email)) nextErrors.email = "Indiquez une adresse e-mail valide.";
      if (!phonePattern.test(form.parent.phone)) nextErrors.phone = "Utilisez un numéro au format international, par exemple +33612345678.";
      if (!isStrongPassword(form.parent.password)) nextErrors.password = "Le mot de passe ne respecte pas tous les critères.";
      if (form.parent.password !== form.parent.confirmationPassword) nextErrors.confirmationPassword = "Les deux mots de passe doivent être identiques.";
    }

    if (step === 2) {
      if (form.verification.smsCode !== "123456") nextErrors.smsCode = "Le code SMS attendu pour la démo est 123456.";
      if (form.verification.emailCode !== "654321") nextErrors.emailCode = "Le code e-mail attendu pour la démo est 654321.";
    }

    if (step === 3) {
      if (!form.members.length) nextErrors.members = "Ajoutez au moins un profil pour créer votre espace famille.";
    }

    if (
      step === 4 &&
      form.members.some((member) => member.type === "YOUNG" && (getAge(member.birthDate) ?? 18) < 18) &&
      !form.roles.parentIsLegalRepresentative
    ) {
      nextErrors.roles = "Confirmez votre autorisation pour gérer les démarches des mineurs ajoutés.";
    }

    if (step === 5 && !form.consents.serviceAlerts) {
      nextErrors.consents = "Les alertes indispensables doivent rester activées.";
    }

    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  }

  async function handleNext() {
    setGlobalError("");

    if (currentStep === 0) {
      setCurrentStep(1);
      return;
    }

    if (!validateStep(currentStep)) return;

    if (currentStep < 5) {
      setCurrentStep((step) => step + 1);
      return;
    }

    setIsSubmitting(true);

    try {
      const members = form.members.map((member): RegisterFamilyMemberPayload => ({
        birthDate: member.birthDate,
        department: member.department,
        firstName: member.firstName,
        isHolder: member.isHolder,
        isPayer: member.isPayer,
        lastName: member.lastName,
        relationship: member.relationship,
        schoolLevel: member.schoolLevel,
        seniorRelationship: member.seniorRelationship,
        type: member.type,
      }));
      const firstYoungMember = members.find((member) => member.type === "YOUNG");
      const response = await registerFamily({
        child: firstYoungMember
          ? {
              birthDate: firstYoungMember.birthDate,
              department: firstYoungMember.department,
              firstName: firstYoungMember.firstName,
              lastName: firstYoungMember.lastName,
              schoolLevel: firstYoungMember.schoolLevel ?? "OTHER",
            }
          : undefined,
        consents: form.consents,
        members,
        parent: {
          email: form.parent.email,
          firstName: form.parent.firstName,
          lastName: form.parent.lastName,
          password: form.parent.password,
          phone: form.parent.phone,
        },
        roles: form.roles,
        verification: form.verification,
      });

      localStorage.setItem("familyAccessToken", response.accessToken);
      sessionStorage.setItem("familyRegisterResult", JSON.stringify(response));
      setResult(response);
      setCurrentStep(6);
    } catch (error) {
      setGlobalError(error instanceof Error ? error.message : "Impossible de créer l'espace famille.");
    } finally {
      setIsSubmitting(false);
    }
  }

  const title = currentStep === 0
    ? "Créer mon espace mobilité"
    : currentStep === 6
      ? "Votre espace famille est prêt"
      : [
          "",
          "Vos informations de connexion",
          "Vérifions vos coordonnées",
          "Composez votre foyer Navigo",
          "Qui utilise et qui paie le titre ?",
          "Comment souhaitez-vous être accompagné ?",
        ][currentStep];

  const subtitle = currentStep === 0
    ? "Nous adaptons votre parcours selon votre situation."
    : currentStep === 6
      ? "Votre foyer est créé et la prochaine action est prête."
      : [
          "",
          "Ce compte vous permettra de gérer vos titres et ceux de vos enfants.",
          "Pour sécuriser votre espace famille, nous vérifions votre téléphone et votre adresse e-mail.",
          "Ajoutez les personnes dont vous souhaitez gérer les titres de transport.",
          "Visualisez simplement la différence entre compte principal, payeur et porteur.",
          "Choisissez les alertes et conseils utiles pour suivre les titres de votre foyer.",
        ][currentStep];

  const illustrationSrc =
    currentStep === 0 ? "/assets/illustrations/station-waiting-area.png" : "/assets/illustrations/register-family.svg";
  const illustrationAlt =
    currentStep === 0 ? "Illustration Île-de-France Mobilités" : "Famille utilisant les transports Île-de-France Mobilités";

  return (
    <AuthLayout title={title} subtitle={subtitle} illustrationSrc={illustrationSrc} illustrationAlt={illustrationAlt}>
      <section className="rounded-md border border-neutral-light bg-white p-5 shadow-sm sm:p-7">
        {currentStep > 0 && currentStep < 6 ? (
          <div className="mb-6">
            <StepIndicator currentStep={currentStep - 1} steps={steps} />
          </div>
        ) : null}

        {currentStep === 0 ? (
          <RegisterIntentStep onFamilyStart={handleNext} onUnavailable={setUnavailable} />
        ) : null}

        {currentStep === 1 ? (
          <RegisterParentAccountStep
            data={form.parent}
            errors={errors}
            onChange={(field, value) => setForm((state) => ({ ...state, parent: { ...state.parent, [field]: value } }))}
          />
        ) : null}

        {currentStep === 2 ? (
          <RegisterVerificationStep
            data={form.verification}
            errors={errors}
            onChange={(field, value) => setForm((state) => ({ ...state, verification: { ...state.verification, [field]: value } }))}
          />
        ) : null}

        {currentStep === 3 ? (
          <RegisterFamilyMemberStep
            errors={errors}
            members={form.members}
            onChange={(members) => setForm((state) => ({ ...state, members }))}
          />
        ) : null}

        {currentStep === 4 ? (
          <RegisterRolesStep
            members={form.members}
            parent={form.parent}
            roles={form.roles}
            onChange={(field, value) => setForm((state) => ({ ...state, roles: { ...state.roles, [field]: value } }))}
          />
        ) : null}

        {currentStep === 5 ? (
          <RegisterConsentsStep
            consents={form.consents}
            onChange={(field, value) => setForm((state) => ({ ...state, consents: { ...state.consents, [field]: value } }))}
          />
        ) : null}

        {currentStep === 6 && result ? <RegisterSuccessStep result={result} /> : null}

        {errors.roles ? <FormError message={errors.roles} /> : null}
        {errors.consents ? <FormError message={errors.consents} /> : null}
        {globalError ? <FormError message={globalError} /> : null}

        {currentStep > 0 && currentStep < 6 ? (
          <div className="mt-7 flex flex-col-reverse gap-3 sm:flex-row sm:justify-between">
            <Button
              type="button"
              variant="ghost"
              onClick={() => {
                setErrors({});
                setCurrentStep((step) => Math.max(0, step - 1));
              }}
            >
              Retour
            </Button>
            <Button type="button" onClick={handleNext} disabled={isSubmitting}>
              {currentStep === 5 ? (isSubmitting ? "Création en cours..." : "Créer mon espace famille") : "Continuer"}
            </Button>
          </div>
        ) : null}
      </section>

      {unavailable ? (
        <div className="fixed inset-0 z-20 flex items-center justify-center bg-idfm-anthracite/40 px-5" role="dialog" aria-modal="true">
          <div className="w-full max-w-md rounded-md bg-white p-6 shadow-xl">
            <h2 className="text-xl font-bold text-idfm-anthracite">{unavailable}</h2>
            <p className="mt-3 text-sm leading-6 text-neutral-medium">
              Ce parcours sera activé dans une prochaine version. Pour cette démo, le parcours famille est disponible.
            </p>
            <div className="mt-5 flex justify-end">
              <Button type="button" onClick={() => setUnavailable("")}>Compris</Button>
            </div>
          </div>
        </div>
      ) : null}
    </AuthLayout>
  );
}
