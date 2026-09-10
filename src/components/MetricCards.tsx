import { Link } from "react-router";
import {
  ArrowDownRight,
  ArrowUpRight,
  ShieldAlert,
  ArrowRight,
} from "lucide-react";
import type { Counts, DayEntry } from "../types/data";
import { SIGNALS, SIGNAL_LABELS } from "../config";
import { number } from "../utils/format";
export function MetricCards({
  counts,
  date,
  previous,
}: {
  counts: Counts;
  date: string;
  previous?: DayEntry;
}) {
  return (
    <div className="metric-grid">
      {[...SIGNALS, "exceptions" as const].map((signal) => {
        const value = counts[signal],
          before = previous?.counts[signal],
          change = value != null && before != null ? value - before : null;
        const tone =
          signal === "exceptions"
            ? "warning"
            : signal === "three-yang-plus"
              ? "yang"
              : "yin";
        const Icon =
          signal === "exceptions"
            ? ShieldAlert
            : signal === "three-yang-plus"
              ? ArrowUpRight
              : ArrowDownRight;
        return (
          <Link
            key={signal}
            className={`metric-card ${tone}`}
            to={
              signal === "exceptions"
                ? `/exceptions/${date}`
                : `/daily/${date}?signal=${signal}`
            }
          >
            <div className="metric-label">
              {SIGNAL_LABELS[signal]}
              <Icon size={18} />
            </div>
            <div className="metric-number">
              {number(value)}
              <small>只</small>
            </div>
            <div className="metric-bottom">
              <span>
                {change == null ? (
                  "按实际明细记录统计"
                ) : (
                  <>
                    较上一统计日{" "}
                    <strong>
                      {change > 0 ? "+" : ""}
                      {number(change)}
                    </strong>
                  </>
                )}
              </span>
              <ArrowRight size={15} />
            </div>
          </Link>
        );
      })}
    </div>
  );
}
