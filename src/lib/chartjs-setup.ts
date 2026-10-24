import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler,
} from "chart.js";

// Register all ChartJS plugins and elements once
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

export const chartTheme = {
  plugins: {
    legend: {
      labels: {
        color: "#71717a", // zinc-500: readable in light and dark mode
        font: {
          size: 10,
          weight: "bold" as const,
          family: "var(--font-sans), system-ui, sans-serif",
        },
        boxWidth: 12,
        padding: 10,
      },
    },
    tooltip: {
      backgroundColor: "rgba(9, 9, 11, 0.95)",
      titleColor: "rgba(244, 244, 245, 0.6)",
      bodyColor: "#ffffff",
      borderColor: "rgba(255, 255, 255, 0.1)",
      borderWidth: 1,
      padding: 10,
      cornerRadius: 8,
      displayColors: true,
      titleFont: {
        family: "var(--font-sans), system-ui, sans-serif",
        weight: "bold" as const,
      },
      bodyFont: {
        family: "var(--font-sans), system-ui, sans-serif",
      },
    },
  },
  scales: {
    x: {
      grid: {
        display: false,
      },
      ticks: {
        color: "#71717a",
        font: {
          size: 9,
          family: "var(--font-sans), system-ui, sans-serif",
        },
      },
    },
    y: {
      grid: {
        color: "rgba(113, 113, 122, 0.15)",
      },
      ticks: {
        color: "#71717a",
        font: {
          size: 9,
          family: "var(--font-sans), system-ui, sans-serif",
        },
      },
    },
  },
} as const;

export { ChartJS };

export const chartHelpers = {
  /**
   * Returns a Chart.js tooltip label callback that formats values
   * using the given currency formatter.  When no formatter is supplied,
   * it falls back to the raw numeric value.
   */
  makeTooltipCurrencyLabelCallback(fmtFn: (n: number) => string) {
    return function (context: any) {
      let label = context.dataset.label || "";
      if (label) {
        label += ": ";
      }
      if (context.parsed.y !== null) {
        label += fmtFn(context.parsed.y);
      }
      return label;
    };
  },
  onHoverPointer: (_event: any, elements: any[], chart: any) => {
    chart.canvas.style.cursor = elements.length > 0 ? "pointer" : "default";
  },
};
