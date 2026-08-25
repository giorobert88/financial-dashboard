"use client";

import React, { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import type { PaydayConfig, PaydayFrequency } from "@/lib/payday";
import { updatePaydayConfigAction } from "../actions";
import { Calendar, Loader2, Check, AlertCircle, Save, CalendarDays, CalendarClock, Activity } from "lucide-react";

function formatDateString(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

interface PaydaySettingsClientProps {
  initialConfig: PaydayConfig;
}

export function PaydaySettingsClient({ initialConfig }: PaydaySettingsClientProps) {
  const router = useRouter();
  
  const [frequency, setFrequency] = useState<PaydayFrequency>(initialConfig.frequency || "monthly");
  const [ruleType, setRuleType] = useState<PaydayConfig["ruleType"]>(initialConfig.ruleType);
  const [fixedDate, setFixedDate] = useState<string>(
    initialConfig.fixedDate?.toString() || "20"
  );
  const [rollbackWeekend, setRollbackWeekend] = useState<boolean>(
    initialConfig.rollbackWeekend ?? true
  );
  const [anchorDate, setAnchorDate] = useState<string>(
    initialConfig.anchorDate || formatDateString(new Date())
  );

  const [isPending, startTransition] = useTransition();
  const [status, setStatus] = useState<{
    success?: boolean;
    message?: string;
  } | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setStatus(null);

    let parsedFixedDate: number | undefined = undefined;

    if (frequency === "monthly" && ruleType === "fixed_date") {
      const fd = parseInt(fixedDate, 10);
      if (isNaN(fd) || fd < 1 || fd > 31) {
        setStatus({ success: false, message: "Fixed Date must be a number between 1 and 31" });
        return;
      }
      parsedFixedDate = fd;
    }

    startTransition(async () => {
      const result = await updatePaydayConfigAction({
        frequency,
        ruleType: frequency === "monthly" ? ruleType : "fixed_date", // default if not used
        fixedDate: parsedFixedDate,
        rollbackWeekend: ruleType === "fixed_date" ? rollbackWeekend : undefined,
        anchorDate: frequency !== "monthly" ? anchorDate : undefined,
      });

      if (result.success) {
        setStatus({ success: true, message: "Payday configuration saved successfully!" });
        router.refresh();
        setTimeout(() => setStatus(null), 4000);
      } else {
        setStatus({ success: false, message: result.error || "Failed to save configuration" });
      }
    });
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-6">
      
      {/* Section 0: Choose Payday Frequency */}
      <section className="flex flex-col gap-3">
        <div className="flex items-center gap-2 px-2">
          <div className="w-6 h-6 rounded-full flex items-center justify-center bg-zinc-800 text-zinc-300">
            <Activity size={12} />
          </div>
          <h3 className="font-bold text-xs text-zinc-300 uppercase tracking-wider">
            Payday Frequency
          </h3>
        </div>

        <div className="glass-card p-4 flex flex-col gap-4">
          <p className="text-xs text-zinc-400 leading-relaxed">
            Select how often you get paid. This will adapt the dashboard, cycle boundaries, and charts.
          </p>

          <div className="grid grid-cols-3 gap-3">
            {[
              { id: "monthly", label: "Monthly" },
              { id: "bi_weekly", label: "Bi-Weekly" },
              { id: "weekly", label: "Weekly" },
            ].map((f) => (
              <button
                key={f.id}
                type="button"
                onClick={() => setFrequency(f.id as PaydayFrequency)}
                className={`p-3 rounded-xl border transition-all active:scale-[0.98] text-center ${
                  frequency === f.id
                    ? "bg-violet-500/10 border-violet-500/40 text-zinc-100"
                    : "bg-zinc-950/40 border-zinc-800/80 text-zinc-400 hover:border-zinc-700/85 hover:bg-zinc-900/20"
                }`}
              >
                <h4 className="text-xs font-semibold">{f.label}</h4>
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* Section 1: Choose Payday Rule (Monthly Only) */}
      {frequency === "monthly" && (
        <section className="flex flex-col gap-3 animate-fade-in">
          <div className="flex items-center gap-2 px-2">
            <div className="w-6 h-6 rounded-full flex items-center justify-center bg-zinc-800 text-zinc-300">
              <Calendar size={12} />
            </div>
            <h3 className="font-bold text-xs text-zinc-300 uppercase tracking-wider">
              Monthly Calculation Rule
            </h3>
          </div>

          <div className="glass-card p-4 flex flex-col gap-4">
            <p className="text-xs text-zinc-400 leading-relaxed">
              Select how your monthly pay cycle boundary is calculated.
            </p>

            <div className="grid grid-cols-1 gap-3">
              <button
                type="button"
                onClick={() => setRuleType("fixed_date")}
                className={`w-full text-left p-3.5 rounded-xl border transition-all active:scale-[0.99] flex items-start gap-3 ${
                  ruleType === "fixed_date"
                    ? "bg-violet-500/10 border-violet-500/40 text-zinc-100"
                    : "bg-zinc-950/40 border-zinc-800/80 text-zinc-400 hover:border-zinc-700/85 hover:bg-zinc-900/20"
                }`}
              >
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                  ruleType === "fixed_date" ? "bg-violet-500/20 text-violet-450" : "bg-zinc-900 text-zinc-400"
                }`}>
                  <Calendar size={16} />
                </div>
                <div>
                  <h4 className="text-xs font-semibold text-zinc-100">Fixed Date</h4>
                  <p className="text-[11px] text-zinc-400 mt-0.5">
                    Paid on a specific day of the month (e.g. the 20th or 25th).
                    {ruleType === "fixed_date" && ` Currently set to: Day ${fixedDate}`}
                  </p>
                </div>
              </button>

              <button
                type="button"
                onClick={() => setRuleType("last_working_day")}
                className={`w-full text-left p-3.5 rounded-xl border transition-all active:scale-[0.99] flex items-start gap-3 ${
                  ruleType === "last_working_day"
                    ? "bg-violet-500/10 border-violet-500/40 text-zinc-100"
                    : "bg-zinc-950/40 border-zinc-800/80 text-zinc-400 hover:border-zinc-700/85 hover:bg-zinc-900/20"
                }`}
              >
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                  ruleType === "last_working_day" ? "bg-violet-500/20 text-violet-450" : "bg-zinc-900 text-zinc-400"
                }`}>
                  <CalendarClock size={16} />
                </div>
                <div>
                  <h4 className="text-xs font-semibold text-zinc-100">Last Working Day</h4>
                  <p className="text-[11px] text-zinc-400 mt-0.5">
                    Paid on the final business day of the month.
                  </p>
                </div>
              </button>

              <button
                type="button"
                onClick={() => setRuleType("last_friday")}
                className={`w-full text-left p-3.5 rounded-xl border transition-all active:scale-[0.99] flex items-start gap-3 ${
                  ruleType === "last_friday"
                    ? "bg-violet-500/10 border-violet-500/40 text-zinc-100"
                    : "bg-zinc-950/40 border-zinc-800/80 text-zinc-400 hover:border-zinc-700/85 hover:bg-zinc-900/20"
                }`}
              >
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                  ruleType === "last_friday" ? "bg-violet-500/20 text-violet-450" : "bg-zinc-900 text-zinc-400"
                }`}>
                  <CalendarDays size={16} />
                </div>
                <div>
                  <h4 className="text-xs font-semibold text-zinc-100">Last Friday</h4>
                  <p className="text-[11px] text-zinc-450 mt-0.5">
                    Paid on the final Friday of the month.
                  </p>
                </div>
              </button>
            </div>
          </div>
        </section>
      )}

      {/* Section 2: Rule Details (only visible for fixed_date) */}
      {frequency === "monthly" && ruleType === "fixed_date" && (
        <section className="flex flex-col gap-3 animate-fade-in">
          <div className="flex items-center gap-2 px-2">
            <div className="w-6 h-6 rounded-full flex items-center justify-center bg-zinc-800 text-zinc-300">
              <Calendar size={12} />
            </div>
            <h3 className="font-bold text-xs text-zinc-300 uppercase tracking-wider">
              Date Settings
            </h3>
          </div>

          <div className="glass-card p-4 flex flex-col gap-4">
            <div className="flex flex-col gap-1.5">
              <label htmlFor="fixed-date-input" className="text-xs font-bold text-zinc-400 uppercase tracking-wide">
                Target Day of Month
              </label>
              <input
                id="fixed-date-input"
                type="number"
                min="1"
                max="31"
                value={fixedDate}
                onChange={(e) => setFixedDate(e.target.value)}
                disabled={isPending}
                className="bg-zinc-900 border border-zinc-800 rounded-xl px-3 py-2 text-sm text-zinc-100 focus:outline-none focus:border-zinc-700 disabled:opacity-50"
                placeholder="20"
                required
              />
            </div>

            <div className="flex items-center justify-between gap-4 p-3 bg-zinc-950/20 rounded-xl border border-zinc-800/40">
              <div>
                <h4 className="text-xs font-semibold text-zinc-200">Weekend Rollback</h4>
                <p className="text-[11px] text-zinc-400 mt-0.5 max-w-[280px]">
                  If the selected date lands on a Saturday or Sunday, shift payday to the preceding Friday.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setRollbackWeekend(!rollbackWeekend)}
                disabled={isPending}
                className={`relative w-11 h-5.5 rounded-full transition-colors shrink-0 ${
                  rollbackWeekend ? "bg-violet-500" : "bg-zinc-700"
                } ${isPending ? "opacity-50" : ""}`}
              >
                <div className={`absolute top-0.75 left-0.75 bg-white w-4 h-4 rounded-full transition-transform ${
                  rollbackWeekend ? "translate-x-5.5" : "translate-x-0"
                }`} />
              </button>
            </div>
          </div>
        </section>
      )}

      {/* Section 2b: Anchor Date for Weekly/Bi-Weekly */}
      {frequency !== "monthly" && (
        <section className="flex flex-col gap-3 animate-fade-in">
          <div className="flex items-center gap-2 px-2">
            <div className="w-6 h-6 rounded-full flex items-center justify-center bg-zinc-800 text-zinc-300">
              <Calendar size={12} />
            </div>
            <h3 className="font-bold text-xs text-zinc-300 uppercase tracking-wider">
              Cycle Anchor
            </h3>
          </div>

          <div className="glass-card p-4 flex flex-col gap-4">
            <div className="flex flex-col gap-1.5">
              <label htmlFor="anchor-date-input" className="text-xs font-bold text-zinc-400 uppercase tracking-wide">
                Recent Payday Date
              </label>
              <p className="text-[11px] text-zinc-400">
                Select your most recent payday. This will establish the anchor point for all repeating cycles.
              </p>
              <input
                id="anchor-date-input"
                type="date"
                value={anchorDate}
                onChange={(e) => setAnchorDate(e.target.value)}
                disabled={isPending}
                className="bg-zinc-900 border border-zinc-800 rounded-xl px-3 py-2 text-sm text-zinc-100 focus:outline-none focus:border-zinc-700 disabled:opacity-50 mt-1"
                required
              />
            </div>
          </div>
        </section>
      )}

      {/* Section 3: Save button and status */}
      <div className="flex flex-col gap-3">
        <button
          type="submit"
          disabled={isPending}
          className="w-full bg-zinc-100 hover:bg-zinc-200 text-zinc-900 active:scale-[0.98] transition-all py-3 px-4 rounded-xl text-sm font-semibold disabled:opacity-50 flex items-center justify-center gap-2 shadow-lg hover:shadow-xl cursor-pointer"
        >
          {isPending ? (
            <Loader2 size={16} className="animate-spin" />
          ) : (
            <Save size={16} />
          )}
          <span>Save Settings</span>
        </button>

        {status && (
          <div className={`p-3 rounded-xl border text-xs flex items-center gap-2 ${
            status.success
              ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-400"
              : "bg-rose-500/10 border-rose-500/20 text-rose-400"
          }`}>
            {status.success ? <Check size={14} /> : <AlertCircle size={14} />}
            <span>{status.message}</span>
          </div>
        )}
      </div>
    </form>
  );
}
