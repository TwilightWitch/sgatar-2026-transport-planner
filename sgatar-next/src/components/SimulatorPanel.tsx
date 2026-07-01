"use client";

import type { TripWithRoute } from "@/hooks/useLiveFleet";
import {
  type Bus,
  type MonteCarloResult,
  type SimulationResult,
  mcFleetDelta,
  runMonteCarlo,
  simulate,
} from "@/lib/simulationEngine";
import { useCallback, useRef, useState } from "react";

interface SimulatorPanelProps {
  trips: TripWithRoute[];
}

function getBarColor(ratio: number): string {
  if (ratio >= 1) return "bg-red-500";
  if (ratio >= 0.8) return "bg-amber-500";
  return "bg-emerald-500";
}

function getStatusLabel(ratio: number): string {
  if (ratio >= 1) return "Over";
  if (ratio >= 0.8) return "Near Full";
  return "OK";
}

function getStatusColor(ratio: number): string {
  if (ratio >= 1) return "text-red-600 dark:text-red-400";
  if (ratio >= 0.8) return "text-amber-600 dark:text-amber-400";
  return "text-emerald-600 dark:text-emerald-400";
}

function formatPercent(v: number): string {
  return `${(v * 100).toFixed(1)}%`;
}

/** Check whether a service has multiple buses for meaningful simulation */
function hasMultipleBuses(trips: TripWithRoute[], service: string): boolean {
  const [day, svc] = service.split(" — ");
  const count = trips.filter(
    (t) => t.conferenceDay === day && t.serviceName === svc,
  ).length;
  return count > 1;
}

