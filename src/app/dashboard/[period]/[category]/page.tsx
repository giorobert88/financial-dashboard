import { getCycleFromId, getAdjacentCycles, formatDateString, getDashboardCycle, getPastCyclesFrom, getCurrentCycleId, getPaydayConfig } from "@/lib/payday";
import { getCategoryTransactions, getCategories } from "@/lib/firefly";
import { formatCurrency } from "@/lib/format";
import { getDisplayCurrency } from "@/lib/currency";
import { ReceiptText, TrendingUp, Info, ArrowLeft } from "lucide-react";
import { PageHeader } from "@/components/PageHeader";
import { CycleNavigation } from "@/components/CycleNavigation";
import Link from "next/link";
import { notFound } from "next/navigation";
import { CategoryBarChart } from "@/components/CategoryBarChart";
import { TransactionList } from "@/components/TransactionList";


export const dynamic = "force-dynamic";

export default async function CategoryLedgerPage({
  params,
  searchParams,
}: {
  params: Promise<{ period: string; category: string }>;
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const resolvedParams = await params;
  const resolvedSearchParams = await searchParams;

  const { period, category } = resolvedParams;
  const decodedCategory = decodeURIComponent(category).toLowerCase();
  const type = resolvedSearchParams.type as string;

  const isIncome = type === "income";

  let cycle;
  try {
    cycle = getCycleFromId(period);
  } catch (e) {
    notFound();
  }
  
  // Check if cycle is in the future
  const today = new Date();
  const currentCycle = getDashboardCycle(today);
  if (cycle.startDate.getTime() > currentCycle.startDate.getTime()) {
    notFound();
  }

  const currentCycleId = getCurrentCycleId(today);
  const isCurrentPeriod = period === currentCycleId;

  const { prev: prevCycle, next: nextCycle } = getAdjacentCycles(period);

  const startDateStr = formatDateString(cycle.startDate);
  const endDateStr = formatDateString(cycle.endDate);

  const config = getPaydayConfig();
  const historyCount = config.frequency === "weekly" ? 24 : config.frequency === "bi_weekly" ? 12 : 12;
  const historyCycles = getPastCyclesFrom(period, historyCount);
  
  // Sort history cycles to identify the absolute boundaries
  const sortedCycles = [...historyCycles].sort((a, b) => a.startDate.getTime() - b.startDate.getTime());
  
  // Start from the earliest cycle's start date and go up to the selected cycle's end date
  const earliestStartDateStr = sortedCycles.length > 0 ? formatDateString(sortedCycles[0].startDate) : startDateStr;
  const selectedEndDateStr = endDateStr;

  const [transactions, categories] = await Promise.all([
    getCategoryTransactions(
      earliestStartDateStr,
      selectedEndDateStr,
      decodedCategory,
      isIncome ? "income" : "expenses"
    ).catch(() => []),
    getCategories().catch(() => []),
  ]);

  const total = transactions
    .filter(tx => {
      const txDateStr = (tx.dateStr || tx.date).split('T')[0];
      return txDateStr >= startDateStr && txDateStr <= endDateStr;
    })
    .reduce((sum, tx) => sum + Math.abs(tx.amount), 0);

  // Group transactions by month/cycle for cleaner presentation of the ledger
  const groups: Record<string, { label: string; transactions: any[] }> = {};
  
  // Sort all cycles descending (newest first) to show newest months first
  const descendingCycles = [...historyCycles].sort((a, b) => b.startDate.getTime() - a.startDate.getTime());
  
  descendingCycles.forEach(c => {
    groups[c.id] = {
      label: c.label,
      transactions: [] as typeof transactions
    };
  });

  transactions.forEach(tx => {
    // Find which cycle this transaction belongs to using the string dateStr directly
    const txDateStr = (tx.dateStr || tx.date).split('T')[0];
    const matchingCycle = historyCycles.find(c => txDateStr >= formatDateString(c.startDate) && txDateStr <= formatDateString(c.endDate));
    if (matchingCycle) {
      groups[matchingCycle.id].transactions.push(tx);
    }
  });

  // Re-build spending history natively from the groups
  const spendingHistory = sortedCycles.map(c => {
    const cycleTotal = groups[c.id]?.transactions.reduce((sum, tx) => sum + Math.abs(tx.amount), 0) || 0;
    return {
      id: c.id,
      label: c.label,
      amount: Number(cycleTotal.toFixed(2)),
    };
  });

  const groupedTransactions = Object.entries(groups)
    .filter(([_, group]) => group.transactions.length > 0)
    .map(([id, group]) => ({
      id,
      label: group.label,
      transactions: group.transactions.sort(
        (a, b) => new Date(b.dateStr || b.date).getTime() - new Date(a.dateStr || a.date).getTime()
      )
    }));

  const [displayCurrency] = await Promise.all([
    getDisplayCurrency(),
  ]);

  const fmt = (n: number, opts?: Intl.NumberFormatOptions) => formatCurrency(n, displayCurrency.code, opts);

  const displayCategoryName = categories.find((c: string) => c.toLowerCase() === decodedCategory) || decodeURIComponent(category);

  return (
    <div className="flex flex-col gap-6 animate-fade-in pb-12">
      <div className="flex flex-col gap-4">
        <Link 
          href={`/dashboard/${period}?type=${isIncome ? "income" : "expenses"}`}
          className="text-xs font-semibold text-zinc-400 hover:text-zinc-200 transition-colors flex items-center gap-1 w-fit"
        >
          <ArrowLeft size={14} />
          Back to {cycle.label}
        </Link>
        <PageHeader 
          title={displayCategoryName} 
          subtitle={`Showing ${isIncome ? 'income' : 'expenses'} for this category.`}
        />
      </div>

      <CycleNavigation 
        prevCycle={prevCycle}
        nextCycle={nextCycle}
        currentCycleId={currentCycleId}
        currentLabel={cycle.label}
        isCurrentPeriod={isCurrentPeriod}
        isIncome={isIncome}
        category={category}
      />

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-1 flex flex-col gap-6">
          <div className="glass-card p-6 flex flex-col items-center justify-center text-center">
            <h3 className="text-sm font-semibold text-zinc-400 uppercase tracking-widest mb-2">Total {isIncome ? 'Income' : 'Spent'}</h3>
            <span className={`text-4xl font-black ${isIncome ? 'text-emerald-400' : 'text-rose-400'}`}>
              {fmt(total)}
            </span>
            <span className="text-xs text-zinc-500 mt-2 font-medium">in {cycle.label}</span>
          </div>
          
          <div className="glass-card p-4 bg-zinc-900/50 flex flex-col gap-3">
            <div className="flex items-start gap-2">
              <Info size={16} className="text-zinc-400 mt-0.5 shrink-0" />
              <p className="text-xs text-zinc-400 leading-relaxed">
                This page shows all transactions categorized as <strong className="text-zinc-200">{displayCategoryName}</strong> during the selected cycle, and compares it to recent cycles.
              </p>
            </div>
          </div>
        </div>

        <div className="md:col-span-2 glass-card p-5 sm:p-6 flex flex-col gap-4">
          <div className="flex items-center justify-between px-1">
            <h3 className="font-bold text-sm text-zinc-200 flex items-center gap-2">
              <TrendingUp size={16} className="text-violet-400" />
              Category Trend
            </h3>
            <span className="text-xs font-semibold text-zinc-500">{historyCount}-Cycle History</span>
          </div>
          <div className="h-[220px] w-full">
            <CategoryBarChart 
              data={spendingHistory} 
              isIncome={isIncome} 
              category={category}
            />
          </div>
        </div>
      </div>

      <div className="flex flex-col gap-6">
        <h3 className="font-bold text-lg text-zinc-100 flex items-center gap-2 px-1">
          <ReceiptText size={20} className="text-violet-400" />
          Ledger History
        </h3>
        
        {groupedTransactions.length === 0 ? (
          <div className="glass-card p-12 flex flex-col items-center justify-center text-zinc-500 text-center border-dashed border-zinc-800/80">
            <ReceiptText size={32} className="mb-3 opacity-20" />
            <p className="font-medium text-sm">No transactions found</p>
            <p className="text-xs mt-1 opacity-70">There is no history for this category in the selected timeframe.</p>
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            {groupedTransactions.map((group) => (
              <div key={group.id} className="glass-card overflow-hidden">
                <div className="bg-zinc-900/40 px-4 py-2 border-b border-zinc-800/60 flex items-center justify-between">
                  <h4 className="text-sm font-bold text-zinc-300">{group.label}</h4>
                  <span className="text-xs font-semibold px-2 py-0.5 rounded-md bg-zinc-800/80 text-zinc-400">
                    {group.transactions.length} {group.transactions.length === 1 ? 'transaction' : 'transactions'}
                  </span>
                </div>
                <TransactionList 
                  transactions={group.transactions} 
                  categories={categories}
                />
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
