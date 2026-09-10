import { Link, useSearchParams } from "react-router";
import { useAsync, useIndex } from "../hooks/useData";
import { dataRepository } from "../services/data";
import type { DayEntry } from "../types/data";
import { PageHeading } from "../components/PageHeading";
import { DatePicker } from "../components/DatePicker";
import { Loading, ErrorState, NoData } from "../components/States";
import { dateTime } from "../utils/format";
const explanations: Record<string, string> = {
  阳线: "当天收盘价高于开盘价。这里比较的是同一天的开盘与收盘，不是与前一日收盘价相比。",
  阴线: "当天收盘价低于开盘价。平盘 K 线不属于阳线或阴线。",
  严格两连阴:
    "截至统计日，恰好连续两个交易日为阴线；在这段连续阴线之前，还需要一个行情有效且不是阴线的交易日来确认起点。",
  严格三连阴:
    "截至统计日，恰好连续三个交易日为阴线，并有有效的边界行情确认连续段。它与严格两连阴互斥。",
  三连阳及以上:
    "截至统计日，连续至少三个交易日为阳线。明细展示实际天数，可能为 3、4、5 天或更长。",
};
function AboutContent({ day }: { day: DayEntry }) {
  const state = useAsync(day.revision, () => dataRepository.summary(day));
  if (state.error)
    return <ErrorState message={state.error} retry={state.retry} />;
  if (!state.data) return <Loading />;
  const s = state.data,
    warnings = s.validations.filter((v) => v.status !== "pass");
  return (
    <>
      <div className="about-intro panel">
        <h2>统计的是 K 线连续性</h2>
        <p>
          本站统计未复权日 K
          线的连续阴线和连续阳线。连续阳线不等同于股价连续高于前一日收盘价；行业数量也不代表资金流入或流出。
        </p>
        <p>
          三类信号只是符合各自条件的股票集合，不涵盖全部上市股票。ST / *ST
          保留并标识，停牌、无有效行情与历史不足等记录在
          <Link to={`/exceptions/${day.date}`}>异常数据</Link>中单独展示。
        </p>
      </div>
      <section className="panel definitions">
        <div className="panel-heading">
          <h2>统计口径</h2>
          <span className="small-tag">来自 {day.date} 汇总页</span>
        </div>
        {s.definitions.map((d, i) => (
          <article key={`${d.label}-${i}`}>
            <h3>{d.label}</h3>
            <div>
              {explanations[d.label] && <p>{explanations[d.label]}</p>}
              <p
                className={explanations[d.label] ? "technical-definition" : ""}
              >
                {d.text}
              </p>
            </div>
          </article>
        ))}
      </section>
      <section className="panel">
        <div className="panel-heading">
          <div>
            <h2>数据一致性核验</h2>
            <p>
              {s.validations.filter((v) => v.status === "pass").length} 项通过 ·{" "}
              {warnings.length} 项需说明
            </p>
          </div>
        </div>
        {warnings.length > 0 && (
          <div className="validation-list">
            {warnings.map((v, i) => (
              <div key={`${v.name}-${i}`}>
                <strong className="warning-text">{v.name}</strong>
                <p>{v.message}</p>
                <small>
                  预期：
                  {v.expected == null ? "未提供" : JSON.stringify(v.expected)}
                  　实际：{v.actual == null ? "—" : JSON.stringify(v.actual)}
                </small>
              </div>
            ))}
          </div>
        )}
        <details className="all-checks">
          <summary>查看全部 {s.validations.length} 项核验</summary>
          <div className="table-scroll">
            <table>
              <thead>
                <tr>
                  <th>项目</th>
                  <th>预期</th>
                  <th>实际</th>
                  <th>状态</th>
                </tr>
              </thead>
              <tbody>
                {s.validations.map((v, i) => (
                  <tr key={i}>
                    <td>{v.name}</td>
                    <td>
                      {v.expected == null ? "—" : JSON.stringify(v.expected)}
                    </td>
                    <td>{v.actual == null ? "—" : JSON.stringify(v.actual)}</td>
                    <td>
                      {v.status === "pass"
                        ? "通过"
                        : v.status === "unavailable"
                          ? "源值缺失"
                          : "提示"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </details>
      </section>
      <section className="panel">
        <div className="panel-heading">
          <h2>源文件核验记录</h2>
        </div>
        <div className="table-scroll">
          <table>
            <thead>
              <tr>
                <th>核验项目</th>
                <th>结果</th>
                <th>阈值 / 预期</th>
                <th>结论</th>
              </tr>
            </thead>
            <tbody>
              {s.sourceChecks.map((c, i) => (
                <tr key={i}>
                  <td>{c.name}</td>
                  <td>{c.result || "—"}</td>
                  <td>{c.expected || "—"}</td>
                  <td>{c.conclusion || "未注明"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
      <section className="panel provenance">
        <h2>数据来源与更新时间</h2>
        <dl>
          <dt>交易日期</dt>
          <dd>{s.date}</dd>
          <dt>导入时间</dt>
          <dd>{dateTime(s.importedAt)}（北京时间）</dd>
          <dt>源文件</dt>
          <dd>{s.source.file}</dd>
          <dt>日期识别</dt>
          <dd>
            {s.source.dateOrigin === "summary:T0日期"
              ? "汇总页 T0日期"
              : "旧版汇总标题 / 范围（兼容回退）"}
          </dd>
          <dt>同日候选文件</dt>
          <dd>{s.source.candidates.join("、")}</dd>
          <dt>行情来源</dt>
          <dd>{s.sources.market}</dd>
          <dt>交易日历</dt>
          <dd>
            <a
              href="https://www.sse.com.cn/disclosure/dealinstruc/closed/"
              target="_blank"
              rel="noreferrer"
            >
              上海证券交易所公开交易日历
            </a>
          </dd>
        </dl>
        <p className="muted">
          本站为独立统计展示网站，不代表与同花顺、iFinD
          或交易所存在官方合作关系。
        </p>
      </section>
    </>
  );
}
export default function About() {
  const index = useIndex(),
    [params, setParams] = useSearchParams(),
    date = params.get("date") || index.latest || "",
    day = index.days.find((d) => d.date === date);
  return (
    <>
      <PageHeading
        eyebrow="METHODOLOGY / 统计说明"
        title="口径、来源与数据透明度"
        actions={
          <DatePicker date={date} onChange={(d) => setParams({ date: d })} />
        }
      />
      {day ? <AboutContent key={day.revision} day={day} /> : <NoData />}
    </>
  );
}
