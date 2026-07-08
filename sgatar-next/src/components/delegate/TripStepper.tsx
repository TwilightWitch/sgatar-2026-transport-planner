/**
 * @file TripStepper component.
 *
 * Renders an accessible four-step horizontal progress indicator for trip status.
 */
"use client";

import type { TripWithRoute } from "@/hooks/useLiveFleet";

interface TripStepperProps {
  /** Current trip lifecycle status from the database enum. */
  status: TripWithRoute["status"];
}

interface StepDefinition {
  id: number;
  label: string;
}

const STEP_SEQUENCE: StepDefinition[] = [
  { id: 1, label: "Scheduled" },
  { id: 2, label: "Boarding" },
  { id: 3, label: "En Route" },
  { id: 4, label: "Arrived" },
];

function toActiveStep(status: TripWithRoute["status"]): number {
  if (status === "scheduled") return 1;
  if (status === "boarding") return 2;
  if (status === "departed_origin" || status === "en_route" || status === "delayed") {
    return 3;
  }
  return 4;
}

/**
 * Accessible horizontal milestone indicator using high-contrast state colors.
 */
export function TripStepper({ status }: Readonly<TripStepperProps>) {
  const activeStep = toActiveStep(status);
  const activeLabel = STEP_SEQUENCE.find((step) => step.id === activeStep)?.label;

  return (
    <div
      className="mt-2"
      role="group"
      aria-label="Trip progress tracker"
    >
      <span className="sr-only">Current trip step: {activeLabel}</span>
      <ol className="flex items-center gap-2" aria-hidden="true">
        {STEP_SEQUENCE.map((step, index) => {
          const isCompleted = step.id < activeStep;
          const isActive = step.id === activeStep;
          const circleStyle = isCompleted
            ? "bg-emerald-600 text-white"
            : isActive
              ? "bg-blue-600 text-white"
              : "bg-gray-200 text-gray-600 dark:bg-gray-700 dark:text-gray-300";
          const connectorStyle = step.id < activeStep ? "bg-emerald-600" : "bg-gray-300 dark:bg-gray-700";

          return (
            <li key={step.id} className="flex min-w-0 flex-1 items-center gap-2">
              <div className="flex min-w-0 flex-col items-center">
                <span
                  className={`inline-flex h-6 w-6 items-center justify-center rounded-full text-xs font-bold ${circleStyle}`}
                >
                  {step.id}
                </span>
                <span className="mt-1 text-[10px] font-semibold uppercase tracking-wide text-gray-600 dark:text-gray-300">
                  {step.label}
                </span>
              </div>
              {index < STEP_SEQUENCE.length - 1 && (
                <span className={`h-1 flex-1 rounded ${connectorStyle}`} />
              )}
            </li>
          );
        })}
      </ol>
    </div>
  );
}
