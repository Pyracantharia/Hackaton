import type { ReactNode } from "react";
import Image from "next/image";
import { AppNavbar } from "../organisms/AppNavbar";

type AuthLayoutProps = {
  children: ReactNode;
  eyebrow?: string;
  illustrationAlt?: string;
  illustrationSrc?: string;
  subtitle: string;
  title: string;
};

export function AuthLayout({
  children,
  eyebrow = "Île-de-France Mobilités Connect",
  illustrationAlt = "Illustration Île-de-France Mobilités",
  illustrationSrc = "/assets/illustrations/station-waiting-area.png",
  subtitle,
  title,
}: AuthLayoutProps) {
  return (
    <main className="min-h-screen bg-neutral-xlight">
      <AppNavbar />
      <section className="mx-auto grid w-full max-w-6xl gap-8 px-5 py-8 lg:grid-cols-[0.9fr_1.1fr] lg:py-12">
        <aside className="lg:sticky lg:top-8 lg:self-start">
          <p className="text-sm font-bold text-idfm-interaction">{eyebrow}</p>
          <h1 className="mt-3 text-3xl font-bold leading-tight text-idfm-anthracite sm:text-4xl">{title}</h1>
          <p className="mt-4 max-w-xl text-base leading-7 text-neutral-medium">{subtitle}</p>
          <Image
            src={illustrationSrc}
            alt={illustrationAlt}
            width={520}
            height={360}
            className="mt-8 hidden w-full max-w-md rounded-3xl border border-neutral-light bg-white p-4 shadow-sm lg:block"
          />
        </aside>
        <div>{children}</div>
      </section>
    </main>
  );
}
