"use client";

import React, { useMemo } from "react";
import { chartTheme, chartHelpers } from "@/lib/chartjs-setup";
import { useCurrency } from "@/components/CurrencyContext";
import dynamic from "next/dynamic";
import { ArrowDownRight, ArrowUpRight } from "lucide-react";

const Line = dynamic(() => import("react-chartjs-2").then((mod) => mod.Line), {
  ssr: false,
});

interface BurnComparisonChartProps {
  currentCumulative: number[];
  prevCumulative: number[];
  prevTotal: number;
  isMock?: boolean;
}

export function BurnComparisonChart({
  currentCumulative,
  prevCumulative,
  prevTotal,
  isMock = false,
}: BurnComparisonChartProps) {
  const { symbol, fmt } = useCurrency();

  const todayIndex = Math.max(0, currentCumulative.length - 1);
  const currentSoFar = currentCumulative[todayIndex] || 0;
  const prevAtSameDay = prevCumulative[todayIndex] || 0;
  const diffSoFar = currentSoFar - prevAtSameDay;
  const isUnder = diffSoFar <= 0;

  const chartData = useMemo(() => {
    const daysCount = Math.max(currentCumulative.length, prevCumulative.length);
    const labels = Array.from({ length: daysCount }, (_, i) => `Day ${i + 1}`);

    return {
      labels,
      datasets: [
        {
          label: "Current Cycle",
          data: currentCumulative,
          borderColor: "rgb(236, 72, 153)", // Primary accent pink/rose
          backgroundColor: "rgba(236, 72, 153, 0.1)",
          borderWidth: 2,
          fill: true,
          tension: 0.2,
          pointRadius: 0,
          pointHoverRadius: 4,
        },
        {
          label: "Previous Cycle",
          data: prevCumulative,
          borderColor: "rgba(161, 161, 170, 0.6)",
          borderDash: [4, 4],
          borderWidth: 1.5,
          fill: false,
          tension: 0.2,
          pointRadius: 0,
          pointHoverRadius: 4,
        },
      ],
    };
  }, [currentCumulative, prevCumulative]);

  const chartOptions = useMemo(() => ({
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      ...chartTheme.plugins,
      legend: {
        ...chartTheme.plugins.legend,
        display: true,
        position: "top" as const,
      },
      tooltip: {
        ...chartTheme.plugins.tooltip,
        callbacks: {
          label: chartHelpers.makeTooltipCurrencyLabelCallback(fmt),
        },
      },
    },
    scales: {
      x: {
        ...chartTheme.scales.x,
        ticks: {
          ...chartTheme.scales.x.ticks,
          maxTicksLimit: 8,
        },
      },
      y: {
        ...chartTheme.scales.y,
        ticks: {
          ...chartTheme.scales.y.ticks,
          callback: (value: any) => `${symbol}${value}`,
        },
      },
    },
  }), [symbol]);

  return (
    <div className="glass-card p-4 flex flex-col gap-4">
      {/* Header Info */}
      <div className="flex justify-between items-start border-b border-white/5 pb-3">
        <div>
          <div className="flex items-center gap-1.5 text-zinc-400">
            <h3 className="text-xs font-bold tracking-widest uppercase">
              Burn Comparison
            </h3>
            {isMock && (
              <span className="text-[10px] bg-zinc-800 text-zinc-400 border border-zinc-700/80 px-1 py-0.2 rounded-full font-bold">
                Mock
              </span>
            )}
          </div>
          <div className="flex items-baseline gap-2 mt-1">
            <p className="text-xl font-bold text-white">
              {fmt(currentSoFar)}
            </p>
            <span className="text-xs text-zinc-400">vs {fmt(prevAtSameDay)} last month</span>
          </div>
        </div>

        <div className={`flex items-center gap-1 px-2.5 py-1 rounded-xl border text-xs font-bold ${
          isUnder
            ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-400"
            : "bg-amber-500/10 border-amber-500/20 text-amber-400"
        }`}>
          {isUnder ? (
            <ArrowDownRight size={14} strokeWidth={2.5} />
          ) : (
            <ArrowUpRight size={14} strokeWidth={2.5} />
          )}
          <span>
            {isUnder ? "Under by " : "Over by "}
            {fmt(Math.abs(diffSoFar))}
          </span>
        </div>
      </div>

      {/* Chart Canvas */}
      <div className="h-56 relative w-full">
        <Line data={chartData} options={chartOptions} />
      </div>

      {/* Legend Footer */}
      <div className="flex justify-between items-center text-xs text-zinc-500 mt-1">
        <span>Day {todayIndex + 1} of cycle</span>
        <span>Total Last Cycle: {fmt(prevTotal)}</span>
      </div>
    </div>
  );
}
