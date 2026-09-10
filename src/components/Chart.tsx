import { useEffect, useRef } from "react";
import * as echarts from "echarts/core";
import { BarChart, LineChart } from "echarts/charts";
import {
  GridComponent,
  TooltipComponent,
  LegendComponent,
} from "echarts/components";
import { SVGRenderer } from "echarts/renderers";
import type { EChartsCoreOption } from "echarts/core";
import { useResolvedTheme } from "../hooks/useTheme";

echarts.use([
  BarChart,
  LineChart,
  GridComponent,
  TooltipComponent,
  LegendComponent,
  SVGRenderer,
]);
export default function Chart({
  option,
  height = 280,
  label,
  onBarClick,
}: {
  option: EChartsCoreOption;
  height?: number;
  label: string;
  onBarClick?: (name: string, series: string) => void;
}) {
  const container = useRef<HTMLDivElement>(null);
  const theme = useResolvedTheme();
  useEffect(() => {
    if (!container.current) return;
    const chart = echarts.init(container.current, undefined, {
      renderer: "svg",
    });
    const muted = theme === "dark" ? "#8493a8" : "#66768b";
    const grid = theme === "dark" ? "#263242" : "#e5eaf1";
    chart.setOption({
      backgroundColor: "transparent",
      animation: false,
      textStyle: {
        fontFamily: "Inter, Segoe UI, Microsoft YaHei, sans-serif",
        color: muted,
        fontSize: 12,
      },
      tooltip: {
        trigger: "axis",
        backgroundColor: theme === "dark" ? "#172232" : "#fff",
        borderColor: grid,
        textStyle: { color: theme === "dark" ? "#edf2f8" : "#26364a" },
        confine: true,
      },
      ...option,
      xAxis: Array.isArray(option.xAxis)
        ? option.xAxis
        : {
            axisLabel: { color: muted },
            axisLine: { lineStyle: { color: grid } },
            splitLine: { lineStyle: { color: grid, type: "dashed" } },
            ...(option.xAxis as object),
          },
      yAxis: Array.isArray(option.yAxis)
        ? option.yAxis
        : {
            axisLabel: { color: muted },
            axisLine: { show: false },
            axisTick: { show: false },
            splitLine: { lineStyle: { color: grid, type: "dashed" } },
            ...(option.yAxis as object),
          },
      legend: {
        textStyle: { color: muted, fontSize: 12 },
        icon: "roundRect",
        itemWidth: 10,
        itemHeight: 5,
        ...(option.legend as object),
      },
    });
    chart.on("click", (params) => {
      if (onBarClick && "name" in params)
        onBarClick(
          String(params.name),
          String("seriesName" in params ? params.seriesName : ""),
        );
    });
    const observer = new ResizeObserver(() => chart.resize());
    observer.observe(container.current);
    return () => {
      observer.disconnect();
      chart.dispose();
    };
  }, [option, theme, onBarClick]);
  return (
    <div
      ref={container}
      style={{ height, width: "100%" }}
      role="img"
      aria-label={label}
    />
  );
}
