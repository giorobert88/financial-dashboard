import React, { Suspense } from "react";

import { Inbox, Search } from "lucide-react";
import Link from "next/link";
import { AccountsSection } from "./sections/AccountsSection";
import { InsightsSection } from "./sections/InsightsSection";
import { BurnSection } from "./sections/BurnSection";
import { TransactionsSection } from "./sections/TransactionsSection";
import { PaymentsSection } from "./sections/PaymentsSection";
import { UncategorizedBadge } from "./sections/UncategorizedBadge";
import {
  AccountsSkeleton,
  InsightsSkeleton,
  BurnSkeleton,
  TransactionsSkeleton,
  PaymentsSkeleton,
} from "./sections/Skeletons";

export const dynamic = "force-dynamic";

export default async function Home() {
  const now = new Date();
  const todayMidnight = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  
  // Greeting based on time
  const hour = now.getHours();
  const greeting = hour < 12 ? "Good Morning" : hour < 18 ? "Good Afternoon" : "Good Evening";

  return (
    <div className="flex flex-col gap-6 p-4 pt-12 pb-32">
      {/* Header */}
      <header className="flex justify-between items-center px-2">
        <div>
          <h2 className="text-xs font-semibold tracking-widest text-zinc-400 uppercase">Overview</h2>
          <h1 className="text-2xl font-bold text-zinc-100">{greeting}</h1>
        </div>
        <div className="flex items-center gap-3">
          {/* Quick-Search Icon */}
          <Link
            href="/transactions?search=true"
            className="w-10 h-10 rounded-full bg-zinc-900 border border-zinc-800/80 flex items-center justify-center text-zinc-400 hover:text-zinc-100 transition-colors active:scale-95"
            aria-label="Search Transactions"
            title="Search Transactions"
          >
            <Search size={18} />
          </Link>

          {/* Uncategorized Queue Icon */}
          <Link
            href="/uncategorized"
            className="relative w-10 h-10 rounded-full bg-zinc-900 border border-zinc-800/80 flex items-center justify-center text-zinc-400 hover:text-zinc-100 transition-colors active:scale-95"
            title="Uncategorized Queue"
            aria-label="Uncategorized Queue"
          >
            <Inbox size={18} />
            <Suspense fallback={null}>
              <UncategorizedBadge />
            </Suspense>
          </Link>

          <Link
            href="/settings"
            className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center border border-primary/30 transition-transform active:scale-95"
            aria-label="Settings"
          >
            <span className="text-primary font-bold">RH</span>
          </Link>
        </div>
      </header>

      {/* Hero Section: Safe-to-Spend */}
      <Suspense fallback={<AccountsSkeleton />}>
        <AccountsSection now={now} />
      </Suspense>

      {/* Proactive Insights */}
      <Suspense fallback={<InsightsSkeleton />}>
        <InsightsSection now={now} />
      </Suspense>

      {/* Burn Comparison Chart */}
      <Suspense fallback={<BurnSkeleton />}>
        <BurnSection now={now} />
      </Suspense>

      {/* Recent Activity */}
      <Suspense fallback={<TransactionsSkeleton />}>
        <TransactionsSection />
      </Suspense>

      {/* Upcoming Payments Section */}
      <Suspense fallback={<PaymentsSkeleton />}>
        <PaymentsSection />
      </Suspense>
    </div>
  );
}
