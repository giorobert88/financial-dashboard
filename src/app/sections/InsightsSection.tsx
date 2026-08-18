import React from "react";
import {
  getAccountsSummaryData,
  getBurnComparisonData,
} from "@/lib/dashboard-data";
import { getUncategorizedTransactions } from "@/lib/firefly";
import { getDashboardCycle, getCurrentCycleId } from "@/lib/payday";
import { generateInsights } from "@/lib/insights";
import { InsightCard } from "@/components/InsightCard";
import { formatCurrency } from "@/lib/format";
import { getDisplayCurrency } from "@/lib/currency";

interface InsightsSectionProps {
  now: Date;
}

export async function InsightsSection({ now }: InsightsSectionProps) {
  // These fetches are deduped at the Next.js fetch() layer — AccountsSection,
  // BurnSection, and UncategorizedBadge make the same underlying API calls.
  const [accountsData, burnData, uncategorizedTx, displayCurrency] = await Promise.all([
    getAccountsSummaryData(now).catch(() => null),
    getBurnComparisonData(now).catch(() => null),
    getUncategorizedTransactions(30).catch(() => []),
    getDisplayCurrency(),
  ]);
  const fmt = (n: number) => formatCurrency(n, displayCurrency.code);

  // If data failed to load, don't show insights
  if (!accountsData || !burnData) return null;

  // Compute cycle ID for dismissal keying
  const cycleId = getCurrentCycleId(now);

  // Find projected negative date
  const firstNegative = accountsData.projectedPayments.find(
    (p) => p.projectedBalance < 0
  );
  const negativeDate = firstNegative ? firstNegative.dueDate : null;

  // Burn comparison metrics
  const todayIndex = Math.max(0, burnData.currentCumulative.length - 1);
  const currentBurn = burnData.currentCumulative[todayIndex] || 0;
  const prevBurn = burnData.prevCumulative[todayIndex] || 0;

  const insights = generateInsights({
    finalProjectedBalance: accountsData.finalProjectedBalance,
    negativeDate,
    currentBurn,
    prevBurn,
    prevTotal: burnData.prevExpenses,
    daysElapsed: todayIndex,
    uncategorizedCount: uncategorizedTx.length,
    cycleId,
    fmt,
  });

  // If no insights qualify, render nothing — no empty wrapper
  if (insights.length === 0) return null;

  return (
    <section className="flex flex-col gap-2">
      {insights.map((insight) => (
        <InsightCard key={insight.id} insight={insight} />
      ))}
    </section>
  );
}
