import type { StockRow } from "./stocks";
const fields = [
  "code",
  "name",
  "industry",
  "streak",
  "isST",
  "open",
  "high",
  "low",
  "close",
  "volume",
  "listedDate",
] as const;
const labels = [
  "证券代码",
  "证券简称",
  "申万一级行业",
  "连续天数",
  "ST",
  "开盘价",
  "最高价",
  "最低价",
  "收盘价",
  "成交量",
  "上市日期",
];
function cell(value: unknown) {
  let text = value == null ? "" : String(value);
  if (/^[=+\-@\t\r\n]/.test(text)) text = `'${text}`;
  return `"${text.replaceAll('"', '""')}"`;
}
export function makeCsv(rows: StockRow[], exceptions = false) {
  return (
    "\uFEFF" +
    [
      exceptions ? [...labels, "异常类型", "缺失日期"] : labels,
      ...rows.map((row) => {
        const values: unknown[] = fields.map((field) =>
          field === "isST"
            ? row.isST == null
              ? "未知"
              : row.isST
                ? "是"
                : "否"
            : row[field],
        );
        return exceptions && "type" in row
          ? [...values, row.type, row.missingDates?.join(";")]
          : values;
      }),
    ]
      .map((row) => row.map(cell).join(","))
      .join("\r\n")
  );
}
export function exportCsv(
  rows: StockRow[],
  filename: string,
  exceptions = false,
) {
  const url = URL.createObjectURL(
    new Blob([makeCsv(rows, exceptions)], { type: "text/csv;charset=utf-8;" }),
  );
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
