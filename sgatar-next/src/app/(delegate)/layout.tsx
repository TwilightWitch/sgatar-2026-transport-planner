import type { ReactNode } from "react";

export default function DelegateLayout({
  children,
}: Readonly<{ children: ReactNode }>) {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      <header className="border-b border-gray-200 bg-white px-4 py-3 dark:border-gray-800 dark:bg-gray-900">
        <div className="mx-auto flex max-w-4xl items-center justify-between">
          <h1 className="text-lg font-bold text-brand-900 dark:text-brand-100">
            SGATAR 2026
          </h1>
          <span className="text-xs text-gray-500 dark:text-gray-400">
            Delegate Transport
          </span>
        </div>
      </header>
      <main className="mx-auto max-w-4xl px-4 py-6">{children}</main>
    </div>
  );
}
