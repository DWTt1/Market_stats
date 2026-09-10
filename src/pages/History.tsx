import { Link, useSearchParams } from "react-router";
import { useIndex } from "../hooks/useData";
import { TrendChart } from "../components/TrendChart";
import { DatePicker } from "../components/DatePicker";
import { PageHeading } from "../components/PageHeading";
import { NoData } from "../components/States";
import { SIGNALS, SIGNAL_LABELS } from "../config";
import { number, percent, dateTime } from "../utils/format";
export default function History() {
  const index = useIndex(),
    [params, setParams] = useSearchParams(),
    date = params.get("date") || index.latest || "",
    day = index.days.find((d) => d.date === date);
  return (
    <>
      <PageHeading
        eyebrow="HISTORICAL DATA / 历史数据"
        title="交易日数据档案"
        description={`已收录 ${index.dates.length} 个统计日，趋势基于每日摘要。`}
        actions={
          <DatePicker date={date} onChange={(d) => setParams({ date: d })} />
        }
      />
      <form className="history-date-row" onSubmit={event => {
        event.preventDefault();
        const value = new FormData(event.currentTarget).get('date');
        if (typeof value === 'string' && value) setParams({ date: value });
      }}>
        <label>
          查询日期{" "}
          <input
            aria-label="查询任意日期"
            name="date"
            type="date"
            key={date}
            defaultValue={date}
            required
          />
        </label>
        <button className="button" type="submit">查询日期</button>
        {day && (
          <Link className="button" to={`/daily/${date}`}>
            查看 {date} 明细
          </Link>
        )}
      </form>
      {!day ? <NoData /> : <TrendChart through={date} />}
      <section className="panel history-table">
        <div className="panel-heading">
          <h2>全部历史摘要</h2>
          <span className="small-tag">{index.dates.length} 个统计日</span>
        </div>
        <div className="table-scroll">
          <table>
            <thead>
              <tr>
                <th>数据日期</th>
                {SIGNALS.map((s) => (
                  <th key={s}>{SIGNAL_LABELS[s]}</th>
                ))}
                <th>异常</th>
                <th>有效成交覆盖率</th>
                <th>导入时间（北京时间）</th>
                <th>数据校验</th>
              </tr>
            </thead>
            <tbody>
              {index.days.map((d) => (
                <tr
                  key={d.date}
                  className={d.date === date ? "selected-row" : ""}
                >
                  <td>
                    <Link className="code text-link" to={`/daily/${d.date}`}>
                      {d.date}
                    </Link>
                  </td>
                  {SIGNALS.map((s) => (
                    <td
                      key={s}
                      className={`numeric ${s === "three-yang-plus" ? "yang-text" : "yin-text"}`}
                    >
                      {number(d.counts[s])}
                    </td>
                  ))}
                  <td className="numeric">{number(d.counts.exceptions)}</td>
                  <td className="numeric">{percent(d.metrics.coverage)}</td>
                  <td className="code muted">{dateTime(d.importedAt)}</td>
                  <td>
                    <Link
                      to={`/about?date=${d.date}`}
                      className={d.warningCount ? "warning-text" : "muted"}
                    >
                      {d.warningCount ? `${d.warningCount} 项提示` : "通过"}
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </>
  );
}
