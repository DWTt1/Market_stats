import { lazy, Suspense, useMemo, useState } from "react";
import { SIGNALS, SIGNAL_COLORS, SIGNAL_LABELS } from "../config";
import { useIndex } from "../hooks/useData";
import { Loading } from "./States";
const Chart = lazy(() => import("./Chart"));
export function TrendChart({ through }: { through?: string }) {
  const index = useIndex();
  const [window, setWindow] = useState(10);
  const days = index.days
    .filter((day) => !through || day.date <= through)
    .slice(0, window)
    .reverse();
  const option = useMemo(
    () => ({
      grid: { left: 48, right: 24, top: 25, bottom: 64 },
      legend: { bottom: 0, data: SIGNALS.map((s) => SIGNAL_LABELS[s]) },
      xAxis: {
        type: "category",
        boundaryGap: days.length === 1,
        data: days.map((d) => d.date.slice(5)),
        axisTick: { show: false },
      },
      yAxis: { type: "value" },
      series: SIGNALS.map((signal) => ({
        name: SIGNAL_LABELS[signal],
        type: "line",
        data: days.map((d) => d.counts[signal]),
        itemStyle: { color: SIGNAL_COLORS[signal] },
        symbol: "circle",
        symbolSize: 7,
        lineStyle: { width: 2.5 },
        connectNulls: false,
      })),
    }),
    [days],
  );
  return (
    <section className="panel">
      <div className="panel-heading">
        <div>
          <h2>历史趋势</h2>
          <p>最近 {days.length} 个统计日 · 单位：只</p>
        </div>
        <div className="segmented">
          {[5, 10, 20].map((n) => (
            <button
              key={n}
              aria-pressed={window === n}
              onClick={() => setWindow(n)}
            >
              {n}日
            </button>
          ))}
        </div>
      </div>
      <Suspense fallback={<Loading />}>
        <Chart label="历史连续涨跌股票数量趋势" option={option} height={270} />
      </Suspense>
    </section>
  );
}
