"use client";

import { useEffect } from "react";
import { AlertTriangle, ArrowLeft } from "lucide-react";
import Link from "next/link";

export default function SettingsError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Settings error:", error);
  }, [error]);

  return (
    <div className="min-h-screen flex flex-col gap-6 p-4 pt-12 pb-32">
      <header className="flex items-center gap-4 px-2">
        <Link href="/" className="w-10 h-10 rounded-full glass flex items-center justify-center text-white transition-transform active:scale-95">
          <ArrowLeft size={20} />
        </Link>
        <div>
          <h2 className="text-xs font-semibold tracking-widest text-zinc-400 uppercase">Preferences</h2>
          <h1 className="text-2xl font-bold text-zinc-100">Error</h1>
        </div>
      </header>

      <section className="glass-card p-8 rounded-2xl text-center max-w-sm mx-auto space-y-4">
        <div className="w-12 h-12 rounded-full bg-rose-500/10 border border-rose-500/20 flex items-center justify-center mx-auto text-rose-400">
          <AlertTriangle size={24} />
        </div>
        <h2 className="text-lg font-bold text-zinc-100">Failed to load settings</h2>
        <p className="text-xs text-zinc-400 leading-relaxed">
          We encountered an issue loading settings form data.
        </p>
        <button
          onClick={reset}
          className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-500 active:scale-[0.98] text-pure-white rounded-xl text-sm font-medium transition-all"
        >
          Retry
        </button>
      </section>
    </div>
  );
}
