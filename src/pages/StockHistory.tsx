import { Link, useParams } from "react-router";
import { useAsync, useIndex } from "../hooks/useData";
import { dataRepository } from "../services/data";
import { PageHeading } from "../components/PageHeading";
import { Loading, ErrorState } from "../components/States";
import { SIGNAL_LABELS } from "../config";
export default function StockHistory() {
  const index = useIndex(),
    { code = "" } = useParams(),
    state = useAsync(`stock-${index.generatedAt}-${code}`, () =>
      dataRepository.stockHistory(index, code),
    );
  return (
    <>
      <PageHeading
        eyebrow="STOCK HISTORY / 股票历史信号"
        title={state.data ? `${state.data.name || "—"} · ${code}` : code}
        description="逐个统计日查看信号。未出现仅表示未出现在已导入的统计表中。"
      />
      {state.error ? (
        <ErrorState message={state.error} retry={state.retry} />
      ) : state.data === undefined ? (
        <Loading />
      ) : !state.data ? (
        <div className="state">{index.days.some(day => Object.values(day.counts).some(v => v == null)) ? "已读取的历史数据中未找到该股票；部分日期数据不完整，无法完整判断。" : "该股票尚未出现在已导入的历史统计中。"}</div>
      ) : (
        <section className="panel">
          <div className="table-scroll">
            <table>
              <thead>
                <tr>
                  <th>统计日期</th>
                  <th>当日信号 / 异常类型</th>
                  <th>连续天数</th>
                  <th>明细</th>
                </tr>
              </thead>
              <tbody>
                {index.dates.map((date) => {
                  const entries = state.data!.records.filter(
                    (r) => r.date === date,
                  );
                  const incomplete = Object.values(
                    index.days.find((d) => d.date === date)!.counts,
                  ).some((v) => v == null);
                  return (
                    <tr key={date}>
                      <td className="code">{date}</td>
                      <td>
                        {entries.length ? (
                          entries.map((r, i) => (
                            <span
                              key={i}
                              className={`history-signal ${r.signal === "three-yang-plus" ? "yang-text" : r.signal === "exceptions" ? "warning-text" : "yin-text"}`}
                            >
                              {r.signal === "exceptions"
                                ? r.type
                                : SIGNAL_LABELS[r.signal]}
                            </span>
                          ))
                        ) : (
                          <span className="muted">
                            {incomplete
                              ? "本日部分统计表缺失，无法完整判断"
                              : "未出现在本日统计信号中"}
                          </span>
                        )}
                      </td>
                      <td>
                        {entries
                          .filter((r) => r.streak != null)
                          .map((r) => `${r.streak} 天`)
                          .join(" / ") || "—"}
                      </td>
                      <td>
                        <Link
                          className="text-link"
                          to={
                            entries[0]?.signal === "exceptions"
                              ? `/exceptions/${date}?q=${code}`
                              : `/daily/${date}?q=${code}&signal=${entries[0]?.signal || "two-yin"}`
                          }
                        >
                          查看当日
                        </Link>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </section>
      )}
    </>
  );
}
