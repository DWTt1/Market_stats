import type {
  DataIndex,
  DailySummary,
  DayEntry,
  Dataset,
  ExceptionRecord,
  IndustryStat,
  StockHistory,
  StockRecord,
} from "../types/data";

const cache = new Map<string, Promise<unknown>>();
async function json<T>(path: string, cacheable = true): Promise<T> {
  const existing = cacheable ? cache.get(path) : undefined;
  if (existing) return existing as Promise<T>;
  const promise = fetch(`${import.meta.env.BASE_URL}data/${path}`, {
    cache: cacheable ? "default" : "no-cache",
  })
    .then(async (response) => {
      if (!response.ok)
        throw new Error(
          `数据暂时无法读取（HTTP ${response.status}），请稍后重试。`,
        );
      const result: unknown = await response.json();
      return result as T;
    })
    .catch((error) => {
      cache.delete(path);
      throw error;
    });
  if (cacheable) {
    if (cache.size >= 24) cache.delete(cache.keys().next().value!);
    cache.set(path, promise);
  }
  return promise;
}
// Replace this interface with an API implementation to migrate without rewriting pages.
export interface DataRepository {
  index(): Promise<DataIndex>;
  summary(day: DayEntry): Promise<DailySummary>;
  records(
    day: DayEntry,
    dataset: Dataset,
  ): Promise<StockRecord[] | ExceptionRecord[] | IndustryStat[]>;
  searchDay(
    day: DayEntry,
  ): Promise<{ signal: string; record: StockRecord | ExceptionRecord }[]>;
  stockHistory(index: DataIndex, code: string): Promise<StockHistory | null>;
}
export const dataRepository: DataRepository = {
  index: async () => {
    const index = await json<DataIndex>("index.json", false);
    if (index.schemaVersion !== 1 || !Array.isArray(index.days))
      throw new Error("数据格式不受支持，请重新导入数据。");
    return index;
  },
  summary: (day) => json<DailySummary>(day.summaryPath),
  records: (day, kind) => json(day.files[kind]),
  searchDay: async (day) => {
    const datasets = [
      "two-yin",
      "three-yin",
      "three-yang-plus",
      "exceptions",
    ] as const;
    return (
      await Promise.all(
        datasets.map(async (signal) =>
          (
            await json<(StockRecord | ExceptionRecord)[]>(day.files[signal])
          ).map((record) => ({ signal, record })),
        ),
      )
    ).flat();
  },
  stockHistory: async (index, code) => {
    code = code.toUpperCase();
    let bucket = 2166136261;
    for (const char of code)
      bucket = Math.imul(bucket ^ char.charCodeAt(0), 16777619) >>> 0;
    const path =
      index.stockHistoryShards[(bucket % 256).toString(16).padStart(2, "0")];
    if (!path) return null;
    const records = await json<Record<string, StockHistory>>(
      `${path}?v=${encodeURIComponent(index.generatedAt)}`,
    );
    return records[code.toUpperCase()] || null;
  },
};
