import type { ReactNode } from "react";

type AuthCardProps = {
  children: ReactNode;
  title: string;
};

export function AuthCard({ children, title }: AuthCardProps) {
  return (
    <section className="rounded-md border border-neutral-light bg-white p-5 shadow-sm sm:p-7">
      <h2 className="text-2xl font-bold text-idfm-anthracite">{title}</h2>
      <div className="mt-6">{children}</div>
    </section>
  );
}
