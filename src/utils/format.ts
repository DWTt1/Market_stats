export const number = (value: number | null | undefined) =>
  value == null || !Number.isFinite(value)
    ? "—"
    : value.toLocaleString("zh-CN", { maximumFractionDigits: 8 });
export const percent = (value: number | null | undefined) =>
  value == null || !Number.isFinite(value)
    ? "—"
    : `${(value * 100).toFixed(2)}%`;
export const volume = (value: number | null) =>
  value == null
    ? "—"
    : value >= 1e8
      ? `${(value / 1e8).toFixed(2)}亿`
      : value >= 1e4
        ? `${(value / 1e4).toFixed(2)}万`
        : number(value);
export const fullDate = (value: string) =>
  new Intl.DateTimeFormat("zh-CN", {
    year: "numeric",
    month: "long",
    day: "numeric",
    timeZone: "Asia/Shanghai",
  }).format(new Date(`${value}T12:00:00+08:00`));
export const dateTime = (value: string) =>
  new Date(value).toLocaleString("zh-CN", {
    hour12: false,
    timeZone: "Asia/Shanghai",
  });
