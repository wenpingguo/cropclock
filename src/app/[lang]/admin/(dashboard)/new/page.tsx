import type { Metadata } from "next";
import { Suspense } from "react";
import { PlantForm } from "@/components/admin/plant-form";
import { requireAdmin } from "@/server/session";

export const metadata: Metadata = { title: "Add plant" };

export default function NewPlantPage() {
  return (
    <>
      <h1 className="mt-6 font-display text-3xl font-semibold">Add plant</h1>
      <Suspense fallback={<p className="mt-6 text-muted">Loading…</p>}>
        <GuardedForm />
      </Suspense>
    </>
  );
}

async function GuardedForm() {
  await requireAdmin();
  return <PlantForm />;
}
