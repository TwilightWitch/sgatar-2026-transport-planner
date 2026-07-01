import type { ReactNode } from "react";

export default function LoLayout({ children }: Readonly<{ children: ReactNode }>) {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      <header className="border-b border-gray-200 bg-white px-4 py-3 dark:border-gray-800 dark:bg-gray-900">
        <div className="mx-auto flex max-w-lg items-center justify-between">
          <h1 className="text-lg font-bold text-brand-900 dark:text-brand-100">
            LO Portal
          </h1>
          <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-medium text-emerald-800 dark:bg-emerald-900 dark:text-emerald-200">
            Active
          </span>
        </div>
      </header>
      <main className="mx-auto max-w-lg px-4 py-4">{children}</main>
    </div>
  );
}
