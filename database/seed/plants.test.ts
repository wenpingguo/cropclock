import assert from "node:assert/strict";
import { test } from "node:test";
import { seedPlants } from "./plants";
import { CARE_TEXT_ZH, PLANT_NAMES_ZH } from "./translations-zh";

test("every seeded plant and companion has a Chinese name", () => {
  for (const plant of seedPlants) {
    assert.ok(PLANT_NAMES_ZH[plant.name], `missing name for ${plant.name}`);
    for (const companion of plant.companionPlants ?? []) {
      assert.ok(PLANT_NAMES_ZH[companion], `missing companion ${companion}`);
    }
  }
});

test("every seeded care string has a Chinese translation", () => {
  for (const plant of seedPlants) {
    for (const text of [plant.soilType, plant.sunlight, plant.watering, plant.spacing]) {
      assert.ok(CARE_TEXT_ZH[text], `missing translation for "${text}"`);
    }
  }
});
