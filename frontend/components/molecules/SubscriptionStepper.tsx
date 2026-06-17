type SubscriptionStepperProps = {
  currentStep: number;
  steps: string[];
};

export function SubscriptionStepper({ currentStep, steps }: SubscriptionStepperProps) {
  return (
    <ol className="grid gap-2 sm:grid-cols-4">
      {steps.map((step, index) => {
        const isActive = index === currentStep;
        const isDone = index < currentStep;

        return (
          <li key={step} className="flex items-center gap-3">
            <span
              className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-sm font-bold ${
                isDone || isActive ? "bg-idfm-interaction text-white" : "bg-neutral-light text-neutral-medium"
              }`}
            >
              {index + 1}
            </span>
            <span className={`text-sm font-semibold ${isActive ? "text-idfm-anthracite" : "text-neutral-medium"}`}>
              {step}
            </span>
          </li>
        );
      })}
    </ol>
  );
}
