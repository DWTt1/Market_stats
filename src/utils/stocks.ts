import type { ExceptionRecord, StockRecord } from "../types/data";
export type StockRow = StockRecord | ExceptionRecord;
const validIndicator = (value: number | null | undefined): value is number =>
  typeof value === "number" && Number.isFinite(value);

export function hasWeeklyTechnicalIndicators(records: StockRow[]) {
  return records.some(
    (row) => validIndicator(row.weeklyKdjJ) || validIndicator(row.weeklyRsi14),
  );
}

function boundary(params: URLSearchParams, key: string) {
  const raw = params.get(key);
  if (raw == null || raw.trim() === "") return null;
  const value = Number(raw);
  return Number.isFinite(value) ? value : null;
}

function matchesIndicator(
  value: number | null | undefined,
  preset: string | null,
  lower: number | null,
  upper: number | null,
  kind: "j" | "rsi",
) {
  const presets = kind === "j"
    ? { lt20: ["lt", 20], gt80: ["gt", 80], lt0: ["lt", 0], gt100: ["gt", 100] } as const
    : { lt35: ["lt", 35], gt70: ["gt", 70] } as const;
  const condition = preset && Object.hasOwn(presets, preset)
    ? presets[preset as keyof typeof presets]
    : null;
  if (!condition && lower == null && upper == null) return true;
  if (!validIndicator(value)) return false;
  if (condition) return condition[0] === "lt" ? value < condition[1] : value > condition[1];
  return (lower == null || value >= lower) && (upper == null || value <= upper);
}

export function filterAndSort(
  records: StockRow[],
  params: URLSearchParams,
  technicalAvailable = hasWeeklyTechnicalIndicators(records),
): StockRow[] {
  const search = (params.get("q") || "").trim().toLowerCase(),
    industry = params.get("industry"),
    st = params.get("st"),
    streak = params.get("streak"),
    type = params.get("type");
  const jPreset = params.get("j"), rsiPreset = params.get("rsi"),
    jMin = boundary(params, "jMin"), jMax = boundary(params, "jMax"),
    rsiMin = boundary(params, "rsiMin"), rsiMax = boundary(params, "rsiMax");
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
    if (technicalAvailable && (
      !matchesIndicator(r.weeklyKdjJ, jPreset, jMin, jMax, "j") ||
      !matchesIndicator(r.weeklyRsi14, rsiPreset, rsiMin, rsiMax, "rsi")
    )) return false;
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
