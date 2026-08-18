import React from "react";
import { getAccountsSummaryData } from "@/lib/dashboard-data";
import { getNextPayday } from "@/lib/payday";
import { Wallet, ReceiptText, Check, AlertCircle } from "lucide-react";
import { formatCurrency } from "@/lib/format";
import { getDisplayCurrency } from "@/lib/currency";

interface AccountsSectionProps {
  now: Date;
}

export async function AccountsSection({ now }: AccountsSectionProps) {
  const [data, displayCurrency] = await Promise.all([
    getAccountsSummaryData(now),
    getDisplayCurrency(),
  ]);
  const fmt = (n: number, opts?: Intl.NumberFormatOptions) => formatCurrency(n, displayCurrency.code, opts);

  const todayMidnight = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const nextPayday = getNextPayday(todayMidnight);

  const firstNegativePayment = data.projectedPayments.find((p) => p.projectedBalance < 0);
  const negativeDate = firstNegativePayment ? new Date(firstNegativePayment.dueDate) : null;

  // Sparkline calculations for background trend
  const historyPoints = data.netWorthHistory.map((h) => h.netWorth);
  const minNetWorth = historyPoints.length > 0 ? Math.min(...historyPoints) : 0;
  const maxNetWorth = historyPoints.length > 0 ? Math.max(...historyPoints) : 1;
  const range = maxNetWorth - minNetWorth || 1;

  let linePath = "";
  let areaPath = "";

  if (historyPoints.length > 0) {
    linePath = historyPoints
      .map((val, idx) => {
        const x = (idx / (historyPoints.length - 1)) * 300;
        const y = 80 - ((val - minNetWorth) / range) * 55 - 15;
        return `${idx === 0 ? "M" : "L"} ${x.toFixed(1)} ${y.toFixed(1)}`;
      })
      .join(" ");
    areaPath = `${linePath} L 300 80 L 0 80 Z`;
  }

  return (
    <section className="relative overflow-hidden glass-card p-6">
      {/* Background Sparkline Trend */}
      {linePath && (
        <div className="absolute inset-0 z-0 opacity-[0.12] pointer-events-none">
          <svg viewBox="0 0 300 80" className="w-full h-full" preserveAspectRatio="none">
            <defs>
              <linearGradient id="sparklineGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="rgba(99, 102, 241, 0.4)" />
                <stop offset="100%" stopColor="rgba(99, 102, 241, 0)" />
              </linearGradient>
            </defs>
            <path d={areaPath} fill="url(#sparklineGrad)" />
            <path d={linePath} fill="none" stroke="rgba(99, 102, 241, 0.85)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>
      )}
      
      <div className="relative z-10">
        <div className="mb-6">
          {/* Headers Row */}
          <div className="flex justify-between items-center mb-1">
            <div className="flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-xs font-semibold tracking-widest text-zinc-400 uppercase">Net Worth</span>
            </div>
            <div className="flex items-center gap-2">
              {data.isMock && (
                <span className="text-[10px] bg-zinc-800 text-zinc-400 border border-zinc-700/60 px-1.5 py-0.5 rounded-full font-medium">
                  Mock
                </span>
              )}
              <span className="text-xs font-semibold tracking-widest text-zinc-400 uppercase">Next Payday</span>
            </div>
          </div>
          {/* Values Row */}
          <div className="flex justify-between items-baseline">
            <div className="text-4xl font-extralight tracking-tight text-white font-sans">
              {fmt(data.safeToSpend)}
            </div>
            <div>
              <span className="text-sm font-semibold text-zinc-300">
                {nextPayday.toLocaleDateString("en-GB", { day: "numeric", month: "short" })}
              </span>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-0 border-t border-zinc-800/60 pt-4">
          <div className="pr-4 border-r border-zinc-800/60">
            <div className="flex items-center gap-1.5 text-zinc-400 mb-1">
              <Wallet size={12} className="opacity-70" />
              <span className="text-xs font-semibold tracking-widest uppercase">Current Balance</span>
            </div>
            <div className="font-semibold text-lg text-zinc-100">{fmt(data.currentBalance)}</div>
            <div className={`text-xs font-semibold mt-1 ${
              data.finalProjectedBalance < 0 ? "text-rose-400 animate-pulse" : "text-zinc-400"
            }`}>
              Proj: {fmt(data.finalProjectedBalance)}
            </div>
          </div>
          
          <div className="pl-6">
            <div className="flex items-center gap-1.5 text-zinc-400 mb-1">
              <ReceiptText size={12} className="opacity-70" />
              <span className="text-xs font-semibold tracking-widest uppercase">Upcoming</span>
            </div>
            <div className="font-semibold text-lg text-zinc-100">{fmt(data.reservedAmount)}</div>
            {negativeDate ? (
              <div className="text-xs text-rose-400 font-semibold mt-1 flex items-center gap-1">
                <AlertCircle size={10} />
                <span>Neg: {negativeDate.toLocaleDateString("en-GB", { day: "numeric", month: "short" })}</span>
              </div>
            ) : (
              <div className="text-xs text-emerald-400 font-semibold mt-1 flex items-center gap-1">
                <Check size={10} strokeWidth={3} />
                <span>Safe</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
