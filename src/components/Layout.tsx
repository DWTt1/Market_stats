import { Link, NavLink, Outlet, useLocation } from "react-router";
import {
  ChartNoAxesCombined,
  Monitor,
  Moon,
  Sun,
  Database,
  ArrowUpRight,
} from "lucide-react";
import { useEffect } from "react";
import { SITE_NAME, DISCLAIMER } from "../config";
import { useIndex } from "../hooks/useData";
import { useTheme, ThemeContext, type Theme } from "../hooks/useTheme";
import { GlobalSearch } from "./GlobalSearch";
import { dateTime } from "../utils/format";
export function Layout() {
  const index = useIndex(),
    location = useLocation(),
    { theme, setTheme, resolved } = useTheme();
  const routeDate =
    /^\/(?:daily|industry|exceptions)\/(\d{4}-\d{2}-\d{2})/.exec(
      location.pathname,
    )?.[1] ||
    new URLSearchParams(location.search).get("date") ||
    index.latest;
  const day = index.days.find((d) => d.date === routeDate);
  useEffect(() => {
    window.scrollTo(0, 0);
    const label = location.pathname.startsWith("/daily")
      ? "每日统计"
      : location.pathname.startsWith("/industry")
        ? "行业统计"
        : location.pathname.startsWith("/history")
          ? "历史数据"
          : location.pathname.startsWith("/exceptions")
            ? "异常数据"
            : location.pathname.startsWith("/about")
              ? "统计说明"
              : location.pathname.startsWith("/stock")
                ? "股票历史信号"
                : "每日连阴连阳数据";
    document.title = `${SITE_NAME}｜${label}`;
  }, [location.pathname]);
  return (
    <ThemeContext value={resolved}>
      <a className="skip-link" href="#main">
        跳转到主要内容
      </a>
      <header className="site-header">
        <div className="header-main">
          <Link to="/" className="brand">
            <span className="brand-mark">
              <ChartNoAxesCombined size={22} />
            </span>
            <span>
              {SITE_NAME}
              <small>A-SHARE STATISTICS</small>
            </span>
          </Link>
          <nav aria-label="主导航">
            {[
              ["/", "首页"],
              [`/daily/${routeDate || ""}`, "每日统计"],
              [`/industry/${routeDate || ""}`, "行业统计"],
              ["/history", "历史数据"],
              ["/about", "统计说明"],
            ].map(([path, label]) => (
              <NavLink key={label} to={path} end={path === "/"}>
                {label}
              </NavLink>
            ))}
          </nav>
          <div className="header-tools">
            <span className="header-date code">{routeDate || "暂无数据"}</span>
            <label className="theme-control" title="切换主题">
              {theme === "system" ? (
                <Monitor size={16} />
              ) : theme === "dark" ? (
                <Moon size={16} />
              ) : (
                <Sun size={16} />
              )}
              <select
                aria-label="主题切换"
                value={theme}
                onChange={(e) => setTheme(e.target.value as Theme)}
              >
                <option value="system">跟随系统</option>
                <option value="dark">深色模式</option>
                <option value="light">浅色模式</option>
              </select>
            </label>
          </div>
        </div>
      </header>
      <div className="utility-strip">
        <div className="utility-inner">
          <span className="data-status">
            <span className="status-dot" />
            数据更新至 <strong className="code">{index.latest || "—"}</strong>
            <span className="utility-divider" />
            收盘统计
          </span>
          <GlobalSearch key={routeDate} day={day} />
        </div>
      </div>
      <main id="main" className="main-content">
        <Outlet />
      </main>
      <footer>
        <div className="footer-top">
          <div>
            <Link className="footer-brand" to="/">
              <ChartNoAxesCombined size={17} />
              {SITE_NAME}
            </Link>
            <p>
              <Database size={13} />
              数据日期：{routeDate || "—"}　更新时间：
              {dateTime(day?.importedAt || index.generatedAt)}（北京时间）
            </p>
            <p>
              数据来源：iFinD 当日行情及停牌查询 ·
              交易日历：上海证券交易所公开交易日历
            </p>
          </div>
          <div className="footer-links">
            <Link to={`/exceptions/${routeDate || ""}`}>
              异常数据 <ArrowUpRight size={13} />
            </Link>
            <Link to="/about">统计口径与数据说明</Link>
            <span>独立统计展示 · 无官方合作关系</span>
          </div>
        </div>
        <p className="disclaimer">{DISCLAIMER}</p>
      </footer>
    </ThemeContext>
  );
}
