import type { ReactNode } from "react";

type FamilyDashboardHeaderProps = {
  action?: ReactNode;
  subtitle: string;
  summaryItems?: string[];
  title: string;
};

export function FamilyDashboardHeader({
  action,
  subtitle,
  summaryItems = [],
  title,
}: FamilyDashboardHeaderProps) {
  return (
    <section id="overview" className="rounded-[2rem] bg-idfm-light p-6 sm:p-8">
      <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
        <div className="max-w-3xl">
          <h1 className="text-4xl font-bold text-idfm-anthracite sm:text-5xl">{title}</h1>
          <p className="mt-4 max-w-2xl text-base leading-7 text-neutral-medium">{subtitle}</p>
        </div>
        {action}
      </div>
      {summaryItems.length ? (
        <div className="mt-6 flex flex-wrap gap-3">
          {summaryItems.map((item) => (
            <span
              key={item}
              className="rounded-full bg-white px-4 py-2 text-sm font-semibold text-idfm-anthracite shadow-sm"
            >
              {item}
            </span>
          ))}
        </div>
      ) : null}
    </section>
  );
}
