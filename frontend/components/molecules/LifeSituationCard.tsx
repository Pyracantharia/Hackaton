type LifeSituationCardProps = {
  description: string;
  disabled?: boolean;
  isSelected: boolean;
  label: string;
  onSelect: () => void;
};

export function LifeSituationCard({
  description,
  disabled = false,
  isSelected,
  label,
  onSelect,
}: LifeSituationCardProps) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onSelect}
      className={`rounded-2xl border p-5 text-left shadow-sm transition focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-idfm-focus disabled:cursor-not-allowed disabled:opacity-70 ${
        isSelected ? "border-idfm-interaction bg-idfm-light" : "border-neutral-light bg-white hover:border-idfm-medium"
      }`}
    >
      <div className="flex items-start justify-between gap-3">
        <h3 className="text-lg font-bold text-idfm-anthracite">{label}</h3>
      </div>
      <p className="mt-2 text-sm leading-6 text-neutral-medium">{description}</p>
    </button>
  );
}
