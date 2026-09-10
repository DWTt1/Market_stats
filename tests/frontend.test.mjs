import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { filterAndSort } from "../src/utils/stocks.ts";
import { makeCsv } from "../src/utils/csv.ts";
import { volume, percent, number } from "../src/utils/format.ts";
const index = JSON.parse(
  readFileSync(new URL("../public/data/index.json", import.meta.url), "utf8"),
);
const day = index.days.find((d) => d.date === "2026-09-10");
const records = JSON.parse(
  readFileSync(
    new URL(`../public/data/${day.files["three-yang-plus"]}`, import.meta.url),
    "utf8",
  ),
);
test("real code and name search retain actual streak and leading zero", () => {
  const byCode = filterAndSort(records, new URLSearchParams({ q: "002343" }));
  const byName = filterAndSort(records, new URLSearchParams({ q: "慈文传媒" }));
  assert.equal(byCode.length, 1);
  assert.deepEqual(byCode, byName);
  assert.equal(byCode[0].code, "002343.SZ");
  assert.equal(byCode[0].streak, 5);
});
test("combined industry/ST/streak filtering and numeric descending sort", () => {
  const result = filterAndSort(
    records,
    new URLSearchParams({
      industry: "传媒",
      st: "no",
      streak: "4+",
      sort: "streak",
      order: "desc",
    }),
  );
  assert.ok(result.length > 1);
  assert.ok(
    result.every(
      (r) => r.industry === "传媒" && r.isST === false && r.streak >= 4,
    ),
  );
  assert.ok(
    result.every((r, i) => i === 0 || result[i - 1].streak >= r.streak),
  );
  const highest = filterAndSort(
    records,
    new URLSearchParams({ sort: "streak", order: "desc" }),
  )[0];
  assert.equal(highest.code, "002608.SZ");
  assert.equal(highest.streak, 14);
});
test("unknown/null fields and zero volume format consistently", () => {
  assert.equal(number(null), "—");
  assert.equal(volume(153500), "15.35万");
  assert.equal(volume(114708722), "1.15亿");
  assert.equal(percent(0.9973), "99.73%");
  assert.equal(volume(0), "0");
  const rows = [
    { ...records[0], volume: null, isST: null },
    { ...records[1], volume: 0, isST: false },
  ];
  assert.equal(
    filterAndSort(rows, new URLSearchParams({ st: "unknown" })).length,
    1,
  );
  assert.equal(
    filterAndSort(
      rows,
      new URLSearchParams({ sort: "volume", order: "desc" }),
    )[1].volume,
    null,
  );
});
test("CSV exports all filtered rows, BOM, exact volume, safe cells and escaped quotes", () => {
  const rows = filterAndSort(records, new URLSearchParams({ streak: "4+" }));
  const csv = makeCsv(rows);
  assert.ok(csv.startsWith("\uFEFF"));
  assert.equal(csv.split("\r\n").length, rows.length + 1);
  assert.ok(csv.includes('"002343.SZ"'));
  assert.ok(csv.includes('"63936184"'));
  const escaped = makeCsv([{ ...records[0], name: "=1+1", industry: 'a,"b' }]);
  assert.ok(escaped.includes('"\'=1+1"'));
  assert.ok(escaped.includes('"a,""b"'));
});
