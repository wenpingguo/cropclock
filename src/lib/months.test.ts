import assert from "node:assert/strict";
import { test } from "node:test";
import { seedPlants } from "../../database/seed/plants";
import { harvestMonths, isAllYear, parseMonth, shiftMonth, sydneyMonth } from "./months";

test("sydneyMonth uses Sydney time, not UTC", () => {
  // 2 pm UTC on 31 Oct is already 1 am on 1 Nov in Sydney (UTC+11).
  assert.equal(sydneyMonth(new Date("2026-10-31T14:00:00Z")), 11);
  assert.equal(sydneyMonth(new Date("2026-10-31T12:00:00Z")), 10);
});

test("shiftMonth wraps around the year", () => {
  assert.equal(shiftMonth(12, 1), 1);
  assert.equal(shiftMonth(1, -1), 12);
});

test("parseMonth accepts only 1-12", () => {
  assert.equal(parseMonth("11"), 11);
  for (const bad of ["0", "13", "abc", "", undefined, ["1"]]) {
    assert.equal(parseMonth(bad), null);
  }
});

test("isAllYear needs every month, not just twelve entries", () => {
  assert.equal(isAllYear([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12]), true);
  assert.equal(isAllYear([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11]), false);
  assert.equal(isAllYear([1, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11]), false);
});

test("seeded all-year plants are lettuce, spring onion and radish", () => {
  const names = seedPlants.filter((p) => isAllYear(p.sowingMonths)).map((p) => p.name);
  assert.deepEqual(names.sort(), ["Lettuce", "Radish", "Spring Onion"]);
});

test("harvestMonths wraps into the next year", () => {
  // Sown in November, ready 10-14 weeks later: January to February.
  assert.deepEqual(harvestMonths([11], 10, 14), [1, 2]);
  // Garlic sown Mar-May, ready 26-32 weeks later.
  assert.deepEqual(harvestMonths([3, 4, 5], 26, 32), [9, 10, 11, 12]);
});

test("every month has seeded plants", () => {
  for (let month = 1; month <= 12; month++) {
    const count = seedPlants.filter((p) => p.sowingMonths.includes(month)).length;
    assert.ok(count >= 3, `month ${month} has only ${count} plants`);
  }
});
