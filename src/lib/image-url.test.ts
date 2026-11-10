import assert from "node:assert/strict";
import { test } from "node:test";
import { FULL_IMAGE_WIDTH, imageUrl, servedWidth } from "./image-url";
import imageLoader from "./image-loader";

test("servedWidth rounds up to the next served width", () => {
  assert.equal(servedWidth(36), 256);
  assert.equal(servedWidth(256), 256);
  assert.equal(servedWidth(257), 640);
  assert.equal(servedWidth(1080), 1200);
});

test("servedWidth caps at the full stored width", () => {
  assert.equal(servedWidth(3840), FULL_IMAGE_WIDTH);
});

test("the image loader adds a served width to uploads only", () => {
  assert.equal(imageLoader({ src: imageUrl("a.jpg"), width: 500 }), "/uploads/a.jpg?w=640");
  assert.equal(imageLoader({ src: "/icon.png", width: 500 }), "/icon.png");
});
