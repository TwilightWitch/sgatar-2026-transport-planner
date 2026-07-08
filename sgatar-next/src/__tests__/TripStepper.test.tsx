/**
 * @file Tests for TripStepper accessibility and state rendering.
 */
import { TripStepper } from "@/components/delegate/TripStepper";
import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

describe("TripStepper", () => {
  it("announces the current step for screen readers", () => {
    render(<TripStepper status="boarding" />);

    expect(
      screen.getByText("Current trip step: Boarding", { selector: ".sr-only" }),
    ).toBeTruthy();
  });

  it("maps en_route to En Route active state", () => {
    render(<TripStepper status="en_route" />);

    expect(
      screen.getByText("Current trip step: En Route", { selector: ".sr-only" }),
    ).toBeTruthy();
  });

  it("maps completed to Arrived active state", () => {
    render(<TripStepper status="completed" />);

    expect(
      screen.getByText("Current trip step: Arrived", { selector: ".sr-only" }),
    ).toBeTruthy();
  });
});
