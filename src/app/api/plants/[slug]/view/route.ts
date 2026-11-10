import { recordPlantView } from "@/server/plants";

export async function POST(
  _request: Request,
  { params }: RouteContext<"/api/plants/[slug]/view">,
) {
  const { slug } = await params;
  const found = await recordPlantView(slug);
  return new Response(null, { status: found ? 204 : 404 });
}
