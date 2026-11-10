import { eq } from "drizzle-orm";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { PlantForm } from "@/components/admin/plant-form";
import { db } from "@/db";
import { plants } from "@/db/schema";
import { requireAdmin } from "@/server/session";

export const metadata: Metadata = { title: "Edit plant" };

export default function EditPlantPage({ params }: PageProps<"/[lang]/admin/[id]/edit">) {
  return (
    <Suspense fallback={<p className="mt-6 text-muted">Loading…</p>}>
      <EditForm params={params} />
    </Suspense>
  );
}

async function EditForm({ params }: Pick<PageProps<"/[lang]/admin/[id]/edit">, "params">) {
  await requireAdmin();
  const { id: idParam } = await params;
  const id = /^\d{1,9}$/.test(idParam) ? Number(idParam) : null;
  if (id === null) notFound();

  const [plant] = await db.select().from(plants).where(eq(plants.id, id)).limit(1);
  if (!plant) notFound();

  return (
    <>
      <h1 className="mt-6 font-display text-3xl font-semibold">Edit {plant.name}</h1>
      <PlantForm plant={plant} />
    </>
  );
}
