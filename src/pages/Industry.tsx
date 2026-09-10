import { lazy, Suspense, useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router";
import { useAsync, useIndex } from "../hooks/useData";
import { dataRepository } from "../services/data";
import type { DayEntry, IndustryStat, Signal } from "../types/data";
import { SIGNALS, SIGNAL_LABELS, SIGNAL_COLORS } from "../config";
import { DatePicker } from "../components/DatePicker";
import { PageHeading } from "../components/PageHeading";
import { Loading, ErrorState, NoData } from "../components/States";
import { number } from "../utils/format";
const Chart = lazy(() => import("../components/Chart"));
function Ranking({
  data,
  signal,
  date,
  limit,
}: {
  data: IndustryStat[];
  signal: Signal;
  date: string;
  limit: number;
}) {
  const navigate = useNavigate();
  const rows = data
    .filter((r) => r.signal === signal)
    .sort((a, b) => b.count - a.count)
    .slice(0, limit);
  const option = useMemo(
    () => ({
      grid: { left: 86, right: 42, top: 12, bottom: 25 },
      xAxis: { type: "value" },
      yAxis: {
        type: "category",
        inverse: true,
        data: rows.map((r) => r.industry || "未分类"),
        axisLabel: { fontSize: 12 },
        splitLine: { show: false },
      },
      series: [
        {
          type: "bar",
          barMaxWidth: 15,
          itemStyle: {
            color: SIGNAL_COLORS[signal],
            borderRadius: [0, 2, 2, 0],
          },
          label: { show: true, position: "right", color: "#8795a9" },
          data: rows.map((r) => r.count),
        },
      ],
    }),
    [rows, signal],
  );
  return (
    <section className="panel">
      <div className="panel-heading">
        <h2 className={signal === "three-yang-plus" ? "yang-text" : "yin-text"}>
          {SIGNAL_LABELS[signal]}
        </h2>
        <span className="small-tag">Top {limit}</span>
      </div>
      <Suspense fallback={<Loading />}>
        <Chart
          label={`${SIGNAL_LABELS[signal]}行业排名`}
          option={option}
          height={limit === 15 ? 440 : 335}
          onBarClick={(name) =>
            navigate(
              `/daily/${date}?signal=${signal}&industry=${encodeURIComponent(name === "未分类" ? "__unknown" : name)}`,
            )
          }
        />
      </Suspense>
      <details className="chart-accessible">
        <summary>查看行业排名表</summary>
        <div>
          {rows.map((r, i) => (
            <Link
              key={r.industry || "unknown"}
              to={`/daily/${date}?signal=${signal}&industry=${encodeURIComponent(r.industry || "__unknown")}`}
            >
              {i + 1}. {r.industry || "未分类"}{" "}
              <strong>{number(r.count)}</strong>
            </Link>
          ))}
        </div>
      </details>
    </section>
  );
}
function IndustryContent({ day }: { day: DayEntry }) {
  const state = useAsync(
      `industry-${day.revision}`,
      () => dataRepository.records(day, "industry") as Promise<IndustryStat[]>,
    ),
    [limit, setLimit] = useState(10);
  if (state.error)
    return <ErrorState message={state.error} retry={state.retry} />;
  if (!state.data) return <Loading />;
  const data = state.data,
    industries = [...new Set(data.map((r) => r.industry))].sort((a, b) =>
      (a || "").localeCompare(b || "", "zh-CN"),
    );
  return (
    <>
      <div className="section-toolbar">
        <p className="muted">点击柱形或行业名称，查看对应股票明细。</p>
        <div className="segmented">
          {[10, 15].map((n) => (
            <button
              key={n}
              aria-pressed={limit === n}
              onClick={() => setLimit(n)}
            >
              Top {n}
            </button>
          ))}
        </div>
      </div>
      <div className="industry-charts">
        {SIGNALS.map((s) => (
          <Ranking
            key={s}
            data={data}
            signal={s}
            date={day.date}
            limit={limit}
          />
        ))}
      </div>
      <section className="panel">
        <div className="panel-heading">
          <div>
            <h2>行业多空结构对比</h2>
            <p>连续涨跌股票数量结构 · 单位：只 · 不代表资金流</p>
          </div>
        </div>
        <div className="table-scroll">
          <table className="comparison-table">
            <thead>
              <tr>
                <th>申万一级行业</th>
                {SIGNALS.map((s) => (
                  <th
                    key={s}
                    className={
                      s === "three-yang-plus" ? "yang-text" : "yin-text"
                    }
                  >
                    {SIGNAL_LABELS[s]}
                  </th>
                ))}
                <th>数量分布</th>
              </tr>
            </thead>
            <tbody>
              {industries.map((industry) => {
                const counts = SIGNALS.map((signal) =>
                    data
                      .filter(
                        (r) => r.industry === industry && r.signal === signal,
                      )
                      .reduce((a, r) => a + r.count, 0),
                  ),
                  total = counts.reduce((a, b) => a + b, 0);
                return (
                  <tr key={industry || "unknown"}>
                    <td>{industry || "未分类"}</td>
                    {SIGNALS.map((s, i) => (
                      <td key={s}>
                        <Link
                          className="code"
                          to={`/daily/${day.date}?signal=${s}&industry=${encodeURIComponent(industry || "__unknown")}`}
                        >
                          {number(counts[i])}
                        </Link>
                      </td>
                    ))}
                    <td>
                      <div className="stacked-bar">
                        {SIGNALS.map((s, i) => (
                          <span
                            key={s}
                            title={`${SIGNAL_LABELS[s]} ${counts[i]}`}
                            style={{
                              width: `${total ? (counts[i] / total) * 100 : 0}%`,
                              background: SIGNAL_COLORS[s],
                            }}
                          />
                        ))}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>
    </>
  );
}
export default function Industry() {
  const index = useIndex(),
    { date } = useParams(),
    navigate = useNavigate(),
    day = index.days.find((d) => d.date === (date || index.latest));
  return (
    <>
      <PageHeading
        eyebrow="SECTOR ANALYSIS / 行业统计"
        title="行业连续涨跌分布"
        description="从申万一级行业观察每日连续 K 线结构。"
        actions={
          <DatePicker
            date={date || index.latest || ""}
            onChange={(d) => navigate(`/industry/${d}`)}
          />
        }
      />
      {day ? <IndustryContent key={day.revision} day={day} /> : <NoData />}
    </>
  );
}
