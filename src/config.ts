import type { Signal } from "./types/data";
export const SITE_NAME = import.meta.env.VITE_SITE_NAME || "A股涨跌统计";
export const SIGNALS: Signal[] = ["two-yin", "three-yin", "three-yang-plus"];
export const SIGNAL_LABELS: Record<Signal | "exceptions", string> = {
  "two-yin": "严格两连阴",
  "three-yin": "严格三连阴",
  "three-yang-plus": "三连阳及以上",
  exceptions: "异常股票",
};
export const SIGNAL_COLORS: Record<Signal, string> = {
  "two-yin": "#25a982",
  "three-yin": "#69b8a3",
  "three-yang-plus": "#ed666f",
};
export const DISCLAIMER =
  "本站数据仅用于市场统计、研究与信息参考，不构成任何投资建议。数据可能因行情源、统计口径、停牌、上市时间及数据更新等原因存在差异，投资者应独立判断并自行承担投资风险。";
