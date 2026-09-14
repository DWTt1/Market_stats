import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { filterAndSort, hasWeeklyTechnicalIndicators } from "../src/utils/stocks.ts";
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

const latest = index.days.find((d) => d.date === "2026-09-14");
const weekly = Object.fromEntries(
  ["two-yin", "three-yin", "three-yang-plus"].map((signal) => [
    signal,
    JSON.parse(readFileSync(new URL(`../public/data/${latest.files[signal]}`, import.meta.url), "utf8")),
  ]),
);
const selected = (rows, query) => filterAndSort(rows, new URLSearchParams(query));
const expectedCodes = (rows, predicate) => rows.filter(predicate).map((r) => r.code).sort();
const resultCodes = (rows, query) => selected(rows, query).map((r) => r.code);

test("weekly indicators are numeric on the new date and unavailable on the old date", () => {
  assert.equal(latest.capabilities.weeklyTechnicalIndicators, true);
  assert.equal(weekly["two-yin"].length, 308);
  assert.equal(selected(weekly["two-yin"], {}).length, 308);
  assert.equal(weekly["two-yin"][0].weeklyKdjK, 38.978);
  assert.equal(weekly["two-yin"][0].weeklyKdjD, 38.302);
  assert.equal(weekly["two-yin"][0].weeklyKdjJ, 40.33);
  assert.equal(weekly["two-yin"][0].weeklyRsi14, 41.2876);
  assert.equal(hasWeeklyTechnicalIndicators(records), false);
  assert.equal(selected(records, { j: "lt20" }).length, records.length);
  assert.equal(makeCsv(records).includes("周KDJ-J"), false);
});

test("J, RSI and combined presets use strict thresholds in every signal", () => {
  const cases = [
    ["two-yin", { j: "lt20" }, (r) => r.weeklyKdjJ < 20],
    ["three-yin", { j: "gt80" }, (r) => r.weeklyKdjJ > 80],
    ["three-yang-plus", { rsi: "lt35" }, (r) => r.weeklyRsi14 < 35],
    ["two-yin", { j: "lt20", rsi: "lt35" }, (r) => r.weeklyKdjJ < 20 && r.weeklyRsi14 < 35],
    ["three-yin", { j: "gt80", rsi: "gt70" }, (r) => r.weeklyKdjJ > 80 && r.weeklyRsi14 > 70],
    ["two-yin", { j: "lt0" }, (r) => r.weeklyKdjJ < 0],
    ["three-yang-plus", { j: "gt100" }, (r) => r.weeklyKdjJ > 100],
  ];
  for (const [signal, query, predicate] of cases) {
    assert.deepEqual(resultCodes(weekly[signal], query), expectedCodes(weekly[signal], predicate));
  }
  assert.ok(selected(weekly["two-yin"], { j: "lt0" }).length > 0);
  assert.ok(selected(weekly["three-yang-plus"], { j: "gt100" }).length > 0);
});

test("weekly filters combine with industry, ST and streak; custom ranges remain numeric", () => {
  const rows = weekly["three-yang-plus"];
  const industry = rows.find((r) => r.weeklyKdjJ < 20)?.industry;
  assert.ok(industry);
  assert.deepEqual(
    resultCodes(rows, { industry, j: "lt20" }),
    expectedCodes(rows, (r) => r.industry === industry && r.weeklyKdjJ < 20),
  );
  assert.deepEqual(
    resultCodes(rows, { st: "no", streak: "4+", j: "lt20", rsi: "lt35" }),
    expectedCodes(rows, (r) => r.isST === false && r.streak >= 4 && r.weeklyKdjJ < 20 && r.weeklyRsi14 < 35),
  );
  assert.deepEqual(
    resultCodes(rows, { jMin: "10", jMax: "35", rsiMin: "30", rsiMax: "50" }),
    expectedCodes(rows, (r) => r.weeklyKdjJ >= 10 && r.weeklyKdjJ <= 35 && r.weeklyRsi14 >= 30 && r.weeklyRsi14 <= 50),
  );
});

test("unified J and RSI sorting keeps missing values last in both directions", () => {
  const rows = [{ ...weekly["two-yin"][0], code: "ZZZ", weeklyKdjJ: null, weeklyRsi14: null }, ...weekly["two-yin"].slice(0, 20)];
  for (const sort of ["weeklyKdjJ", "weeklyRsi14"]) {
    for (const order of ["asc", "desc"]) {
      const result = selected(rows, { sort, order });
      assert.equal(result.at(-1).code, "ZZZ");
      const values = result.slice(0, -1).map((r) => r[sort]);
      assert.ok(values.every((value, i) => i === 0 || (order === "asc" ? values[i - 1] <= value : values[i - 1] >= value)));
    }
  }
  assert.equal(selected(rows, { j: "lt20" }).some((r) => r.code === "ZZZ"), false);
  assert.equal(selected(rows, { rsi: "lt35" }).some((r) => r.code === "ZZZ"), false);
  assert.equal(filterAndSort([rows[0]], new URLSearchParams({ j: "lt20" }), true).length, 0);
  assert.equal(filterAndSort([rows[0]], new URLSearchParams(), true).length, 1);
});

test("CSV preserves four weekly fields and exactly the current filtered records", () => {
  const rows = selected(weekly["three-yin"], { industry: "电子", j: "gt80" });
  const csv = makeCsv(rows, false, true);
  assert.equal(csv.split("\r\n").length, rows.length + 1);
  assert.ok(csv.includes('"周KDJ-K","周KDJ-D","周KDJ-J","周RSI14"'));
  for (const row of rows) assert.ok(csv.includes(`"${row.code}"`));
  assert.ok(makeCsv([{ ...weekly["two-yin"][0], weeklyKdjJ: null, weeklyRsi14: null }], false, true).includes('"",""'));
});
