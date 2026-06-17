import Image from "next/image";
import Link from "next/link";
import type { ReactNode } from "react";
import { Button } from "../atoms/Button";
import { FamilyDashboardHeader } from "../organisms/FamilyDashboardHeader";
import { FamilyDashboardTabs } from "../organisms/FamilyDashboardTabs";

type BreadcrumbItem = {
  href?: string;
  label: string;
};

type DashboardLayoutProps = {
  activeTab: string;
  basePath?: string;
  breadcrumbs: BreadcrumbItem[];
  children: ReactNode;
  showTabs?: boolean;
  showHeaderAction?: boolean;
  subtitle: string;
  summaryItems?: string[];
  title: string;
  userName?: string;
};

const headerLinks = ["Me deplacer", "Tarifs", "Services", "Infos"];

const footerColumns = [
  {
    title: "A propos",
    links: ["Qui sommes-nous ?", "Services de mobilite", "Nous rejoindre", "Presse"],
  },
  {
    title: "Donnees & innovation",
    links: ["Preparer l'avenir", "Observatoire de la mobilite", "Open data", "Le Lab"],
  },
  {
    title: "Marches & concurrence",
    links: ["Mise en concurrence", "Marches publics", "Investisseurs"],
  },
];

export function DashboardLayout({
  activeTab,
  basePath = "/dashboard/family",
  breadcrumbs,
  children,
  showHeaderAction = true,
  showTabs = true,
  subtitle,
  summaryItems,
  title,
  userName,
}: DashboardLayoutProps) {
  return (
    <main className="min-h-screen bg-neutral-xlight">
      <header className="border-b border-white/10 bg-idfm-anthracite text-white">
        <div className="border-b border-white/10 px-5 py-2">
          <div className="mx-auto flex max-w-7xl items-center justify-between text-xs">
            <Link href="/" className="hover:underline">Qui sommes-nous ?</Link>
            <div className="flex items-center gap-4">
              <span>Points de vente</span>
              <span>Aide et contacts</span>
              <span>FR</span>
            </div>
          </div>
        </div>
        <div className="px-5 py-4">
          <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-8">
              <Link href="/">
                <Image
                  src="/assets/logos/idfm-wordmark-horizontal.png"
                  alt="Ile-de-France Mobilites"
                  width={176}
                  height={42}
                  className="h-10 w-auto"
                />
              </Link>
              <nav className="hidden items-center gap-6 lg:flex">
                {headerLinks.map((link) => (
                  <button key={link} type="button" className="text-sm font-medium hover:text-idfm-blue">
                    {link}
                  </button>
                ))}
              </nav>
            </div>

            <div className="flex items-center gap-3">
              <button
                type="button"
                className="hidden min-h-11 rounded-xl border border-white/30 px-4 text-sm font-medium hover:bg-white/10 sm:inline-flex sm:items-center"
              >
                Recherche
              </button>
              {userName ? (
                <span className="inline-flex min-h-11 items-center rounded-xl bg-white px-4 text-sm font-semibold text-idfm-interaction">
                  {userName}
                </span>
              ) : (
                <Link href="/login" className="contents">
                  <Button type="button" variant="secondary">Mon espace</Button>
                </Link>
              )}
            </div>
          </div>
        </div>
      </header>

      <section className="mx-auto w-full max-w-7xl px-5 py-6">
        <nav aria-label="Fil d'ariane" className="text-sm text-neutral-medium">
          <ol className="flex flex-wrap items-center gap-2">
            {breadcrumbs.map((item, index) => (
              <li key={`${item.label}-${index}`} className="flex items-center gap-2">
                {item.href ? (
                  <Link href={item.href} className="text-idfm-interaction hover:underline">
                    {item.label}
                  </Link>
                ) : (
                  <span>{item.label}</span>
                )}
                {index < breadcrumbs.length - 1 ? <span aria-hidden="true">›</span> : null}
              </li>
            ))}
          </ol>
        </nav>

        <div className="mt-6">
          <FamilyDashboardHeader
            action={showHeaderAction ? (
                <Link href="/dashboard/family?tab=help" className="contents">
                  <Button type="button" variant="secondary">Gerer mes informations</Button>
                </Link>
              ) : undefined}
            subtitle={subtitle}
            summaryItems={summaryItems}
            title={title}
          />
        </div>

        {showTabs ? (
          <div className="mt-8">
            <FamilyDashboardTabs activeTab={activeTab} basePath={basePath} />
          </div>
        ) : null}

        <div className="py-8">{children}</div>
      </section>

      <footer className="mt-10 bg-idfm-anthracite px-5 py-12 text-white">
        <div className="mx-auto grid max-w-7xl gap-10 lg:grid-cols-[1.2fr_1fr_1fr_1fr]">
          <div>
            <Image
              src="/assets/logos/idfm-logo-horizontal.png"
              alt="Ile-de-France Mobilites"
              width={220}
              height={56}
              className="h-12 w-auto"
            />
            <p className="mt-4 max-w-sm text-sm leading-6 text-white/75">
              Un espace famille plus simple pour suivre les titres, les dossiers et les prochaines actions de votre foyer.
            </p>
            <div className="mt-5 rounded-2xl bg-white/5 p-4">
              <Image
                src="/assets/illustrations/modern-station-entrance.png"
                alt="Station Île-de-France Mobilités"
                width={280}
                height={180}
                className="h-auto w-full rounded-xl object-contain"
              />
            </div>
          </div>

          {footerColumns.map((column) => (
            <div key={column.title}>
              <h2 className="text-base font-semibold">{column.title}</h2>
              <ul className="mt-4 grid gap-3 text-sm text-white/75">
                {column.links.map((link) => (
                  <li key={link}>{link}</li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </footer>
    </main>
  );
}
