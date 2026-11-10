/** The widths the /uploads route serves. Stored images are at most the largest. */
export const IMAGE_WIDTHS = [256, 640, 1200] as const;
export const FULL_IMAGE_WIDTH = IMAGE_WIDTHS[IMAGE_WIDTHS.length - 1];

export function imageUrl(name: string): string {
  return `/uploads/${name}`;
}

/** The smallest served width that covers `requested`, so few variants need caching. */
export function servedWidth(requested: number): number {
  return IMAGE_WIDTHS.find((width) => width >= requested) ?? FULL_IMAGE_WIDTH;
}
