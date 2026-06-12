"use client";

import { AlertTriangle } from "lucide-react";
import { useEffect } from "react";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Application Error:", error);
  }, [error]);

  return (
    <div className="flex-1 flex flex-col items-center justify-center min-h-[60vh] text-slate-500">
      <AlertTriangle className="w-12 h-12 text-red-500 mb-4" />
      <h2 className="text-2xl font-bold tracking-tight text-slate-100">Something went wrong!</h2>
      <p className="text-sm mt-2 text-slate-400 max-w-md text-center">
        We encountered an issue while rendering this page or fetching data from Azure DevOps.
      </p>
      <button
        onClick={() => reset()}
        className="mt-6 bg-sky-500 hover:bg-sky-600 text-slate-950 font-semibold px-6 py-2 rounded-lg transition-all shadow-lg"
      >
        Try again
      </button>
    </div>
  );
}
