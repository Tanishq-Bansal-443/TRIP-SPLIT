import { Compass } from "lucide-react";

export default function Loading() {
  return (
    <div className="flex-1 flex flex-col items-center justify-center p-8">
      <div className="relative">
        <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-emerald-600 to-teal-500 flex items-center justify-center text-white shadow-lg shadow-emerald-500/20 animate-pulse">
          <Compass className="w-6 h-6 animate-spin" />
        </div>
      </div>
      <p className="mt-4 text-xs font-semibold uppercase tracking-wider text-zinc-400">
        Loading TRIP-SPLIT...
      </p>
    </div>
  );
}
