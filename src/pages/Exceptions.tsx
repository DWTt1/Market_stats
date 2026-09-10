import { Link, useNavigate, useParams, useSearchParams } from "react-router";
import { useAsync, useIndex } from "../hooks/useData";
import { dataRepository } from "../services/data";
import type { DayEntry, ExceptionRecord } from "../types/data";
import { StockTable } from "../components/StockTable";
import { DatePicker } from "../components/DatePicker";
import { PageHeading } from "../components/PageHeading";
import { Loading, ErrorState, NoData } from "../components/States";
import { number } from "../utils/format";
function ExceptionContent({ day }: { day: DayEntry }) {
  const state = useAsync(
      `exceptions-${day.revision}`,
      () =>
        dataRepository.records(day, "exceptions") as Promise<ExceptionRecord[]>,
    ),
    [params, setParams] = useSearchParams();
  if (state.error)
    return <ErrorState message={state.error} retry={state.retry} />;
  if (!state.data) return <Loading />;
  const types = state.data.reduce<Record<string, number>>((out, row) => {
    out[row.type] = (out[row.type] || 0) + 1;
    return out;
  }, {});
  return (
    <>
      <div>
        {day.counts.exceptions == null && (
          <div className="validation-banner">
            异常工作表缺失或不可读，无法确认本日异常记录。
            <Link to={`/about?date=${day.date}`}>查看核验</Link>
          </div>
        )}
      </div>
      <div className="exception-summary">
        <span>
          异常记录数量{" "}
          <strong className="warning-text">
            {number(day.counts.exceptions)}
          </strong>
        </span>
        <Link className="text-link" to={`/about?date=${day.date}`}>
          查看数据核验
        </Link>
      </div>
      <div className="exception-types">
        {Object.entries(types).map(([type, count]) => (
          <button
            key={type}
            aria-pressed={params.get("type") === type}
            onClick={() => setParams({ type })}
          >
            <span>{type}</span>
            <strong>{count}</strong>
          </button>
        ))}
      </div>
      <StockTable
        rows={state.data}
        date={day.date}
        signal="exceptions"
        exceptions
      />
    </>
  );
}
export default function Exceptions() {
  const index = useIndex(),
    { date } = useParams(),
    navigate = useNavigate(),
    day = index.days.find((d) => d.date === (date || index.latest));
  return (
    <>
      <PageHeading
        eyebrow="DATA QUALITY / 异常数据"
        title="异常与数据完整性"
        description="异常记录独立展示，保留源文件中的类型和原始行情。"
        actions={
          <DatePicker
            date={date || index.latest || ""}
            onChange={(d) => navigate(`/exceptions/${d}`)}
          />
        }
      />
      {day ? <ExceptionContent key={day.revision} day={day} /> : <NoData />}
    </>
  );
}
