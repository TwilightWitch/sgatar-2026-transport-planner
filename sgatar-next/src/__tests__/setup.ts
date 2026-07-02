import "@testing-library/jest-dom/vitest";
import { vi } from "vitest";

// Mock next/navigation (used by some components)
vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn(), replace: vi.fn(), back: vi.fn() }),
  useSearchParams: () => new URLSearchParams(),
  usePathname: () => "/",
}));

// Mock next/router (Pages Router)
vi.mock("next/router", () => ({
  useRouter: () => ({
    push: vi.fn(),
    replace: vi.fn(),
    back: vi.fn(),
    pathname: "/",
    query: {},
    isReady: true,
  }),
}));

// Mock next/headers (no longer used — kept for any residual imports)
vi.mock("next/headers", () => ({
  cookies: () => ({
    get: vi.fn(),
    set: vi.fn(),
    delete: vi.fn(),
  }),
}));

// Global fetch mock
globalThis.fetch = vi.fn();
