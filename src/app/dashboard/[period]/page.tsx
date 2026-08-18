import { getAdjacentCycles, formatDateString, getDashboardCycle, getCycleFromId, getCurrentCycleId } from "@/lib/payday";
import { getCycleFullData } from "@/lib/firefly";
import { formatCurrency } from "@/lib/format";
import { getDisplayCurrency } from "@/lib/currency";
import { PieChart, TrendingUp, TrendingDown, Info, ArrowLeft } from "lucide-react";
import { PageHeader } from "@/components/PageHeader";
import { CycleNavigation } from "@/components/CycleNavigation";
import { CategoryDoughnut } from "@/components/CategoryDoughnut";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getCategoryStyle } from "@/lib/category-icons";


export const dynamic = "force-dynamic";

export default async function PeriodPage({
  params,
  searchParams,
}: {
  params: Promise<{ period: string }>;
  searchParams: Promise<{ type?: string }>;
}) {
  const { period } = await params;
  const { type } = await searchParams;
  const displayCurrency = await getDisplayCurrency();
  const fmt = (n: number, opts?: Intl.NumberFormatOptions) => formatCurrency(n, displayCurrency.code, opts);

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

  // Single fetch — computes summary + both breakdowns in one API round-trip
  const { summary, expenseBreakdown, incomeBreakdown } = await getCycleFullData(
    startDateStr,
    endDateStr,
  ).catch(() => ({ summary: { income: 0, expenses: 0 }, expenseBreakdown: [], incomeBreakdown: [] }));

  const categoryData = isIncome ? incomeBreakdown : expenseBreakdown;

  const spentPercent = summary.income > 0
    ? Math.min(100, Math.round((summary.expenses / summary.income) * 100))
    : 0;

  return (
    <div className="flex flex-col gap-6 p-4 pt-12 pb-32">
      <PageHeader
        backHref="/dashboard"
        subtitle="Cycle Detail"
        title={cycle.label}
        rightSection={
          <CycleNavigation
            prevCycle={prevCycle}
            nextCycle={nextCycle}
            currentCycleId={currentCycleId}
            currentLabel={cycle.label}
            isCurrentPeriod={isCurrentPeriod}
            isIncome={isIncome}
          />
        }
      />

      {/* Progress Bar */}
      <section className="glass-card p-4">
        <div className="flex justify-between items-center mb-2">
          <h3 className="font-semibold text-zinc-100">Budget vs Actual</h3>
          <span className="text-xs text-muted-foreground">
            {new Date(cycle.startDate).toLocaleDateString("en-GB", { day: "numeric", month: "short" })} –{" "}
            {new Date(cycle.endDate).toLocaleDateString("en-GB", { day: "numeric", month: "short" })}
          </span>
        </div>

        <div className="flex justify-between items-end mb-2">
          <div>
            <p className="text-xs text-muted-foreground mb-1">Spent</p>
            <p className="text-xl font-bold text-error">{fmt(summary.expenses)}</p>
          </div>
          <div className="text-right">
            <p className="text-xs text-muted-foreground mb-1">Income</p>
            <p className="text-xl font-bold text-success">{fmt(summary.income)}</p>
          </div>
        </div>

        <div className="w-full bg-black/40 rounded-full h-4 mt-4 overflow-hidden border border-white/5">
          <div
            className={`h-full rounded-full ${spentPercent > 90 ? "bg-error" : spentPercent > 75 ? "bg-warning" : "bg-primary"}`}
            style={{ width: `${spentPercent}%` }}
          />
        </div>
        <p className="text-right text-xs text-muted-foreground mt-2">{spentPercent}% of income spent</p>

        {/* Toggle pills */}
        <div className="flex gap-2 mt-4">
          <Link
            href={`/dashboard/${period}?type=expenses`}
            className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-[var(--radius-element)] text-sm font-semibold transition-all active:scale-[0.98] ${
              !isIncome
                ? "bg-error/20 text-error border border-error/40"
                : "bg-white/5 text-muted-foreground hover:bg-white/10"
            }`}
          >
            <TrendingDown size={14} />
            Expenses
          </Link>
          <Link
            href={`/dashboard/${period}?type=income`}
            className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-[var(--radius-element)] text-sm font-semibold transition-all active:scale-[0.98] ${
              isIncome
                ? "bg-success/20 text-success border border-success/40"
                : "bg-white/5 text-muted-foreground hover:bg-white/10"
            }`}
          >
            <TrendingUp size={14} />
            Income
          </Link>
        </div>
      </section>

      {/* Category Breakdown */}
      <section className="glass-card p-4">
        <div className="flex items-center gap-2 mb-4">
          {isIncome ? (
            <TrendingUp className="text-success" size={20} />
          ) : (
            <PieChart className="text-primary" size={20} />
          )}
          <h3 className="text-lg font-bold text-zinc-100">
            {isIncome ? "Income Breakdown" : "Expense Breakdown"}
          </h3>
        </div>

        {!isIncome && (
          <p className="text-sm text-muted-foreground mb-6">
            Tap a slice or list item to view individual transactions.
          </p>
        )}

        {categoryData.length > 0 ? (
          <>
            <CategoryDoughnut
              periodId={period}
              data={categoryData}
              linkable={true}
              linkQueryParam={isIncome ? 'type=income' : undefined}
            />

            <div className="mt-8 flex flex-col gap-2">
              {categoryData.map((cat) => {
                const href = isIncome
                  ? `/dashboard/${period}/${encodeURIComponent(cat.category)}?type=income`
                  : `/dashboard/${period}/${encodeURIComponent(cat.category)}`;

                const style = getCategoryStyle(cat.category);
                const Icon = style.icon;

                return (
                  <Link
                    key={cat.category}
                    href={href}
                    className="transition-all active:scale-[0.98] block"
                  >
                    <div className="flex justify-between items-center p-3 rounded-[var(--radius-element)] bg-zinc-900/40 border border-zinc-800/20 w-full hover:bg-zinc-900/60 transition-colors">
                      <div className="flex items-center gap-3 min-w-0">
                        <div className={`w-8 h-8 rounded-full border flex items-center justify-center flex-shrink-0 ${style.bgClass} ${style.borderClass}`}>
                          <Icon size={14} className={style.colorClass} />
                        </div>
                        <span className="font-medium text-sm text-zinc-100 truncate">{cat.category}</span>
                      </div>
                      <div className="flex items-center gap-3 flex-shrink-0 ml-2">
                        <span className={`font-bold ${isIncome ? 'text-success' : 'text-zinc-100'}`}>
                          {fmt(cat.amount)}
                        </span>
                        <ArrowLeft size={16} className="text-muted-foreground rotate-180" />
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          </>
        ) : (
          <div className="flex flex-col items-center justify-center py-8 text-muted-foreground gap-2">
            <Info size={32} className="opacity-50" />
            <p>No {isIncome ? "income" : "transactions"} found for this cycle.</p>
          </div>
        )}
      </section>
    </div>
  );
}
