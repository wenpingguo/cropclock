import "server-only";
import { randomUUID } from "node:crypto";
import { eq } from "drizzle-orm";
import sharp from "sharp";
import { db } from "@/db";
import { images } from "@/db/schema";
import { FULL_IMAGE_WIDTH } from "@/lib/image-url";

export const MAX_IMAGE_BYTES = 5 * 1024 * 1024;

const STORED_NAME = /^[0-9a-f-]{36}\.(jpg|png|webp)$/;

type Extension = "jpg" | "png" | "webp";

/** Detects the type from the file's bytes, since the browser's claim can be spoofed. */
function detectExtension(bytes: Buffer): Extension | null {
  if (bytes.length < 12) return null;
  if (bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff) return "jpg";
  if (bytes.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))) {
    return "png";
  }
  if (
    bytes.subarray(0, 4).toString("latin1") === "RIFF" &&
    bytes.subarray(8, 12).toString("latin1") === "WEBP"
  ) {
    return "webp";
  }
  return null;
}

export type ImageCheck = { ok: true; bytes: Buffer } | { ok: false; error: string };

export async function checkImage(file: File): Promise<ImageCheck> {
  if (file.size > MAX_IMAGE_BYTES) {
    return { ok: false, error: `${file.name} is larger than 5 MB.` };
  }
  const bytes = Buffer.from(await file.arrayBuffer());
  if (!detectExtension(bytes)) {
    return { ok: false, error: `${file.name} must be a JPEG, PNG or WebP image.` };
  }
  return { ok: true, bytes };
}

/**
 * Saves an upload as an upright JPEG no wider or taller than the largest served
 * size, and returns its name. Re-encoding also strips metadata such as GPS tags.
 */
export async function storeImage(bytes: Buffer): Promise<string> {
  const data = await sharp(bytes)
    .rotate()
    .resize({ width: FULL_IMAGE_WIDTH, height: FULL_IMAGE_WIDTH, fit: "inside", withoutEnlargement: true })
    .flatten({ background: "#ffffff" })
    .jpeg({ quality: 82, mozjpeg: true })
    .toBuffer();
  const name = `${randomUUID()}.jpg`;
  await db.insert(images).values({ name, contentType: "image/jpeg", data });
  return name;
}

export async function deleteImage(name: string | null): Promise<void> {
  if (!name || !STORED_NAME.test(name)) return;
  await db.delete(images).where(eq(images.name, name));
}

/**
 * Reads a stored image, scaled down to `width` when it is narrower than the
 * stored copy. Only names this store generated are accepted.
 */
export async function readImage(name: string, width?: number) {
  if (!STORED_NAME.test(name)) return null;
  const [row] = await db
    .select({ data: images.data, contentType: images.contentType })
    .from(images)
    .where(eq(images.name, name))
    .limit(1);
  if (!row) return null;
  if (!width || width >= FULL_IMAGE_WIDTH) return { bytes: row.data, contentType: row.contentType };

  const bytes = await sharp(row.data)
    .resize({ width, withoutEnlargement: true })
    .jpeg({ quality: 80, mozjpeg: true })
    .toBuffer();
  return { bytes, contentType: "image/jpeg" };
}
