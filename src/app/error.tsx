"use client";

import { useEffect } from "react";
import { AlertTriangle } from "lucide-react";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Dashboard error:", error);
  }, [error]);

  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="glass-card p-8 rounded-2xl text-center max-w-sm space-y-4">
        <div className="w-12 h-12 rounded-full bg-rose-500/10 border border-rose-500/20 flex items-center justify-center mx-auto text-rose-400">
          <AlertTriangle size={24} />
        </div>
        <h2 className="text-xl font-bold text-zinc-100">Something went wrong</h2>
        <p className="text-sm text-zinc-400 leading-relaxed">
          {error.message || "Failed to load dashboard data. Please try again."}
        </p>
        <button
          onClick={reset}
          className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-500 active:scale-[0.98] text-pure-white rounded-xl text-sm font-medium transition-all"
        >
          Try again
        </button>
      </div>
    </div>
  );
}
