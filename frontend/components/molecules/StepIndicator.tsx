type StepIndicatorProps = {
  currentStep: number;
  steps: string[];
};

export function StepIndicator({ currentStep, steps }: StepIndicatorProps) {
  return (
    <nav aria-label="Progression" className="w-full">
      <ol className="flex gap-2 overflow-x-auto pb-1">
        {steps.map((step, index) => {
          const active = index === currentStep;
          const completed = index < currentStep;

          return (
            <li key={step} className="min-w-0 flex-1">
              <div
                className={`h-2 rounded-full ${
                  active || completed ? "bg-idfm-interaction" : "bg-neutral-light"
                }`}
              />
              <span className={`mt-2 block text-xs font-semibold ${active ? "text-idfm-focus" : "text-neutral-medium"}`}>
                {step}
              </span>
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
