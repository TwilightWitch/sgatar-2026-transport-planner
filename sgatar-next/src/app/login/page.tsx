"use client";

import { Bus, Lock } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useState } from "react";

function LoginForm() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const redirect = searchParams.get("redirect") ?? "/lo";
  const errorParam = searchParams.get("error");

  const [passcode, setPasscode] = useState("");
  const [portal, setPortal] = useState<"lo" | "admin">(
    redirect.startsWith("/admin") ? "admin" : "lo",
  );
  const [error, setError] = useState(
    errorParam === "insufficient_access"
      ? "You need admin access for this page."
      : "",
  );
  const [loading, setLoading] = useState(false);

  const handleSubmit = (e: { preventDefault: () => void }) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    fetch("/api/auth", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ passcode, portal }),
    })
      .then(async (res) => {
        if (res.ok) {
          router.push(redirect);
        } else {
          const data = (await res.json()) as { error: string };
          setError(data.error);
        }
      })
      .catch(() => {
        setError("Network error. Please try again.");
      })
      .finally(() => {
        setLoading(false);
      });
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4 dark:bg-gray-950">
      <div className="w-full max-w-sm">
        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-brand-100 dark:bg-brand-900">
            <Bus
              className="h-7 w-7 text-brand-600 dark:text-brand-400"
              aria-hidden="true"
            />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            SGATAR 2026
          </h1>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Transport Operations Access
          </p>
        </div>

        <form
          onSubmit={handleSubmit}
          className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-700 dark:bg-gray-900"
        >
          <div className="space-y-4">
            <div>
              <label
                htmlFor="portal-select"
                className="block text-sm font-medium text-gray-700 dark:text-gray-300"
              >
                Portal
              </label>
              <select
                id="portal-select"
                value={portal}
                onChange={(e) => setPortal(e.target.value as "lo" | "admin")}
                className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm dark:border-gray-600 dark:bg-gray-800 dark:text-white"
              >
                <option value="lo">Liaison Officer</option>
                <option value="admin">Admin / Control Room</option>
              </select>
            </div>

            <div>
              <label
                htmlFor="passcode-input"
                className="block text-sm font-medium text-gray-700 dark:text-gray-300"
              >
                Event Passcode
              </label>
              <div className="relative mt-1">
                <Lock
                  className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400"
                  aria-hidden="true"
                />
                <input
                  id="passcode-input"
                  type="password"
                  value={passcode}
                  onChange={(e) => setPasscode(e.target.value)}
                  required
                  autoComplete="current-password"
                  placeholder="Enter event passcode"
                  className="w-full rounded-lg border border-gray-300 py-2.5 pl-10 pr-3 text-sm dark:border-gray-600 dark:bg-gray-800 dark:text-white"
                />
              </div>
            </div>
          </div>

          {error && (
            <p
              className="mt-3 text-sm text-red-600 dark:text-red-400"
              role="alert"
            >
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={loading || !passcode}
            className="mt-6 w-full rounded-lg bg-brand-600 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-brand-700 disabled:opacity-50 dark:bg-brand-500 dark:hover:bg-brand-600"
          >
            {loading ? "Verifying..." : "Access Portal"}
          </button>
        </form>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-gray-50 dark:bg-gray-950">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-brand-500 border-t-transparent" />
        </div>
      }
    >
      <LoginForm />
    </Suspense>
  );
}
