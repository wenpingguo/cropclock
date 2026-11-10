// Builds the site icons from one drawing: a seedling growing from clay-coloured
// soil, its two leaves set like clock hands at ten past ten.
//
//   src/app/icon.svg        browser tabs, crisp at any size
//   src/app/favicon.ico     16, 32 and 48px copies for browsers without SVG icons
//   src/app/apple-icon.png  180px home-screen icon, square (iOS rounds the corners)
//                           with clock ticks at 12, 3 and 9
//
// Run after changing the drawing: node scripts/build-icons.mjs
import { writeFile } from "node:fs/promises";
import sharp from "sharp";

const LEAF = "#2f6b3f"; // --color-leaf
const CLAY = "#b4552d"; // --color-clay
const CREAM = "#fffdf8"; // --color-card

const f = (n) => n.toFixed(2);

/** A pointed oval leaf from its base, `angle` degrees clockwise from straight up. */
function leafPath(baseX, baseY, angle, length, width) {
  const a = (angle * Math.PI) / 180;
  const [dx, dy] = [Math.sin(a), -Math.cos(a)];
  const [px, py] = [Math.cos(a), Math.sin(a)];
  const [tipX, tipY] = [baseX + length * dx, baseY + length * dy];
  const [midX, midY] = [baseX + (length / 2) * dx, baseY + (length / 2) * dy];
  return (
    `M${f(baseX)} ${f(baseY)}` +
    ` Q${f(midX + width * px)} ${f(midY + width * py)} ${f(tipX)} ${f(tipY)}` +
    ` Q${f(midX - width * px)} ${f(midY - width * py)} ${f(baseX)} ${f(baseY)}Z`
  );
}

/** The icon on a 64-unit grid, as a disc (tabs) or a full square (home screen). */
function drawing({ shape, ticks }) {
  const clip = shape === "circle" ? `<circle cx="32" cy="32" r="32"/>` : `<rect width="64" height="64"/>`;
  const tick = (deg) => {
    const a = (deg * Math.PI) / 180;
    const at = (r) => `${f(32 + r * Math.sin(a))} ${f(32 - r * Math.cos(a))}`;
    return `<path d="M${at(26.5)} L${at(29.5)}" stroke="${CREAM}" stroke-width="2.2" stroke-linecap="round" opacity="0.85"/>`;
  };
  return [
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64">`,
    `<defs><clipPath id="c">${clip}</clipPath></defs>`,
    `<g clip-path="url(#c)">`,
    `<rect width="64" height="64" fill="${LEAF}"/>`,
    `<path d="M0 51 Q32 44 64 51 V64 H0Z" fill="${CLAY}"/>`,
    `</g>`,
    ticks ? [0, 90, 270].map(tick).join("") : "",
    `<path d="M32 48.5 V30" stroke="${CREAM}" stroke-width="5.5" stroke-linecap="round"/>`,
    `<path d="${leafPath(32, 30.5, -50, 19, 14)}" fill="${CREAM}"/>`,
    `<path d="${leafPath(32, 30.5, 52, 23, 15)}" fill="${CREAM}"/>`,
    `</svg>`,
    "",
  ].join("\n");
}

/** Renders at 4x and scales down, which gives smoother edges at tab sizes. */
function png(svg, size) {
  return sharp(Buffer.from(svg), { density: 72 * ((size * 4) / 64) })
    .resize(size, size)
    .png()
    .toBuffer();
}

/** An .ico file holding PNG images, which every current browser reads. */
function ico(images) {
  const header = Buffer.alloc(6 + 16 * images.length);
  header.writeUInt16LE(1, 2); // type: icon
  header.writeUInt16LE(images.length, 4);
  let offset = header.length;
  images.forEach(({ size, data }, i) => {
    const entry = 6 + 16 * i;
    header.writeUInt8(size, entry); // width (all sizes here are under 256)
    header.writeUInt8(size, entry + 1); // height
    header.writeUInt16LE(1, entry + 4); // colour planes
    header.writeUInt16LE(32, entry + 6); // bits per pixel
    header.writeUInt32LE(data.length, entry + 8);
    header.writeUInt32LE(offset, entry + 12);
    offset += data.length;
  });
  return Buffer.concat([header, ...images.map((image) => image.data)]);
}

const tab = drawing({ shape: "circle", ticks: false });
const home = drawing({ shape: "square", ticks: true });

await writeFile("src/app/icon.svg", tab);
const sizes = [16, 32, 48];
const images = await Promise.all(sizes.map(async (size) => ({ size, data: await png(tab, size) })));
await writeFile("src/app/favicon.ico", ico(images));
await sharp(await png(home, 180)).flatten({ background: LEAF }).png().toFile("src/app/apple-icon.png");
console.log("Wrote src/app/icon.svg, src/app/favicon.ico and src/app/apple-icon.png");
