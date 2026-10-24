// Self-check for the semi-monthly (15th & 30th) schedule.
// Run: PAYDAY_CONFIG_PATH=<tmp file> node --experimental-strip-types scripts/payday-semi-monthly.test.mts
import assert from "node:assert/strict";
import fs from "node:fs";

const cfg = process.env.PAYDAY_CONFIG_PATH!;
const { getCurrentPaydayCycle, getNextPayday, getPastPaydayCycles, getAdjacentCycles, formatDateString: f } =
  await import("../src/lib/payday.ts");
const d = (s: string) => { const [y, m, day] = s.split("-").map(Number); return new Date(y, m - 1, day); };
const cycle = (s: string) => { const c = getCurrentPaydayCycle(d(s)); return `${f(c.startDate)}..${f(c.endDate)}`; };

// No weekend rollback: plain 15th / 30th, last day of February.
fs.writeFileSync(cfg, JSON.stringify({ frequency: "semi_monthly", ruleType: "fixed_date", rollbackWeekend: false }));
assert.equal(cycle("2026-10-24"), "2026-10-15..2026-10-29");
assert.equal(cycle("2026-10-30"), "2026-10-30..2026-11-14");
assert.equal(cycle("2026-10-31"), "2026-10-30..2026-11-14");
assert.equal(cycle("2026-10-14"), "2026-09-30..2026-10-14");
assert.equal(cycle("2027-02-20"), "2027-02-15..2027-02-27"); // Feb 2027 has 28 days
assert.equal(cycle("2027-01-05"), "2026-12-30..2027-01-14"); // year boundary
assert.equal(f(getNextPayday(d("2026-10-24"))), "2026-10-30");
assert.equal(f(getNextPayday(d("2026-10-15"))), "2026-10-15"); // payday itself

// Weekend rollback: 2026-11-15 is a Sunday -> Friday 11-13; 2026-08-30 is a Sunday -> Friday 08-28.
fs.writeFileSync(cfg, JSON.stringify({ frequency: "semi_monthly", ruleType: "fixed_date", rollbackWeekend: true }));
assert.equal(cycle("2026-11-13"), "2026-11-13..2026-11-29");
assert.equal(cycle("2026-11-12"), "2026-10-30..2026-11-12");
assert.equal(cycle("2026-08-29"), "2026-08-28..2026-09-14");

// History and navigation step payday to payday with no gaps.
const past = getPastPaydayCycles(4, d("2026-10-24"));
assert.deepEqual(past.map((c) => c.id), ["2026-08-28", "2026-09-15", "2026-09-30", "2026-10-15"]); // Aug 30 is a Sunday
for (let i = 1; i < past.length; i++) {
  const prevEnd = past[i - 1].endDate;
  assert.equal(f(new Date(prevEnd.getFullYear(), prevEnd.getMonth(), prevEnd.getDate() + 1)), f(past[i].startDate));
}
const adj = getAdjacentCycles("2026-10-15");
assert.equal(adj.prev?.id, "2026-09-30");
console.log("ok", past.map((c) => c.label).join(" | "));
