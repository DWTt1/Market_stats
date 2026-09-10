import { useEffect, useMemo, useRef } from "react";
import { Link, useSearchParams } from "react-router";
import {
  ArrowDown,
  ArrowUp,
  ChevronsUpDown,
  Download,
  Search,
  ChevronLeft,
  ChevronRight,
  RotateCcw,
} from "lucide-react";
import type { StockRow } from "../utils/stocks";
import { filterAndSort } from "../utils/stocks";
import { exportCsv } from "../utils/csv";
import { number, volume } from "../utils/format";

const columns = [
  ["code", "证券代码"],
  ["name", "证券简称"],
  ["industry", "申万一级行业"],
  ["streak", "连续天数"],
  ["isST", "ST"],
  ["open", "开盘价"],
  ["high", "最高价"],
  ["low", "最低价"],
  ["close", "收盘价"],
  ["volume", "成交量"],
  ["listedDate", "上市日期"],
];
export function StockTable({
  rows,
  date,
  signal,
  exceptions = false,
}: {
  rows: StockRow[];
  date: string;
  signal: string;
  exceptions?: boolean;
}) {
  const [params, setParams] = useSearchParams();
  const pendingParams = useRef(params);
  useEffect(() => { pendingParams.current = params; }, [params]);
  const industry = params.get("industry") || "",
    st = params.get("st") || "",
    streak = params.get("streak") || "";
  const update = (changes: Record<string, string>, resetPage = true) => {
    const p = new URLSearchParams(pendingParams.current);
    if (resetPage) p.delete("page");
    Object.entries(changes).forEach(([key, value]) =>
      value ? p.set(key, value) : p.delete(key),
    );
    pendingParams.current = p;
    setParams(p, { replace: true });
  };
  const filtered = useMemo(() => filterAndSort(rows, params), [rows, params]);
  const industries = [
    ...new Set(rows.map((r) => r.industry || "__unknown")),
  ].sort((a, b) => a.localeCompare(b, "zh-CN"));
  const days = [
    ...new Set(rows.map((r) => r.streak).filter((v): v is number => v != null)),
  ].sort((a, b) => a - b);
  const types = [
    ...new Set(rows.flatMap((r) => ("type" in r ? [r.type] : []))),
  ];
  const size = [20, 50, 100].includes(Number(params.get("size")))
    ? Number(params.get("size"))
    : 50;
  const totalPages = Math.max(1, Math.ceil(filtered.length / size)),
    requestedPage = Number(params.get("page") || 1);
  const page = Number.isFinite(requestedPage)
    ? Math.min(totalPages, Math.max(1, Math.floor(requestedPage)))
    : 1;
  const visible = filtered.slice((page - 1) * size, page * size);
  const sort = params.get("sort") || "code",
    order = params.get("order") || "asc";
  const tableColumns = exceptions
    ? [
        ...columns.filter(([key]) => key !== "streak"),
        ["type", "异常类型"],
        ["missingDates", "缺失日期"],
      ]
    : columns;
  return (
    <section className="panel table-panel">
      <div className="filter-bar">
        <label className="search-field">
          <Search size={16} />
          <input
            aria-label="搜索证券代码或名称"
            placeholder="搜索代码 / 名称"
            value={params.get("q") || ""}
            onChange={(e) => update({ q: e.target.value })}
          />
        </label>
        <select
          aria-label="行业筛选"
          value={industry}
          onChange={(e) => update({ industry: e.target.value })}
        >
          <option value="">全部行业</option>
          {industries.map((i) => (
            <option key={i} value={i}>
              {i === "__unknown" ? "未分类" : i}
            </option>
          ))}
        </select>
        <select
          aria-label="ST筛选"
          value={st}
          onChange={(e) => update({ st: e.target.value })}
        >
          <option value="">全部 ST 状态</option>
          <option value="yes">ST / *ST</option>
          <option value="no">非 ST</option>
          <option value="unknown">ST 未知</option>
        </select>
        {exceptions ? (
          <select
            aria-label="异常类型筛选"
            value={params.get("type") || ""}
            onChange={(e) => update({ type: e.target.value })}
          >
            <option value="">全部异常类型</option>
            {types.map((t) => (
              <option key={t}>{t}</option>
            ))}
          </select>
        ) : (
          <select
            aria-label="连续天数筛选"
            value={streak}
            onChange={(e) => update({ streak: e.target.value })}
          >
            <option value="">全部连续天数</option>
            {days.map((d) => (
              <option key={d} value={d}>
                {d} 天
              </option>
            ))}
            {["4+", "6+"].map((d) => (
              <option key={d} value={d}>
                {d.slice(0, -1)} 天及以上
              </option>
            ))}
          </select>
        )}
        <button
          className="icon-button reset-button"
          aria-label="重置筛选"
          title="重置筛选"
          onClick={() => setParams(signal === "exceptions" ? {} : { signal })}
        >
          <RotateCcw size={16} />
        </button>
        <button
          className="button export-button"
          onClick={() =>
            exportCsv(filtered, `${date}_${signal}_筛选结果.csv`, exceptions)
          }
        >
          <Download size={15} />
          导出当前结果
        </button>
      </div>
      {signal === "three-yang-plus" && (
        <div className="quick-filters">
          <span className="muted">连续阳线</span>
          {[
            ["", "全部"],
            ["3", "3天"],
            ["4", "4天"],
            ["5", "5天"],
            ["6+", "6天及以上"],
          ].map(([value, label]) => (
            <button
              key={label}
              aria-pressed={streak === value}
              onClick={() => update({ streak: value })}
            >
              {label}
            </button>
          ))}
          <select
            aria-label="连续天数排序"
            value={sort === "streak" ? order : ""}
            onChange={(e) =>
              update(
                e.target.value
                  ? { sort: "streak", order: e.target.value }
                  : { sort: "code", order: "asc" },
              )
            }
          >
            <option value="">默认排序</option>
            <option value="desc">连续天数从高到低</option>
            <option value="asc">连续天数从低到高</option>
          </select>
        </div>
      )}
      <div className="table-caption">
        <span>
          共 <strong>{number(filtered.length)}</strong> 条结果{" "}
          <span className="muted">/ 原始 {number(rows.length)} 条</span>
        </span>
        <span className="muted">价格：元 · 成交量：股</span>
      </div>
      <div className="table-scroll">
        <table className="stock-table">
          <thead>
            <tr>
              {tableColumns.map(([key, label]) => (
                <th
                  key={key}
                  aria-sort={
                    sort === key
                      ? order === "desc"
                        ? "descending"
                        : "ascending"
                      : "none"
                  }
                >
                  <button
                    onClick={() =>
                      update({
                        sort: key,
                        order: sort === key && order === "asc" ? "desc" : "asc",
                      })
                    }
                  >
                    {label}
                    {sort === key ? (
                      order === "desc" ? (
                        <ArrowDown size={12} />
                      ) : (
                        <ArrowUp size={12} />
                      )
                    ) : (
                      <ChevronsUpDown size={12} />
                    )}
                  </button>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {visible.map((row, i) => (
              <tr key={`${row.code}-${i}`}>
                <td>
                  <Link className="code stock-link" to={`/stock/${row.code}`}>
                    {row.code}
                  </Link>
                </td>
                <td>
                  <Link className="stock-name" to={`/stock/${row.code}`}>
                    {row.name || "—"}
                  </Link>
                </td>
                <td>{row.industry || "—"}</td>
                {!exceptions && (
                  <td>
                    <span
                      className={
                        signal === "three-yang-plus"
                          ? "streak-badge yang-text"
                          : "streak-badge yin-text"
                      }
                    >
                      {row.streak == null ? "—" : `${row.streak} 天`}
                    </span>
                  </td>
                )}
                <td>
                  {row.isST == null ? (
                    <span className="muted">未知</span>
                  ) : row.isST ? (
                    <span className="st-badge">ST</span>
                  ) : (
                    <span className="muted">否</span>
                  )}
                </td>
                <td className="numeric">{number(row.open)}</td>
                <td className="numeric">{number(row.high)}</td>
                <td className="numeric">{number(row.low)}</td>
                <td className="numeric price-emphasis">{number(row.close)}</td>
                <td className="numeric" title={number(row.volume)}>
                  {volume(row.volume)}
                </td>
                <td className="code muted">{row.listedDate || "—"}</td>
                {exceptions && "type" in row && (
                  <>
                    <td>{row.type}</td>
                    <td className="code">
                      {row.missingDates?.join(", ") || "—"}
                    </td>
                  </>
                )}
              </tr>
            ))}
          </tbody>
        </table>
        {visible.length === 0 && (
          <div className="empty-table">
            没有符合筛选条件的记录。
            <button
              onClick={() =>
                setParams(signal === "exceptions" ? {} : { signal })
              }
            >
              清除筛选
            </button>
          </div>
        )}
      </div>
      <div className="pagination">
        <label>
          每页{" "}
          <select
            aria-label="每页条数"
            value={size}
            onChange={(e) => update({ size: e.target.value })}
          >
            {[20, 50, 100].map((n) => (
              <option key={n}>{n}</option>
            ))}
          </select>{" "}
          条
        </label>
        <span className="muted">
          {filtered.length ? (page - 1) * size + 1 : 0}–
          {Math.min(page * size, filtered.length)} / {number(filtered.length)}
        </span>
        <div>
          <button
            className="icon-button"
            aria-label="上一页"
            disabled={page <= 1}
            onClick={() => update({ page: String(page - 1) }, false)}
          >
            <ChevronLeft size={16} />
          </button>
          <span className="page-count">
            {page} / {totalPages}
          </span>
          <button
            className="icon-button"
            aria-label="下一页"
            disabled={page >= totalPages}
            onClick={() => update({ page: String(page + 1) }, false)}
          >
            <ChevronRight size={16} />
          </button>
        </div>
      </div>
    </section>
  );
}
