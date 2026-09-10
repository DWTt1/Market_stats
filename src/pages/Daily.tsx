import { useNavigate, useParams, useSearchParams } from "react-router";
import { useAsync, useIndex } from "../hooks/useData";
import { dataRepository } from "../services/data";
import type { DayEntry, Signal, StockRecord } from "../types/data";
import { SIGNALS, SIGNAL_LABELS } from "../config";
import { DatePicker } from "../components/DatePicker";
import { PageHeading } from "../components/PageHeading";
import { StockTable } from "../components/StockTable";
import { ErrorState, Loading, NoData } from "../components/States";
import { number } from "../utils/format";
function Records({ day, signal }: { day: DayEntry; signal: Signal }) {
  const state = useAsync(
    `${day.revision}-${signal}`,
    () => dataRepository.records(day, signal) as Promise<StockRecord[]>,
  );
  if (state.error)
    return <ErrorState message={state.error} retry={state.retry} />;
  if (!state.data) return <Loading />;
  return (
    <>
      {day.counts[signal] == null && (
        <div className="validation-banner">
          源文件中该工作表缺失或不可读，当前记录不完整。
        </div>
      )}
      <StockTable rows={state.data} date={day.date} signal={signal} />
    </>
  );
}
export default function Daily() {
  const index = useIndex(),
    { date } = useParams(),
    [params, setParams] = useSearchParams(),
    navigate = useNavigate();
  const day = index.days.find((d) => d.date === (date || index.latest));
  const query = params.get("signal");
  const signal: Signal = SIGNALS.includes(query as Signal)
    ? (query as Signal)
    : "two-yin";
  return (
    <>
      <PageHeading
        eyebrow="DAILY STATISTICS / 每日统计"
        title="每日股票明细"
        description="查询连续 K 线信号，筛选并导出当日统计记录。"
        actions={
          <DatePicker
            date={date || index.latest || ""}
            onChange={(d) => navigate(`/daily/${d}?${params.toString()}`)}
          />
        }
      />
      {!day ? (
        <NoData />
      ) : (
        <>
          <div className="signal-tabs">
            {SIGNALS.map((s) => (
              <button
                key={s}
                className={s === "three-yang-plus" ? "yang" : "yin"}
                aria-pressed={signal === s}
                onClick={() => setParams({ signal: s })}
              >
                {SIGNAL_LABELS[s]}
                <span>{number(day.counts[s])}</span>
              </button>
            ))}
          </div>
          <Records
            key={`${day.revision}-${signal}`}
            day={day}
            signal={signal}
          />
        </>
      )}
    </>
  );
}
