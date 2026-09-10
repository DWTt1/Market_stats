import type { ExceptionRecord, StockRecord } from "../types/data";
export type StockRow = StockRecord | ExceptionRecord;
export function filterAndSort(
  records: StockRow[],
  params: URLSearchParams,
): StockRow[] {
  const search = (params.get("q") || "").trim().toLowerCase(),
    industry = params.get("industry"),
    st = params.get("st"),
    streak = params.get("streak"),
    type = params.get("type");
  const sort = params.get("sort") || "code",
    direction = params.get("order") === "desc" ? -1 : 1;
  const filtered = records.filter((r) => {
    if (
      search &&
      !r.code.toLowerCase().includes(search) &&
      !r.name?.toLowerCase().includes(search)
    )
      return false;
    if (industry && (r.industry || "__unknown") !== industry) return false;
    if (st && (r.isST == null ? "unknown" : r.isST ? "yes" : "no") !== st)
      return false;
    if (
      streak &&
      (r.streak == null ||
        (streak.endsWith("+")
          ? r.streak < Number(streak.slice(0, -1))
          : r.streak !== Number(streak)))
    )
      return false;
    if (type && (!("type" in r) || r.type !== type)) return false;
    return true;
  });
  return filtered.sort((a, b) => {
    const av = a[sort as keyof StockRecord],
      bv = b[sort as keyof StockRecord];
    const extraA =
      sort === "type" && "type" in a
        ? a.type
        : sort === "missingDates" && "missingDates" in a
          ? a.missingDates?.join(",")
          : av;
    const extraB =
      sort === "type" && "type" in b
        ? b.type
        : sort === "missingDates" && "missingDates" in b
          ? b.missingDates?.join(",")
          : bv;
    if (extraA == null)
      return extraB == null ? a.code.localeCompare(b.code) : 1;
    if (extraB == null) return -1;
    const cmp =
      typeof extraA === "number" && typeof extraB === "number"
        ? extraA - extraB
        : String(extraA).localeCompare(String(extraB), "zh-CN", {
            numeric: true,
          });
    return cmp * direction || a.code.localeCompare(b.code);
  });
}
