"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/atoms/Button";
import { AuthCard } from "@/components/molecules/AuthCard";
import { LoginForm } from "@/components/molecules/LoginForm";
import { login } from "@/lib/api/auth";

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

type ModalKind = "forgot" | "help" | null;

export default function AdminLoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("admin.demo@example.com");
  const [password, setPassword] = useState("Admin123!");
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

      if (response.user.role !== "ADMIN") {
        localStorage.removeItem("familyAccessToken");
        sessionStorage.removeItem("familyUser");
        setSubmitError("Ce compte n'a pas les droits administrateur.");
        return;
      }

      localStorage.setItem("familyAccessToken", response.accessToken);
      sessionStorage.setItem("familyUser", JSON.stringify(response.user));
      router.push("/dashboard/admin");
    } catch (error) {
      setSubmitError(error instanceof Error ? error.message : "Connexion administrateur impossible pour le moment.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <main className="min-h-screen bg-neutral-xlight">
      <header className="px-5 py-5">
        <div className="mx-auto grid max-w-6xl grid-cols-3 items-center gap-3">
          <Link
            href="/login"
            className="justify-self-start text-sm font-semibold text-idfm-interaction underline-offset-4 hover:underline focus-visible:outline-2 focus-visible:outline-idfm-focus"
          >
            Espace famille
          </Link>
          <Image
            src="/assets/logos/idfm-connect-logo.svg"
            alt="Ile-de-France Mobilites Connect"
            width={240}
            height={48}
            className="h-9 w-auto justify-self-center"
            priority
          />
          <button
            className="justify-self-end text-sm font-semibold text-idfm-interaction underline-offset-4 hover:underline focus-visible:outline-2 focus-visible:outline-idfm-focus"
            type="button"
            onClick={() => setModal("help")}
          >
            Aide
          </button>
        </div>
      </header>

      <section className="mx-auto w-full max-w-3xl px-5 pb-12 pt-10">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-idfm-anthracite sm:text-4xl">Connexion administrateur</h1>
          <p className="mt-4 text-base leading-7 text-neutral-medium">
            Accedez au dashboard administrateur avec un compte autorise.
          </p>
        </div>

        <div className="mx-auto mt-8 max-w-xl">
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
        </div>
      </section>

      {modal ? (
        <div className="fixed inset-0 z-20 flex items-center justify-center bg-idfm-anthracite/40 px-5" role="dialog" aria-modal="true">
          <div className="w-full max-w-md rounded-md bg-white p-6 shadow-xl">
            <h2 className="text-xl font-bold text-idfm-anthracite">
              {modal === "forgot" ? "Mot de passe oublié" : "Besoin d'aide pour vous connecter ?"}
            </h2>
            <p className="mt-3 text-sm leading-6 text-neutral-medium">
              {modal === "forgot"
                ? "Pour la démo administrateur, utilisez le compte admin seedé."
                : "Vérifiez que vous utilisez un compte avec le rôle administrateur."}
            </p>
            <div className="mt-5 flex justify-end">
              <Button type="button" onClick={() => setModal(null)}>Compris</Button>
            </div>
          </div>
        </div>
      ) : null}
    </main>
  );
}
