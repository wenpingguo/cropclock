import assert from "node:assert/strict";
import { test } from "node:test";
import { escapeLike, MAX_QUERY_LENGTH, normaliseQuery } from "./search";

test("normaliseQuery trims, collapses spaces and caps the length", () => {
  assert.equal(normaliseQuery("  spring   onion "), "spring onion");
  assert.equal(normaliseQuery(undefined), "");
  assert.equal(normaliseQuery(["tomato"]), "");
  assert.equal(normaliseQuery("x".repeat(80)).length, MAX_QUERY_LENGTH);
});

test("escapeLike makes wildcards literal", () => {
  assert.equal(escapeLike("50%_off\\"), "50\\%\\_off\\\\");
  assert.equal(escapeLike("番茄"), "番茄");
});
