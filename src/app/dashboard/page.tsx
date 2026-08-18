import { getPastCyclesFrom, getDashboardCycle, getCycleFromId, getAdjacentCycles, formatDateString, getCurrentCycleId, getPaydayConfig } from "@/lib/payday";
import { getCycleTransactions, computeCycleSummaryFromTransactions } from "@/lib/api/transactions";
import { PageHeader } from "@/components/PageHeader";
import { HistoricalChart } from "@/components/HistoricalChart";
import { BarChart3, ChevronLeft, ChevronRight, CalendarDays } from "lucide-react";
import Link from "next/link";
import { formatCurrency } from "@/lib/format";
import { getDisplayCurrency } from "@/lib/currency";

export const dynamic = "force-dynamic";

interface PageProps {
  searchParams: Promise<{ end?: string }>;
}

export default async function DashboardPage(props: PageProps) {
  const searchParams = await props.searchParams;
  const end = searchParams.end;

  const [displayCurrency] = await Promise.all([
    getDisplayCurrency(),
  ]);
  const fmt = (n: number, opts?: Intl.NumberFormatOptions) => formatCurrency(n, displayCurrency.code, opts);

  const today = new Date();
  const currentCycleId = getCurrentCycleId(today);
  
  const endCycleId = end || currentCycleId;
  const isCurrentPeriod = endCycleId === currentCycleId;

  const endCycle = getCycleFromId(endCycleId);
  const endCycleLabel = endCycle.label;

  // Fetch adjacent cycles
  const { prev: prevCycle, next: nextCycle } = getAdjacentCycles(endCycleId);

  // Fetch summary for cycles ending at endCycleId
  const config = getPaydayConfig();
  const historyCount = config.frequency === "weekly" ? 24 : config.frequency === "bi_weekly" ? 12 : 6;
  const pastCycles = getPastCyclesFrom(endCycleId, historyCount);
  
  // Batch fetch transactions
  let allTransactions: any[] = [];
  try {
    if (pastCycles.length > 0) {
      const startStr = formatDateString(pastCycles[0].startDate);
      const endStr = formatDateString(pastCycles[pastCycles.length - 1].endDate);
      allTransactions = await getCycleTransactions(startStr, endStr);
    }
  } catch (e) {
    console.error("Failed to fetch batched cycle transactions", e);
  }

  const cyclesData = pastCycles.map((cycle) => {
    const cycleStartStr = formatDateString(cycle.startDate);
    const cycleEndStr = formatDateString(cycle.endDate);
    
    const cycleTxs = allTransactions.filter(tx => {
      const t = tx.attributes?.transactions?.[0];
      if (!t || !t.date) return false;
      // Compare ISO date prefix directly (e.g., "2024-08-01")
      const txDateStr = t.date.split('T')[0];
      return txDateStr >= cycleStartStr && txDateStr <= cycleEndStr;
    });

    const summary = computeCycleSummaryFromTransactions(cycleTxs);
    
    return {
      id: cycle.id,
      label: cycle.label,
      income: summary.income,
      expenses: summary.expenses,
      net: summary.income - summary.expenses,
    };
  });

  const avgIncome = cyclesData.reduce((acc, c) => acc + c.income, 0) / (cyclesData.length || 1);
  const avgExpenses = cyclesData.reduce((acc, c) => acc + c.expenses, 0) / (cyclesData.length || 1);
  const avgNet = avgIncome - avgExpenses;

  return (
    <div className="flex flex-col gap-6 animate-fade-in pb-12">
      <PageHeader 
        title="Cycle History" 
        subtitle="Compare your total income against your spending across the last 6 payday cycles."
      />

      <div className="flex justify-between items-center bg-zinc-900/60 p-2 rounded-2xl border border-zinc-800/80 backdrop-blur-md">
        <div className="flex items-center gap-2 px-2">
          <CalendarDays size={18} className="text-zinc-400" />
          <span className="text-sm font-semibold text-zinc-200 hidden sm:inline">Viewing up to:</span>
          <span className="text-sm font-bold text-violet-400">{endCycleLabel}</span>
        </div>
        
        <div className="flex items-center gap-1.5 bg-zinc-950/80 p-1 rounded-xl">
          {prevCycle ? (
            <Link 
              href={`/dashboard?end=${prevCycle.id}`}
              className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-white/10 text-zinc-400 hover:text-white transition-colors"
              title="View previous cycle"
            >
              <ChevronLeft size={18} />
            </Link>
          ) : (
            <span className="w-8 h-8 flex items-center justify-center rounded-lg text-zinc-700 cursor-not-allowed">
              <ChevronLeft size={18} />
            </span>
          )}
          
          <span className="text-xs font-semibold px-2 text-zinc-500 uppercase tracking-widest hidden sm:inline">Navigate</span>
          
          {nextCycle ? (
            <Link 
              href={`/dashboard?end=${nextCycle.id}`}
              className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-white/10 text-zinc-400 hover:text-white transition-colors"
              title="View next cycle"
            >
              <ChevronRight size={18} />
            </Link>
          ) : (
            <span className="w-8 h-8 flex items-center justify-center rounded-lg text-zinc-700 cursor-not-allowed">
              <ChevronRight size={18} />
            </span>
          )}

          {!isCurrentPeriod && (
            <>
              <div className="w-[1px] h-4 bg-zinc-800 mx-1" />
              <Link
                href={`/dashboard`}
                className="px-3 py-1.5 bg-violet-500/10 hover:bg-violet-500/20 text-violet-400 text-xs font-semibold rounded-lg transition-colors"
              >
                Reset
              </Link>
            </>
          )}
        </div>
      </div>

      <div className="glass-card p-6 flex flex-col gap-6">
        <HistoricalChart data={cyclesData} />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="glass-card p-5 flex flex-col gap-1">
          <span className="text-xs font-bold text-zinc-400 uppercase tracking-wider">Avg Income</span>
          <span className="text-xl font-bold text-emerald-400">{fmt(avgIncome)}</span>
        </div>
        <div className="glass-card p-5 flex flex-col gap-1">
          <span className="text-xs font-bold text-zinc-400 uppercase tracking-wider">Avg Expenses</span>
          <span className="text-xl font-bold text-rose-400">{fmt(avgExpenses)}</span>
        </div>
        <div className="glass-card p-5 flex flex-col gap-1">
          <span className="text-xs font-bold text-zinc-400 uppercase tracking-wider">Avg Net</span>
          <span className={`text-xl font-bold ${avgNet >= 0 ? "text-violet-400" : "text-amber-400"}`}>
            {fmt(avgNet)}
          </span>
        </div>
      </div>

      <div className="glass-card overflow-hidden">
        <div className="px-5 py-4 border-b border-zinc-800/80 bg-zinc-900/30">
          <h3 className="font-semibold text-sm">Detailed Breakdown</h3>
        </div>
        <div className="flex flex-col max-h-[500px] overflow-y-auto">
          {cyclesData.map((cycle, i) => (
            <Link
              key={cycle.id}
              href={`/dashboard/${cycle.id}`}
              className={`flex items-center justify-between p-4 sm:px-6 hover:bg-white/[0.02] transition-colors ${
                i !== cyclesData.length - 1 ? 'border-b border-zinc-800/40' : ''
              }`}
            >
              <div className="flex items-center gap-4">
                <div className={`w-2 h-2 rounded-full ${cycle.net >= 0 ? 'bg-emerald-500' : 'bg-rose-500'}`} />
                <span className="font-medium text-sm">{cycle.label}</span>
              </div>
              <div className="flex items-center gap-6">
                <div className="hidden sm:flex flex-col items-end">
                  <span className="text-[10px] text-zinc-500 uppercase font-bold">Income</span>
                  <span className="text-sm font-medium text-emerald-400/90">{fmt(cycle.income)}</span>
                </div>
                <div className="hidden sm:flex flex-col items-end">
                  <span className="text-[10px] text-zinc-500 uppercase font-bold">Spent</span>
                  <span className="text-sm font-medium text-rose-400/90">{fmt(cycle.expenses)}</span>
                </div>
                <div className="flex flex-col items-end min-w-[80px]">
                  <span className="text-[10px] text-zinc-500 uppercase font-bold">Net</span>
                  <span className={`text-sm font-bold ${cycle.net >= 0 ? 'text-zinc-200' : 'text-amber-400'}`}>
                    {fmt(cycle.net)}
                  </span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
