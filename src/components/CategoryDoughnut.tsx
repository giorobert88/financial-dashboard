"use client";

import { useMemo, useSyncExternalStore } from "react";
import { chartTheme } from "@/lib/chartjs-setup";
import { useCurrency } from "./CurrencyContext";
import dynamic from 'next/dynamic';
const Doughnut = dynamic(() => import('react-chartjs-2').then((mod) => mod.Doughnut), { ssr: false });
import { useRouter } from 'next/navigation';
import { getCategoryStyle } from "@/lib/category-icons";

function subscribeColorScheme(callback: () => void) {
  if (typeof window === "undefined" || !window.matchMedia) return () => {};
  const mq = window.matchMedia("(prefers-color-scheme: light)");
  mq.addEventListener("change", callback);
  return () => mq.removeEventListener("change", callback);
}

function getColorSchemeSnapshot() {
  return typeof window !== "undefined" && !!window.matchMedia?.("(prefers-color-scheme: light)").matches;
}

function getColorSchemeServerSnapshot() {
  return false;
}

interface CategoryDoughnutProps {
  periodId: string;
  data: {
    category: string;
    amount: number;
  }[];
  linkable?: boolean;
  linkQueryParam?: string; // e.g. "type=income"
}

export function CategoryDoughnut({ periodId, data, linkable = true, linkQueryParam }: CategoryDoughnutProps) {
  const router = useRouter();
  const { fmt } = useCurrency();
  const isLight = useSyncExternalStore(
    subscribeColorScheme,
    getColorSchemeSnapshot,
    getColorSchemeServerSnapshot
  );

  const chartData = useMemo(() => {
    const backgroundColors = data.map(d => {
      const style = getCategoryStyle(d.category);
      return `rgba(${style.chartColor}, 0.85)`;
    });

    return {
      labels: data.map(d => d.category),
      datasets: [
        {
          data: data.map(d => d.amount),
          backgroundColor: backgroundColors,
          borderColor: isLight ? 'rgba(255, 255, 255, 0.95)' : 'rgba(9, 9, 11, 0.85)',
          borderWidth: 1.5,
        },
      ],
    };
  }, [data, isLight]);

  const options = useMemo(() => ({
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        ...chartTheme.plugins.legend,
        position: 'right' as const,
        labels: {
          ...chartTheme.plugins.legend.labels,
          padding: 20
        }
      },
      tooltip: {
        ...chartTheme.plugins.tooltip,
        callbacks: {
          label: function(context: any) {
            let label = context.label || '';
            if (label) {
              label += ': ';
            }
            if (context.parsed !== null) {
              label += fmt(context.parsed);
            }
            return label;
          }
        }
      }
    },
    onClick: (event: any, elements: any[]) => {
      if (linkable && elements.length > 0) {
        const index = elements[0].index;
        const category = data[index].category;
        const query = linkQueryParam ? `?${linkQueryParam}` : '';
        router.push(`/dashboard/${periodId}/${encodeURIComponent(category)}${query}`);
      }
    },
    onHover: (_event: any, elements: any[], chart: any) => {
      chart.canvas.style.cursor = linkable && elements.length > 0 ? 'pointer' : 'default';
    },
  }), [data, linkable, linkQueryParam, periodId, router]);

  return (
    <div className="w-full h-64">
      <Doughnut data={chartData} options={options} />
    </div>
  );
}
