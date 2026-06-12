import { Loader2 } from "lucide-react";

export default function Loading() {
  return (
    <div className="flex-1 flex flex-col items-center justify-center min-h-[60vh] text-slate-500">
      <Loader2 className="w-10 h-10 animate-spin text-sky-500 mb-4" />
      <h2 className="text-xl font-semibold tracking-tight text-slate-300">Loading data...</h2>
      <p className="text-sm mt-2">Fetching live metrics from Azure DevOps.</p>
    </div>
  );
}
