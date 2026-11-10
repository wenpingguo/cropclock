import type { NextRequest } from "next/server";
import { IMAGE_WIDTHS } from "@/lib/image-url";
import { readImage } from "@/server/storage";

const WIDTHS: readonly number[] = IMAGE_WIDTHS;

export async function GET(
  request: NextRequest,
  { params }: RouteContext<"/uploads/[name]">,
) {
  const { name } = await params;
  const requested = Number(request.nextUrl.searchParams.get("w"));
  const image = await readImage(name, WIDTHS.includes(requested) ? requested : undefined);
  if (!image) return new Response("Not found", { status: 404 });

  return new Response(new Uint8Array(image.bytes), {
    headers: {
      "Content-Type": image.contentType,
      // Names are never reused, so browsers and the CDN (s-maxage) can keep each copy forever.
      "Cache-Control": "public, max-age=31536000, s-maxage=31536000, immutable",
      "X-Content-Type-Options": "nosniff",
    },
  });
}
