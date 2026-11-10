"use client";

import { servedWidth } from "./image-url";

/**
 * next/image loader: uploaded images are resized by the /uploads route itself,
 * so the paid-for Image Optimization service isn't needed.
 */
export default function imageLoader({ src, width }: { src: string; width: number }): string {
  if (!src.startsWith("/uploads/")) return src;
  return `${src}?w=${servedWidth(width)}`;
}