export function SimulatorPanel({ trips }: Readonly<SimulatorPanelProps>) {
  const services = [
    ...new Set(trips.map((t) => `${t.conferenceDay} — ${t.serviceName}`)),
  ];

  const [selectedService, setSelectedService] = useState(services[0] ?? "");
  const [guests, setGuests] = useState(190);
  const [buffer, setBuffer] = useState(10);
  const [variability, setVariability] = useState(30);
  const [mcRuns, setMcRuns] = useState(1000);
  const [simResult, setSimResult] = useState<SimulationResult | null>(null);
  const [simServiceLabel, setSimServiceLabel] = useState("");
  const [mcResult, setMcResult] = useState<MonteCarloResult | null>(null);
  const [mcMinus, setMcMinus] = useState<MonteCarloResult | null>(null);
  const [mcPlus, setMcPlus] = useState<MonteCarloResult | null>(null);
  const [mcServiceLabel, setMcServiceLabel] = useState("");
  const [isRunning, setIsRunning] = useState(false);
  const seedRef = useRef(42);

  const canSimulate = hasMultipleBuses(trips, selectedService);

  const getServiceBuses = useCallback((): Bus[] => {
    const [day, svc] = selectedService.split(" — ");
    return trips
      .filter((t) => t.conferenceDay === day && t.serviceName === svc)
      .map((t) => ({
        id: t.busIdentifier,
        capacity: t.maxCapacity,
        from: t.pickupLocation,
        to: t.dropoffLocation,
      }));
  }, [selectedService, trips]);

  const handleSimulate = useCallback(() => {
    if (isRunning || !canSimulate) return;
    setIsRunning(true);
    seedRef.current = Math.floor(Math.random() * 100000);
    const buses = getServiceBuses();
    if (buses.length === 0) {
      setIsRunning(false);
      return;
    }
    const result = simulate(
      buses,
      guests,
      buffer,
      variability,
      seedRef.current,
    );
    setSimResult(result);
    setSimServiceLabel(selectedService);
    requestAnimationFrame(() => setIsRunning(false));
  }, [
    isRunning,
    canSimulate,
    getServiceBuses,
    guests,
    buffer,
    variability,
    selectedService,
  ]);

  const handleRepeatedSims = useCallback(() => {
    if (isRunning || !canSimulate) return;
    setIsRunning(true);
    seedRef.current = Math.floor(Math.random() * 100000);
    const buses = getServiceBuses();
    if (buses.length === 0) {
      setIsRunning(false);
      return;
    }
    const result = runMonteCarlo(buses, guests, buffer, variability, mcRuns);
    const minus = mcFleetDelta(buses, guests, buffer, variability, mcRuns, -1);
    const plus = mcFleetDelta(buses, guests, buffer, variability, mcRuns, 1);
    setMcResult(result);
    setMcMinus(minus);
    setMcPlus(plus);
    setMcServiceLabel(selectedService);
    requestAnimationFrame(() => setIsRunning(false));
  }, [
    isRunning,
    canSimulate,
    getServiceBuses,
    guests,
    buffer,
    variability,
    mcRuns,
    selectedService,
  ]);

  return (
    <section className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-700 dark:bg-gray-900">
      <h2 className="mb-4 text-lg font-semibold text-gray-900 dark:text-white">
        Demand Simulator
      </h2>

      <div className="mb-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <div className="sm:col-span-2">
          <label
            htmlFor="sim-service"
            className="block text-xs font-medium text-gray-600 dark:text-gray-400"
          >
            Service
          </label>
          <select
            id="sim-service"
            value={selectedService}
            onChange={(e) => setSelectedService(e.target.value)}
            className="mt-1 w-full rounded-md border border-gray-300 px-2 py-1.5 text-sm dark:border-gray-600 dark:bg-gray-800 dark:text-white"
          >
            {services.map((s) => (
              <option key={s} value={s} disabled={!hasMultipleBuses(trips, s)}>
                {s}
                {!hasMultipleBuses(trips, s) ? " (single bus)" : ""}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label
            htmlFor="sim-guests"
            className="block text-xs font-medium text-gray-600 dark:text-gray-400"
          >
            Total Guests
          </label>
          <input
            id="sim-guests"
            type="number"
            min={1}
            value={guests}
            onChange={(e) => setGuests(Number(e.target.value))}
            className="mt-1 w-full rounded-md border border-gray-300 px-2 py-1.5 text-sm dark:border-gray-600 dark:bg-gray-800 dark:text-white"
          />
        </div>
        <div>
          <label
            htmlFor="sim-buffer"
            className="block text-xs font-medium text-gray-600 dark:text-gray-400"
          >
            Buffer %
          </label>
          <input
            id="sim-buffer"
            type="number"
            min={0}
            max={50}
            value={buffer}
            onChange={(e) => setBuffer(Number(e.target.value))}
            className="mt-1 w-full rounded-md border border-gray-300 px-2 py-1.5 text-sm dark:border-gray-600 dark:bg-gray-800 dark:text-white"
          />
        </div>
        <div>
          <label
            htmlFor="sim-var"
            className="block text-xs font-medium text-gray-600 dark:text-gray-400"
          >
            Variability %
          </label>
          <input
            id="sim-var"
            type="number"
            min={0}
            max={100}
            value={variability}
            onChange={(e) => setVariability(Number(e.target.value))}
            className="mt-1 w-full rounded-md border border-gray-300 px-2 py-1.5 text-sm dark:border-gray-600 dark:bg-gray-800 dark:text-white"
          />
        </div>
        <div>
          <label
            htmlFor="sim-mc-runs"
            className="block text-xs font-medium text-gray-600 dark:text-gray-400"
          >
            Iterations
          </label>
          <input
            id="sim-mc-runs"
            type="number"
            min={100}
            max={100000}
            step={100}
            value={mcRuns}
            onChange={(e) => setMcRuns(Number(e.target.value))}
            className="mt-1 w-full rounded-md border border-gray-300 px-2 py-1.5 text-sm dark:border-gray-600 dark:bg-gray-800 dark:text-white"
          />
        </div>
      </div>

      {!canSimulate && (
        <p className="mb-3 text-xs text-amber-600 dark:text-amber-400">
          This service has only one bus — simulation requires multiple buses to
          model demand distribution.
        </p>
      )}

      <div className="flex gap-3">
        <button
          type="button"
          onClick={handleSimulate}
          disabled={!canSimulate || isRunning}
          className="rounded-md bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-700 disabled:cursor-not-allowed disabled:opacity-50"
        >
          Run Simulation
        </button>
        <button
          type="button"
          onClick={handleRepeatedSims}
          disabled={!canSimulate || isRunning}
          className="rounded-md bg-accent-600 px-4 py-2 text-sm font-medium text-white hover:bg-accent-700 disabled:cursor-not-allowed disabled:opacity-50"
        >
          Repeated Simulations
        </button>
      </div>

      {/* Single simulation results */}
      {simResult && (
        <div className="mt-6 rounded-lg border border-gray-200 p-4 dark:border-gray-700">
          <h3 className="mb-3 text-sm font-semibold text-gray-800 dark:text-gray-200">
            Simulation: {simServiceLabel}
          </h3>
          <div className="mb-3 grid grid-cols-3 gap-3 sm:grid-cols-6">
            <Stat label="Guests" value={simResult.totalGuests} />
            <Stat label="Seats" value={simResult.totalCapacity} />
            <Stat
              label={`Usable (−${simResult.bufferPercent}%)`}
              value={simResult.usableSeats}
            />
            <Stat
              label="Fill Rate"
              value={`${Math.round(simResult.overallFillRatio * 100)}%`}
            />
            <Stat label="Buses" value={simResult.buses.length} />
            <Stat label="Over Cap" value={simResult.overCapacityCount} />
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="border-b text-gray-500 dark:text-gray-400">
                <tr>
                  <th className="px-2 py-1">Bus</th>
                  <th className="px-2 py-1">From</th>
                  <th className="px-2 py-1">To</th>
                  <th className="px-2 py-1">Load</th>
                  <th className="px-2 py-1">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                {simResult.buses.map((bus) => (
                  <tr key={String(bus.id)}>
                    <td className="px-2 py-1 font-medium">{String(bus.id)}</td>
                    <td className="px-2 py-1">{bus.from}</td>
                    <td className="px-2 py-1">{bus.to}</td>
                    <td className="px-2 py-1">
                      <div className="flex items-center gap-2">
                        <div className="h-2 w-16 overflow-hidden rounded-full bg-gray-200 dark:bg-gray-700">
                          <div
                            className={`h-full rounded-full ${getBarColor(bus.fillRatio)}`}
                            style={{
                              width: `${Math.min(Math.round(bus.fillRatio * 100), 100)}%`,
                            }}
                          />
                        </div>
                        <span>
                          {bus.simulatedPax}/{bus.capacity}
                        </span>
                      </div>
                    </td>
                    <td
                      className={`px-2 py-1 font-medium ${getStatusColor(bus.fillRatio)}`}
                    >
                      {getStatusLabel(bus.fillRatio)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Repeated simulation results */}
      {mcResult && (
        <div className="mt-6 rounded-lg border border-accent-100 bg-accent-50/50 p-4 dark:border-accent-700/30 dark:bg-accent-700/10">
          <h3 className="mb-3 text-sm font-semibold text-gray-800 dark:text-gray-200">
            Repeated Simulations: {mcServiceLabel} (
            {mcResult.runs.toLocaleString()} iterations)
          </h3>
          <div className="mb-3 grid grid-cols-2 gap-3 sm:grid-cols-4">
            <Stat
              label="P(any overload)"
              value={formatPercent(mcResult.probabilityAnyOver)}
            />
            <Stat
              label="Avg buses over"
              value={mcResult.averageOverCount.toFixed(2)}
            />
            <Stat label="Max buses over" value={mcResult.maxOverCount} />
            <Stat label="Usable seats" value={mcResult.usableSeats} />
          </div>

          <h4 className="mb-2 text-xs font-medium text-gray-600 dark:text-gray-400">
            Fleet Size Impact
          </h4>
          <table className="w-full text-left text-xs">
            <thead className="border-b text-gray-500 dark:text-gray-400">
              <tr>
                <th className="px-2 py-1">Scenario</th>
                <th className="px-2 py-1">P(overload)</th>
                <th className="px-2 py-1">Change</th>
                <th className="px-2 py-1">Avg Over</th>
                <th className="px-2 py-1">Max Over</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
              {mcMinus && (
                <tr>
                  <td className="px-2 py-1">
                    −1 bus ({mcMinus.totalCapacity} seats)
                  </td>
                  <td className="px-2 py-1">
                    {formatPercent(mcMinus.probabilityAnyOver)}
                  </td>
                  <td className="px-2 py-1">
                    <DeltaIndicator
                      baseline={mcResult.probabilityAnyOver}
                      compare={mcMinus.probabilityAnyOver}
                    />
                  </td>
                  <td className="px-2 py-1">
                    {mcMinus.averageOverCount.toFixed(2)}
                  </td>
                  <td className="px-2 py-1">{mcMinus.maxOverCount}</td>
                </tr>
              )}
              <tr className="font-medium">
                <td className="px-2 py-1">
                  Current ({mcResult.totalCapacity} seats)
                </td>
                <td className="px-2 py-1">
                  {formatPercent(mcResult.probabilityAnyOver)}
                </td>
                <td className="px-2 py-1">—</td>
                <td className="px-2 py-1">
                  {mcResult.averageOverCount.toFixed(2)}
                </td>
                <td className="px-2 py-1">{mcResult.maxOverCount}</td>
              </tr>
              {mcPlus && (
                <tr>
                  <td className="px-2 py-1">
                    +1 bus ({mcPlus.totalCapacity} seats)
                  </td>
                  <td className="px-2 py-1">
                    {formatPercent(mcPlus.probabilityAnyOver)}
                  </td>
                  <td className="px-2 py-1">
                    <DeltaIndicator
                      baseline={mcResult.probabilityAnyOver}
                      compare={mcPlus.probabilityAnyOver}
                    />
                  </td>
                  <td className="px-2 py-1">
                    {mcPlus.averageOverCount.toFixed(2)}
                  </td>
                  <td className="px-2 py-1">{mcPlus.maxOverCount}</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}

function Stat({
  label,
  value,
}: Readonly<{ label: string; value: string | number }>) {
  return (
    <div className="text-center">
      <div className="text-lg font-bold text-gray-900 dark:text-white">
        {value}
      </div>
      <div className="text-[10px] text-gray-500 dark:text-gray-400">
        {label}
      </div>
    </div>
  );
}

function DeltaIndicator({
  baseline,
  compare,
}: Readonly<{ baseline: number; compare: number }>) {
  const delta = (compare - baseline) * 100;
  if (delta > 0.05) {
    return (
      <span className="text-red-600 dark:text-red-400">
        ▲ +{Math.abs(delta).toFixed(1)}%
      </span>
    );
  }
  if (delta < -0.05) {
    return (
      <span className="text-emerald-600 dark:text-emerald-400">
        ▼ −{Math.abs(delta).toFixed(1)}%
      </span>
    );
  }
  return <span className="text-gray-400">—</span>;
}
