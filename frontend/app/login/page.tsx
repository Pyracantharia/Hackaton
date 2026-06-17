"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/atoms/Button";
import { AuthCard } from "@/components/molecules/AuthCard";
import { CreateAccountCard } from "@/components/molecules/CreateAccountCard";
import { LoginForm } from "@/components/molecules/LoginForm";
import { AppNavbar } from "@/components/organisms/AppNavbar";
import { login } from "@/lib/api/auth";

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

type ModalKind = "forgot" | "help" | null;

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("sophie.martin@example.com");
  const [password, setPassword] = useState("Password123!");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitError, setSubmitError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [modal, setModal] = useState<ModalKind>(null);

  function validate() {
    const nextErrors: Record<string, string> = {};

    if (!emailPattern.test(email)) {
      nextErrors.email = "Indiquez une adresse e-mail valide.";
    }

    if (!password) {
      nextErrors.password = "Indiquez votre mot de passe.";
    }

    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  }

  async function handleLogin() {
    setSubmitError("");

    if (!validate()) return;

    setIsSubmitting(true);

    try {
      const response = await login({ email, password });
      localStorage.setItem("familyAccessToken", response.accessToken);
      sessionStorage.setItem("familyUser", JSON.stringify(response.user));
      router.push(response.user.role === "ADMIN" ? "/dashboard/admin" : "/dashboard/family");
    } catch (error) {
      setSubmitError(error instanceof Error ? error.message : "Connexion impossible pour le moment.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <main className="min-h-screen bg-neutral-xlight">

      <section className="mx-auto w-full max-w-6xl px-5 pb-12 pt-6">
        <div className="mx-auto max-w-3xl text-center">
          <h1 className="text-3xl font-bold text-idfm-anthracite sm:text-4xl">Connectez-vous à votre espace famille</h1>
          <p className="mt-4 text-base leading-7 text-neutral-medium">
            Retrouvez vos profils, vos titres et vos démarches Navigo depuis un seul espace.
          </p>
        </div>

        <div className="mx-auto mt-8 grid max-w-5xl gap-6 lg:grid-cols-2">
          <AuthCard title="Je me connecte">
            <LoginForm
              email={email}
              errors={errors}
              isSubmitting={isSubmitting}
              onEmailChange={setEmail}
              onForgotPassword={() => setModal("forgot")}
              onHelp={() => setModal("help")}
              onPasswordChange={setPassword}
              onSubmit={handleLogin}
              password={password}
              submitError={submitError}
            />
          </AuthCard>

          <AuthCard title="Pas encore de compte ?">
            <CreateAccountCard />
          </AuthCard>
        </div>

        <div className="mx-auto mt-6 grid max-w-5xl gap-4 md:grid-cols-3">
          <div className="rounded-2xl border border-neutral-light bg-white p-4 shadow-sm">
            <Image
              src="/assets/illustrations/navigo-card-and-paper-tickets.png"
              alt="Carte Navigo et titres de transport"
              width={220}
              height={140}
              className="mx-auto h-28 w-auto object-contain"
            />
          </div>
          <div className="rounded-2xl border border-neutral-light bg-white p-4 shadow-sm">
            <Image
              src="/assets/illustrations/station-staff-high-five.png"
              alt="Accompagnement usager"
              width={220}
              height={140}
              className="mx-auto h-28 w-auto object-contain"
            />
          </div>
          <div className="rounded-2xl border border-neutral-light bg-white p-4 shadow-sm">
            <Image
              src="/assets/illustrations/ticket-vending-machines.png"
              alt="Services Île-de-France Mobilités"
              width={220}
              height={140}
              className="mx-auto h-28 w-auto object-contain"
            />
          </div>
        </div>

        <p className="mt-8 text-center text-sm text-neutral-medium">
          Île-de-France Mobilités Connect © 2026 ·{" "}
          <Link href="/register" className="font-semibold text-idfm-interaction underline-offset-4 hover:underline">
            Créer un compte famille
          </Link>
        </p>
      </section>

      {modal ? (
        <div className="fixed inset-0 z-20 flex items-center justify-center bg-idfm-anthracite/40 px-5" role="dialog" aria-modal="true">
          <div className="w-full max-w-md rounded-md bg-white p-6 shadow-xl">
            <h2 className="text-xl font-bold text-idfm-anthracite">
              {modal === "forgot" ? "Mot de passe oublié" : "Besoin d'aide pour vous connecter ?"}
            </h2>
            <p className="mt-3 text-sm leading-6 text-neutral-medium">
              {modal === "forgot"
                ? "La récupération de mot de passe sera disponible prochainement. Pour la démo, utilisez le compte créé lors de l'inscription."
                : "Vérifiez votre adresse e-mail et votre mot de passe. Si votre compte vient d'être créé, assurez-vous d'avoir terminé les étapes de vérification."}
            </p>
            <div className="mt-5 grid gap-3 sm:grid-cols-2">
              <Link href="/register" className="contents">
                <Button type="button" variant="secondary">Créer un compte</Button>
              </Link>
              <Button type="button" onClick={() => setModal(null)}>Compris</Button>
            </div>
          </div>
        </div>
      ) : null}
    </main>
  );
}
