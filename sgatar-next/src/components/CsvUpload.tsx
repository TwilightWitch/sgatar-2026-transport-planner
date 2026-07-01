"use client";

import { Upload } from "lucide-react";
import { useRef, useState } from "react";

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

    const formData = new FormData();
    formData.append("file", file);

    interface UploadResponse {
      message?: string;
      error?: string;
    }

    void fetch("/api/trips/upload", { method: "POST", body: formData })
      .then(async (res) => {
        const data = (await res.json()) as UploadResponse;
        if (res.ok) {
          setStatus(data.message ?? "Upload complete");
          onUploaded();
        } else {
          setStatus(`Error: ${data.error ?? "Unknown error"}`);
        }
      })
      .catch(() => setStatus("Upload failed — check network connection"))
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
      <p className="mb-3 text-xs text-gray-500 dark:text-gray-400">
        Upload a CSV to bulk update or add trips. Supported columns: day,
        svc/service, bus/busIdentifier, from, to, dep, arv, cap, pax,
        driverName, driverPhone, plateNumber, note
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
