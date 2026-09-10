import { lazy, Suspense, useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router";
import { ArrowRight, Check, Info, ListFilter, Activity } from "lucide-react";
import { useAsync, useIndex } from "../hooks/useData";
import { dataRepository } from "../services/data";
import type { DayEntry, IndustryStat, Signal } from "../types/data";
import { SIGNAL_LABELS, SIGNALS, SIGNAL_COLORS } from "../config";
import { number, percent, fullDate } from "../utils/format";
import { DatePicker } from "../components/DatePicker";
import { PageHeading } from "../components/PageHeading";
import { MetricCards } from "../components/MetricCards";
import { TrendChart } from "../components/TrendChart";
import { Loading, ErrorState, NoData } from "../components/States";
const Chart = lazy(() => import("../components/Chart"));

function Overview({ day }: { day: DayEntry }) {
  const index = useIndex(),
    [params, setParams] = useSearchParams(),
    [industrySignal, setIndustrySignal] = useState<Signal>("two-yin");
  const state = useAsync(day.revision, () => dataRepository.summary(day));
  const industryState = useAsync(
    `industry-${day.revision}`,
    () => dataRepository.records(day, "industry") as Promise<IndustryStat[]>,
  );
  const summary = state.data;
  const option = useMemo(
    () => ({
      grid: { left: 54, right: 25, top: 30, bottom: 38 },
      xAxis: {
        type: "category",
        data: SIGNALS.map((s) => SIGNAL_LABELS[s]),
        axisTick: { show: false },
        axisLabel: { fontSize: 12 },
      },
      yAxis: { type: "value", name: "只" },
      series: [
        {
          type: "bar",
          barWidth: "35%",
          label: {
            show: true,
            position: "top",
            color: "#8e9caf",
            fontSize: 13,
          },
          itemStyle: { borderRadius: [3, 3, 0, 0] },
          data: SIGNALS.map((s) => ({
            value: day.counts[s],
            itemStyle: { color: SIGNAL_COLORS[s] },
          })),
        },
      ],
    }),
    [day],
  );
  if (state.error)
    return <ErrorState message={state.error} retry={state.retry} />;
  if (!summary) return <Loading />;
  const industries = (industryState.data || [])
    .filter((i) => i.signal === industrySignal)
    .sort((a, b) => b.count - a.count);
  const topThree = (industryState.data || [])
    .filter((i) => i.signal === "three-yin")
    .sort((a, b) => b.count - a.count)[0];
  const topYang = (industryState.data || [])
    .filter((i) => i.signal === "three-yang-plus")
    .sort((a, b) => b.count - a.count)[0];
  const previous = index.days[index.dates.indexOf(day.date) + 1];
  return (
    <>
      <PageHeading
        eyebrow="MARKET OVERVIEW / 市场概览"
        title={fullDate(day.date)}
        description="A 股每日连阴连阳统计"
        actions={
          <>
            <span className="trading-badge">
              <Check size={13} />
              {summary.tradingStatus}
            </span>
            <DatePicker
              date={day.date}
              onChange={(date) => {
                const p = new URLSearchParams(params);
                p.set("date", date);
                setParams(p);
              }}
            />
          </>
        }
      />
      <MetricCards
        counts={summary.counts}
        date={day.date}
        previous={previous}
      />
      <div className="mini-metrics">
        {[
          ["上市股票池", number(summary.metrics.listed)],
          ["有效成交", number(summary.metrics.active)],
          ["有效成交覆盖率", percent(summary.metrics.coverage)],
          ["停牌", number(summary.metrics.suspended)],
          ["历史缺失 / 上市不足", number(summary.metrics.historyMissing)],
        ].map(([label, value]) => (
          <div key={label}>
            <span>{label}</span>
            <strong>{value}</strong>
          </div>
        ))}
      </div>
      {day.warningCount > 0 && (
        <Link to={`/about?date=${day.date}`} className="validation-banner">
          <Info size={16} />
          {
            day.warningCount
          } 项数据提示，包括旧格式兼容或一致性核验；查看明细{" "}
          <ArrowRight size={14} />
        </Link>
      )}
      <div className="overview-charts">
        <section className="panel">
          <div className="panel-heading">
            <div>
              <h2>
                <Activity size={16} />
                连续涨跌结构
              </h2>
              <p>按日 K 线开收盘关系统计</p>
            </div>
            <span className="small-tag">{day.date}</span>
          </div>
          <Suspense fallback={<Loading />}>
            <Chart
              label="两连阴、三连阴、三连阳及以上数量柱状图"
              option={option}
              height={258}
            />
          </Suspense>
          <div className="panel-note">
            <Info size={13} />
            仅展示三类连续 K 线结构，不代表全市场涨跌家数。
          </div>
        </section>
        <TrendChart through={day.date} />
      </div>
      <div className="insights-strip">
        <span className="insights-label">
          <span className="status-dot" />
          今日关注数据
        </span>
        <p>
          最长连续阳线{" "}
          <strong className="yang-text">
            {number(summary.highlights.longestYangDays)} 天
          </strong>
        </p>
        <p>
          三连阴最多{" "}
          <strong>
            {topThree?.industry || "—"}{" "}
            <span className="yin-text">{number(topThree?.count)}</span>
          </strong>
        </p>
        <p>
          连阳最多{" "}
          <strong>
            {topYang?.industry || "—"}{" "}
            <span className="yang-text">{number(topYang?.count)}</span>
          </strong>
        </p>
        <p>
          ST 信号 <strong>{number(summary.highlights.stSignalCount)} 只</strong>
        </p>
      </div>
      <div className="overview-bottom">
        <section className="panel">
          <div className="panel-heading">
            <div>
              <h2>
                行业分布 <span className="muted">Top 8</span>
              </h2>
              <p>申万一级行业 · 点击行业查看股票</p>
            </div>
            <Link className="text-link" to={`/industry/${day.date}`}>
              全部行业 <ArrowRight size={14} />
            </Link>
          </div>
          <div className="panel-tabs">
            {SIGNALS.map((s) => (
              <button
                key={s}
                aria-pressed={industrySignal === s}
                onClick={() => setIndustrySignal(s)}
              >
                {SIGNAL_LABELS[s]}
              </button>
            ))}
          </div>
          {industryState.error ? (
            <ErrorState
              message={industryState.error}
              retry={industryState.retry}
            />
          ) : !industryState.data ? (
            <Loading />
          ) : (
            <div className="industry-ranking">
              {industries.slice(0, 8).map((item, i) => (
                <Link
                  key={item.industry || "unknown"}
                  to={`/daily/${day.date}?signal=${industrySignal}&industry=${encodeURIComponent(item.industry || "__unknown")}`}
                >
                  <span className="rank code">
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  <span className="industry-name">
                    {item.industry || "未分类"}
                  </span>
                  <span className="rank-track">
                    <span
                      style={{
                        width: `${industries[0]?.count ? (item.count / industries[0].count) * 100 : 0}%`,
                        background: SIGNAL_COLORS[industrySignal],
                      }}
                    />
                  </span>
                  <strong className="code">{number(item.count)}</strong>
                </Link>
              ))}
            </div>
          )}
        </section>
        <section className="panel">
          <div className="panel-heading">
            <div>
              <h2>连续阳线最长股票</h2>
              <p>仅陈述统计事实 · 按实际连续天数排序</p>
            </div>
            <span className="small-tag yang-text">连阳</span>
          </div>
          <div className="leader-table">
            <div className="leader-head">
              <span>证券简称 / 代码</span>
              <span>申万行业</span>
              <span>连续天数</span>
            </div>
            {summary.highlights.longestYangStocks
              .slice(0, 8)
              .map((stock, i) => (
                <Link
                  to={`/stock/${stock.code}`}
                  className="leader-row"
                  key={stock.code}
                >
                  <span className="leader-stock">
                    <span className={`leader-rank ${i === 0 ? "first" : ""}`}>
                      {i + 1}
                    </span>
                    <span>
                      <strong>{stock.name || "—"}</strong>
                      <small className="code muted">{stock.code}</small>
                    </span>
                  </span>
                  <span className="muted">{stock.industry || "—"}</span>
                  <span className="yang-text code">
                    {stock.streak} <small>天</small>
                  </span>
                </Link>
              ))}
          </div>
          <Link
            className="panel-bottom-link"
            to={`/daily/${day.date}?signal=three-yang-plus&sort=streak&order=desc`}
          >
            查看全部连阳股票 <ArrowRight size={14} />
          </Link>
        </section>
      </div>
      <Link className="quick-entry" to={`/daily/${day.date}`}>
        <div>
          <ListFilter size={22} />
          <span>
            <strong>每日数据快速查看</strong>
            <small>按证券、行业、ST 状态及连续天数筛选，支持导出 CSV。</small>
          </span>
        </div>
        <span className="button primary">
          进入每日统计 <ArrowRight size={16} />
        </span>
      </Link>
    </>
  );
}
export default function Home() {
  const index = useIndex(),
    [params] = useSearchParams();
  const day = index.days.find(
    (d) => d.date === (params.get("date") || index.latest),
  );
  return day ? <Overview key={day.revision} day={day} /> : <NoData />;
}
