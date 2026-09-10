import { useEffect, useState } from "react";
import { Search, X, ArrowUpRight } from "lucide-react";
import { Link, useLocation } from "react-router";
import { useAsync } from "../hooks/useData";
import { dataRepository } from "../services/data";
import type { DayEntry, Signal } from "../types/data";
import { SIGNAL_LABELS } from "../config";
import { number } from "../utils/format";
import { Loading, ErrorState } from "./States";
function SearchResults({ day, query }: { day: DayEntry; query: string }) {
  const state = useAsync(day.revision, () => dataRepository.searchDay(day));
  const [limit, setLimit] = useState(20);
  if (state.error)
    return <ErrorState message={state.error} retry={state.retry} />;
  if (!state.data) return <Loading />;
  const incomplete = Object.values(day.counts).some((value) => value == null);
  const results = state.data.filter(
    ({ record }) =>
      record.code.toLowerCase().includes(query.toLowerCase()) ||
      record.name?.includes(query),
  );
  return (
    <div className="search-results" aria-live="polite">
      <div className="search-results-label">
        {incomplete && (
          <p className="warning-text">
            本日部分统计表缺失，无法完整判断。
            <Link to={`/about?date=${day.date}`}>查看核验</Link>
          </p>
        )}
        {day.date} · 找到 {results.length} 条统计记录
      </div>
      {results.length === 0 ? (
        <p className="empty-search">
          {incomplete
            ? "已读取的数据中未找到该股票，本日数据不完整。"
            : "该股票未出现在本日统计信号中"}
        </p>
      ) : (
        results.slice(0, limit).map(({ signal, record }, i) => (
          <Link
            key={`${signal}-${record.code}-${i}`}
            className="search-result"
            to={`/stock/${record.code}`}
          >
            <div>
              <strong>{record.name || "—"}</strong>
              <span className="code muted">{record.code}</span>
              <ArrowUpRight size={14} />
            </div>
            <p>
              <span
                className={
                  signal === "three-yang-plus"
                    ? "yang-text"
                    : signal === "exceptions"
                      ? "warning-text"
                      : "yin-text"
                }
              >
                {signal === "exceptions" && "type" in record
                  ? record.type
                  : SIGNAL_LABELS[signal as Signal]}
              </span>{" "}
              · {record.streak == null ? "—" : `${record.streak} 天`} ·{" "}
              {record.industry || "未分类"} · ST：
              {record.isST == null ? "未知" : record.isST ? "是" : "否"}
            </p>
            <p className="code muted">
              开 {number(record.open)}　高 {number(record.high)}　低{" "}
              {number(record.low)}　收 {number(record.close)}
            </p>
          </Link>
        ))
      )}
      {results.length > limit && (
        <button className="text-button" onClick={() => setLimit((n) => n + 20)}>
          显示更多结果
        </button>
      )}
    </div>
  );
}
export function GlobalSearch({ day }: { day?: DayEntry }) {
  const [query, setQuery] = useState(""),
    [open, setOpen] = useState(false);
  const location = useLocation();
  useEffect(() => {
    setOpen(false);
  }, [location.pathname]);
  return (
    <div
      className="global-search"
      onBlur={(e) => {
        if (!e.currentTarget.contains(e.relatedTarget as Node)) setOpen(false);
      }}
    >
      <label className="search-field">
        <Search size={16} />
        <input
          aria-label="全局股票搜索"
          placeholder="搜索股票代码或名称"
          value={query}
          onFocus={() => setOpen(true)}
          onKeyDown={(e) => {
            if (e.key === "Escape") setOpen(false);
          }}
          onChange={(e) => {
            setQuery(e.target.value);
            setOpen(true);
          }}
        />
        {query && (
          <button
            className="icon-button"
            aria-label="清除全局搜索"
            onClick={() => {
              setQuery("");
              setOpen(false);
            }}
          >
            <X size={14} />
          </button>
        )}
      </label>
      {open && query.trim() && day && (
        <SearchResults
          key={day.date + query.trim()}
          day={day}
          query={query.trim()}
        />
      )}
    </div>
  );
}
