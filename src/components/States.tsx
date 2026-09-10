import { AlertCircle, LoaderCircle, CalendarX2 } from "lucide-react";
import { Link } from "react-router";
export function Loading() {
  return (
    <div className="state" role="status">
      <LoaderCircle className="animate-spin" size={22} />
      <span>正在读取统计数据…</span>
    </div>
  );
}
export function ErrorState({
  message,
  retry,
}: {
  message: string;
  retry?: () => void;
}) {
  return (
    <div className="state" role="alert">
      <AlertCircle />
      <p>{message}</p>
      {retry && (
        <button className="button" onClick={retry}>
          重新加载
        </button>
      )}
    </div>
  );
}
export function NoData() {
  return (
    <div className="state">
      <CalendarX2 size={32} />
      <h2>该日期暂无统计数据。</h2>
      <p>请选择已有数据的交易日期。</p>
      <Link className="button" to="/history">
        查看历史数据
      </Link>
    </div>
  );
}
