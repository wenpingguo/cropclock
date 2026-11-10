import assert from "node:assert/strict";
import { test } from "node:test";
import { parsePlantForm } from "./plant-form";

function form(fields: Record<string, string>) {
  const data = new FormData();
  const base = {
    name: "Rhubarb",
    harvestWeeksMin: "40",
    harvestWeeksMax: "52",
    soilType: "Rich loam",
    phMin: "6",
    phMax: "7",
    sunlight: "Full sun",
    watering: "Weekly",
    spacing: "1 m",
    companionPlants: "",
    frostTolerance: "hardy",
    popularity: "0",
    lifeCycle: "perennial",
  };
  for (const [key, value] of Object.entries({ ...base, ...fields })) data.set(key, value);
  data.append("sowingMonths", "8");
  return parsePlantForm(data);
}

test("a perennial keeps its lifespan range", () => {
  const result = form({ lifespanYearsMin: "5", lifespanYearsMax: "10" });
  assert.ok(result.success);
  assert.equal(result.data.lifespanYearsMin, 5);
  assert.equal(result.data.lifespanYearsMax, 10);
});

test("one lifespan number means about that many years", () => {
  const result = form({ lifespanYearsMin: "", lifespanYearsMax: "4" });
  assert.ok(result.success);
  assert.equal(result.data.lifespanYearsMin, 4);
  assert.equal(result.data.lifespanYearsMax, 4);
});

test("lifespan is optional for perennials", () => {
  const result = form({});
  assert.ok(result.success);
  assert.equal(result.data.lifespanYearsMin, null);
  assert.equal(result.data.lifespanYearsMax, null);
});

test("annuals never keep a lifespan", () => {
  const result = form({ lifeCycle: "annual", lifespanYearsMin: "2", lifespanYearsMax: "3" });
  assert.ok(result.success);
  assert.equal(result.data.lifespanYearsMin, null);
  assert.equal(result.data.lifespanYearsMax, null);
});

test("lifespan must be a sensible whole-number range", () => {
  assert.equal(form({ lifespanYearsMin: "6", lifespanYearsMax: "3" }).success, false);
  assert.equal(form({ lifespanYearsMin: "0" }).success, false);
  assert.equal(form({ lifespanYearsMin: "2.5" }).success, false);
  assert.equal(form({ lifeCycle: "biennial" }).success, false);
});
