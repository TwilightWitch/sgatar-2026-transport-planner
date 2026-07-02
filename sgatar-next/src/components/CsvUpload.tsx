/**
 * @file CsvUpload component.
 *
 * Admin panel section that lets operators upload a CSV file to bulk-update or
 * add trips to the live roster.  Displays a human-readable column reference
 * table so operators know exactly what header names to use.
 *
 * On a successful upload the `onUploaded` callback is invoked so the parent
 * can invalidate its React Query cache and refresh the trip list.
 */
"use client";

import { Upload } from "lucide-react";
import { useRef, useState } from "react";

interface UploadResponse {
  message?: string;
  error?: string;
}

interface CsvUploadProps {
  onUploaded: () => void;
}

export function CsvUpload({ onUploaded }: Readonly<CsvUploadProps>) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [status, setStatus] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  const handleUpload = (file: File) => {
    setIsUploading(true);
    setStatus(null);

    void file
      .text()
      .then((csv) =>
        fetch("/api/trips/upload", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ csv }),
        }),
      )
      .then(async (res) => {
        const data = (await res.json()) as UploadResponse;
        if (res.ok) {
          setStatus(data.message ?? "Upload complete");
          onUploaded();
        } else {
          setStatus(`Error: ${data.error ?? "Unknown error"}`);
        }
      })
      .catch(() => setStatus("Upload failed. Check your network connection."))
      .finally(() => setIsUploading(false));
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleUpload(file);
  };

  return (
    <section className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm dark:border-gray-700 dark:bg-gray-900">
      <h3 className="mb-2 text-sm font-semibold text-gray-900 dark:text-white">
        Bulk CSV Upload
      </h3>
      <p className="mb-1 text-xs text-gray-500 dark:text-gray-400">
        Upload a CSV to bulk-update existing trips or add new ones. Rows are
        matched by Bus Identifier + Conference Day + Service Name. Recognised
        column names (header row required):
      </p>
      <div className="mb-3 overflow-x-auto rounded-lg border border-gray-100 dark:border-gray-700">
        <table className="w-full text-xs">
          <thead className="bg-gray-50 dark:bg-gray-800">
            <tr>
              <th className="px-2 py-1 text-left font-medium text-gray-600 dark:text-gray-400">
                Column header
              </th>
              <th className="px-2 py-1 text-left font-medium text-gray-600 dark:text-gray-400">
                What it sets
              </th>
              <th className="px-2 py-1 text-left font-medium text-gray-600 dark:text-gray-400">
                Example
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 dark:divide-gray-800 text-gray-700 dark:text-gray-300">
            {[
              ["bus", "Bus Identifier *", "BUS-01"],
              ["day", "Conference Day *", "7 Sep (Mon)"],
              ["service", "Service Name *", "Hotels → MBS"],
              ["from", "Pickup Location", "Rendezvous Hotel"],
              ["to", "Dropoff Location", "MBS"],
              ["dep", "Departure Time", "16:30"],
              ["arv", "Arrival Time", "16:50"],
              ["cap", "Bus Capacity", "40"],
              ["pax", "Current Passengers", "12"],
              ["driverName", "Driver Full Name", "Ahmad bin Salleh"],
              ["driverPhone", "Driver Phone", "+65 9123 4567"],
              ["plateNumber", "Vehicle Plate", "SBS1234A"],
              ["note", "Operational Note", "VIP coach"],
            ].map(([col, desc, ex]) => (
              <tr key={col}>
                <td className="px-2 py-1 font-mono">{col}</td>
                <td className="px-2 py-1">{desc}</td>
                <td className="px-2 py-1 text-gray-400 dark:text-gray-500">
                  {ex}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="mb-3 text-xs text-gray-400 dark:text-gray-500">
        * Required for matching. Columns marked * must be present to update an
        existing trip or create a new one.
      </p>

      <input
        ref={fileRef}
        type="file"
        accept=".csv,text/csv"
        onChange={handleFileChange}
        className="hidden"
        aria-label="Upload CSV file"
      />

      <button
        type="button"
        onClick={() => fileRef.current?.click()}
        disabled={isUploading}
        className="flex items-center gap-2 rounded-md border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-800"
      >
        <Upload className="h-4 w-4" aria-hidden="true" />
        {isUploading ? "Uploading..." : "Choose CSV File"}
      </button>

      {status && (
        <p
          className={`mt-2 text-xs ${status.startsWith("Error") ? "text-red-600" : "text-emerald-600"}`}
        >
          {status}
        </p>
      )}
    </section>
  );
}
