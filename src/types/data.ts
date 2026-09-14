export type Signal = "two-yin" | "three-yin" | "three-yang-plus";
export type Dataset = Signal | "exceptions" | "industry";
export type Counts = Record<Signal | "exceptions", number | null>;
export interface StockRecord {
  code: string;
  name: string | null;
  industry: string | null;
  streak: number | null;
  isST: boolean | null;
  stLabel: string | null;
  open: number | null;
  high: number | null;
  low: number | null;
  close: number | null;
  volume: number | null;
  listedDate: string | null;
  weeklyKdjK?: number | null;
  weeklyKdjD?: number | null;
  weeklyKdjJ?: number | null;
  weeklyRsi14?: number | null;
}
export interface ExceptionRecord extends StockRecord {
  type: string;
  missingDates: string[] | null;
}
export interface IndustryStat {
  signal: Signal;
  rank: number | null;
  industry: string | null;
  count: number;
}
export interface Metrics {
  listed: number | null;
  active: number | null;
  coverage: number | null;
  onePrice: number | null;
  suspended: number | null;
  noQuote: number | null;
  historyMissing: number | null;
  exceptions: number | null;
  poolRefreshDate: string | null;
}
export interface Validation {
  name: string;
  status: "pass" | "warning" | "unavailable";
  message: string;
  expected: unknown;
  actual: unknown;
}
export interface DailySummary {
  schemaVersion: number;
  date: string;
  capabilities?: { weeklyTechnicalIndicators: boolean };
  importedAt: string;
  counts: Counts;
  metrics: Metrics;
  tradingStatus: string;
  sheetStatus: Record<string, string>;
  reportedCounts: Partial<Counts>;
  source: {
    file: string;
    sha256: string;
    modifiedAt: string;
    candidates: string[];
    dateOrigin: string;
  };
  sources: { market: string; calendar: string };
  validations: Validation[];
  definitions: { label: string; text: string }[];
  sourceChecks: {
    name: string;
    result: string | null;
    expected: string | null;
    conclusion: string | null;
  }[];
  rawMetrics: Record<string, string | number | boolean | null>;
  highlights: {
    longestYangDays: number | null;
    longestYangStocks: StockRecord[];
    stSignalCount: number;
    unknownSTCount: number;
  };
  exceptionTypes: Record<string, number>;
}
export interface DayEntry {
  date: string;
  capabilities?: { weeklyTechnicalIndicators: boolean };
  revision: string;
  importedAt: string;
  sourceFile: string;
  counts: Counts;
  metrics: Metrics;
  tradingStatus: string;
  warningCount: number;
  summaryPath: string;
  files: Record<Dataset, string>;
}
export interface DataIndex {
  schemaVersion: number;
  latest: string | null;
  generatedAt: string;
  dates: string[];
  days: DayEntry[];
  stockHistoryShards: Record<string, string>;
}
export interface StockHistory {
  code: string;
  name: string | null;
  records: {
    date: string;
    signal: Signal | "exceptions";
    streak: number | null;
    type: string | null;
  }[];
}
