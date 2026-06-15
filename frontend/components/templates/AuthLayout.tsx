import type { ReactNode } from "react";
import Image from "next/image";

type AuthLayoutProps = {
  children: ReactNode;
  eyebrow?: string;
  subtitle: string;
  title: string;
};

export function AuthLayout({ children, eyebrow = "Île-de-France Mobilités Connect", subtitle, title }: AuthLayoutProps) {
  return (
    <main className="min-h-screen bg-neutral-xlight">
      <header className="border-b border-neutral-light bg-idfm-anthracite px-5 py-4 text-white">
        <div className="mx-auto flex max-w-6xl items-center justify-between">
          <Image src="/assets/logos/idfm-connect-logo.svg" alt="Île-de-France Mobilités Connect" width={240} height={48} className="h-8 w-auto brightness-0 invert" />
          <span className="rounded-md border border-white/25 px-3 py-2 text-sm">Mon espace</span>
        </div>
      </header>
      <section className="mx-auto grid w-full max-w-6xl gap-8 px-5 py-8 lg:grid-cols-[0.9fr_1.1fr] lg:py-12">
        <aside className="lg:sticky lg:top-8 lg:self-start">
          <p className="text-sm font-bold text-idfm-interaction">{eyebrow}</p>
          <h1 className="mt-3 text-3xl font-bold leading-tight text-idfm-anthracite sm:text-4xl">{title}</h1>
          <p className="mt-4 max-w-xl text-base leading-7 text-neutral-medium">{subtitle}</p>
          <Image
            src="/assets/illustrations/register-family.svg"
            alt=""
            width={420}
            height={260}
            aria-hidden="true"
            className="mt-8 hidden w-full max-w-sm lg:block"
          />
        </aside>
        <div>{children}</div>
      </section>
    </main>
  );
}
