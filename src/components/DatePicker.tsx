import { CalendarDays, ChevronLeft, ChevronRight } from "lucide-react";
import { useIndex } from "../hooks/useData";
export function DatePicker({
  date,
  onChange,
}: {
  date: string;
  onChange: (date: string) => void;
}) {
  const index = useIndex();
  const offset = index.dates.indexOf(date);
  const previous = index.dates.filter((d) => d < date)[0];
  const next = index.dates.filter((d) => d > date).at(-1);
  return (
    <div className="date-picker">
      <button
        className="icon-button"
        aria-label="上一个交易日"
        disabled={!previous}
        onClick={() => previous && onChange(previous)}
      >
        <ChevronLeft size={16} />
      </button>
      <CalendarDays size={15} className="muted" />
      <select
        aria-label="选择交易日期"
        value={offset < 0 ? "" : date}
        onChange={(e) => onChange(e.target.value)}
      >
        {offset < 0 && <option value="">{date || "暂无日期"}</option>}
        {index.dates.map((d) => (
          <option key={d} value={d}>
            {d}
          </option>
        ))}
      </select>
      <button
        className="icon-button"
        aria-label="下一个交易日"
        disabled={!next}
        onClick={() => next && onChange(next)}
      >
        <ChevronRight size={16} />
      </button>
    </div>
  );
}
