import { Fragment } from 'react';

type Step<T extends string> = {
  key: T;
  label: string;
};

type StepIndicatorProps<T extends string> = {
  steps: Step<T>[];
  current: T;
};

export function StepIndicator<T extends string>({ steps, current }: StepIndicatorProps<T>) {
  return (
    <div className="flex items-center gap-2">
      {steps.map((step, index) => (
        <Fragment key={step.key}>
          <div className="flex items-center gap-1.5">
            <div
              className={`h-2 w-2 rounded-full transition-colors ${
                step.key === current ? 'bg-blue-600' : 'bg-gray-300'
              }`}
            />
            <span
              className={`text-xs font-medium transition-colors ${
                step.key === current ? 'text-blue-600' : 'text-gray-400'
              }`}
            >
              {step.label}
            </span>
          </div>
          {index < steps.length - 1 && <div className="h-px flex-1 bg-gray-200" />}
        </Fragment>
      ))}
    </div>
  );
}
