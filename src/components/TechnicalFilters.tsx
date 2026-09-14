import { useEffect, useRef, useState } from "react";
import { ChevronDown, SlidersHorizontal, X } from "lucide-react";

const technicalKeys = ["j", "rsi", "jMin", "jMax", "rsiMin", "rsiMax"] as const;

export function TechnicalFilters({
  params,
  update,
}: {
  params: URLSearchParams;
  update: (changes: Record<string, string>) => void;
}) {
  const [open, setOpen] = useState(false);
  const root = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!open) return;
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    const closeOutside = (event: PointerEvent) => {
      if (root.current && !root.current.contains(event.target as Node)) setOpen(false);
    };
    document.addEventListener("keydown", closeOnEscape);
    document.addEventListener("pointerdown", closeOutside);
    return () => {
      document.removeEventListener("keydown", closeOnEscape);
      document.removeEventListener("pointerdown", closeOutside);
    };
  }, [open]);

  const j = params.get("j") || "";
  const rsi = params.get("rsi") || "";
  const jRange = Boolean(params.get("jMin") || params.get("jMax"));
  const rsiRange = Boolean(params.get("rsiMin") || params.get("rsiMax"));
  const activeCount = Number(Boolean(j || jRange)) + Number(Boolean(rsi || rsiRange));
  const preset = (kind: "j" | "rsi", value: string) =>
    update(kind === "j"
      ? { j: value, jMin: "", jMax: "" }
      : { rsi: value, rsiMin: "", rsiMax: "" });
  const range = (kind: "j" | "rsi", edge: "Min" | "Max", value: string) =>
    update({ [kind]: "", [`${kind}${edge}`]: value });

  return (
    <div className="technical-filter" ref={root}>
      <button
        className="technical-trigger"
        aria-expanded={open}
        aria-controls="technical-filter-panel"
        aria-label={`技术指标筛选${activeCount ? `，已启用 ${activeCount} 项` : ""}`}
        data-active={activeCount > 0}
        onClick={() => setOpen(!open)}
      >
        <SlidersHorizontal size={15} /> 技术指标{activeCount > 0 ? ` · ${activeCount}` : ""}
        <ChevronDown size={13} />
      </button>
      {open && (
        <div className="technical-panel" id="technical-filter-panel" role="group" aria-label="周线技术指标筛选">
          <div className="technical-panel-heading">
            <strong>周线技术指标</strong>
            <button aria-label="关闭技术指标筛选" onClick={() => setOpen(false)}><X size={16} /></button>
          </div>
          <p className="technical-help">周J 是周线 KDJ 指标中的 J 值；周 RSI14 是基于周线计算的 14 周期 RSI。</p>
          <div className="technical-group">
            <span>周 KDJ-J</span>
            <div className="technical-options">
              {[["", "不限"], ["lt20", "J < 20"], ["gt80", "J > 80"]].map(([value, label]) => (
                <button key={value} aria-pressed={j === value && (value !== "" || !jRange)} onClick={() => preset("j", value)}>{label}</button>
              ))}
            </div>
          </div>
          <div className="technical-group">
            <span>周 RSI14</span>
            <div className="technical-options">
              {[["", "不限"], ["lt35", "RSI < 35"], ["gt70", "RSI > 70"]].map(([value, label]) => (
                <button key={value} aria-pressed={rsi === value && (value !== "" || !rsiRange)} onClick={() => preset("rsi", value)}>{label}</button>
              ))}
            </div>
          </div>
          <div className="technical-group">
            <span>快速组合</span>
            <div className="technical-options">
              <button aria-pressed={j === "lt20" && rsi === "lt35"} onClick={() => update({ j: "lt20", rsi: "lt35", jMin: "", jMax: "", rsiMin: "", rsiMax: "" })}>双低 · J &lt; 20 且 RSI &lt; 35</button>
              <button aria-pressed={j === "gt80" && rsi === "gt70"} onClick={() => update({ j: "gt80", rsi: "gt70", jMin: "", jMax: "", rsiMin: "", rsiMax: "" })}>双高 · J &gt; 80 且 RSI &gt; 70</button>
            </div>
          </div>
          <details className="technical-advanced">
            <summary>高级筛选</summary>
            <div className="technical-group">
              <span>J 极值</span>
              <div className="technical-options">
                <button aria-pressed={j === "lt0"} onClick={() => preset("j", "lt0")}>J &lt; 0</button>
                <button aria-pressed={j === "gt100"} onClick={() => preset("j", "gt100")}>J &gt; 100</button>
              </div>
            </div>
            <div className="technical-ranges">
              {(["j", "rsi"] as const).map((kind) => (
                <div key={kind}>
                  <span>{kind === "j" ? "周 J" : "周 RSI14"} 范围</span>
                  <label>最小值 <input type="number" step="any" value={params.get(`${kind}Min`) || ""} onChange={(event) => range(kind, "Min", event.target.value)} /></label>
                  <label>最大值 <input type="number" step="any" value={params.get(`${kind}Max`) || ""} onChange={(event) => range(kind, "Max", event.target.value)} /></label>
                </div>
              ))}
            </div>
          </details>
          <div className="technical-panel-footer">
            <span>指标条件与当前连续涨跌信号及其他筛选条件同时生效。</span>
            <button onClick={() => update(Object.fromEntries(technicalKeys.map((key) => [key, ""]))) }>清除技术指标</button>
          </div>
        </div>
      )}
    </div>
  );
}
