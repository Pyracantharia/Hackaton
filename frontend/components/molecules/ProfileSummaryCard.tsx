import { Badge } from "../atoms/Badge";

type ProfileSummaryCardProps = {
  badges: string[];
  name: string;
  subtitle: string;
};

export function ProfileSummaryCard({ badges, name, subtitle }: ProfileSummaryCardProps) {
  return (
    <article className="rounded-md border border-neutral-light bg-white p-4">
      <h3 className="text-base font-bold text-idfm-anthracite">{name}</h3>
      <p className="mt-1 text-sm text-neutral-medium">{subtitle}</p>
      <div className="mt-3 flex flex-wrap gap-2">
        {badges.map((badge) => (
          <Badge key={badge}>{badge}</Badge>
        ))}
      </div>
    </article>
  );
}
