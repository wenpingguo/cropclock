import { desc } from "drizzle-orm";
import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { DeletePlantButton } from "@/components/admin/delete-plant-button";
import { db } from "@/db";
import { plants } from "@/db/schema";
import { requireAdmin } from "@/server/session";

export const metadata: Metadata = { title: "Admin" };

export default function AdminPage() {
  return (
    <>
      <div className="mt-6 flex items-center justify-between gap-4">
        <h1 className="font-display text-3xl font-semibold">Plants</h1>
        <Link
          href="/admin/new"
          className="rounded-md bg-leaf px-4 py-2 text-sm font-medium text-white hover:bg-leaf-dark"
        >
          Add plant
        </Link>
      </div>
      <Suspense fallback={<p className="mt-6 text-muted">Loading plants…</p>}>
        <PlantTable />
      </Suspense>
    </>
  );
}

async function PlantTable() {
  await requireAdmin();
  const rows = await db
    .select({
      id: plants.id,
      name: plants.name,
      slug: plants.slug,
      popularity: plants.popularity,
      lifeCycle: plants.lifeCycle,
      imageAdult: plants.imageAdult,
    })
    .from(plants)
    .orderBy(desc(plants.popularity), plants.name);

  if (rows.length === 0) return <p className="mt-6 text-muted">No plants yet.</p>;

  return (
    <div className="mt-6 overflow-x-auto rounded-lg border border-line bg-card">
      <table className="w-full text-left text-sm">
        <thead className="border-b border-line text-muted">
          <tr>
            <th scope="col" className="px-4 py-3 font-medium">Name</th>
            <th scope="col" className="px-4 py-3 text-right font-medium">Popularity</th>
            <th scope="col" className="px-4 py-3 font-medium">Life cycle</th>
            <th scope="col" className="px-4 py-3 font-medium">Image</th>
            <th scope="col" className="px-4 py-3 text-right font-medium">Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-line">
          {rows.map((plant) => (
            <tr key={plant.id}>
              <td className="px-4 py-3 font-medium">
                <Link href={`/plants/${plant.slug}`} className="hover:underline">
                  {plant.name}
                </Link>
              </td>
              <td className="px-4 py-3 text-right tabular-nums">{plant.popularity}</td>
              <td className="px-4 py-3 text-muted">{plant.lifeCycle === "perennial" ? "Perennial" : "Annual"}</td>
              <td className="px-4 py-3 text-muted">{plant.imageAdult ? "Added" : "Missing"}</td>
              <td className="whitespace-nowrap px-4 py-3 text-right">
                <Link href={`/admin/${plant.id}/edit`} className="mr-4 font-medium text-leaf hover:underline">
                  Edit<span className="sr-only"> {plant.name}</span>
                </Link>
                <DeletePlantButton id={plant.id} name={plant.name} />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
