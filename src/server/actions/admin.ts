"use server";

import { eq } from "drizzle-orm";
import { refresh, revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { db } from "@/db";
import { IMAGE_KINDS, plants, type ImageCredits } from "@/db/schema";
import { parsePlantForm } from "@/lib/plant-form";
import { endSession, passwordMatches, requireAdmin, startSession } from "@/server/session";
import { slugify } from "@/lib/slug";
import { checkImage, deleteImage, storeImage } from "@/server/storage";

export type FormState = { error?: string };

export async function login(_state: FormState, form: FormData): Promise<FormState> {
  const password = form.get("password");
  if (typeof password !== "string" || !passwordMatches(password)) {
    return { error: "That password isn't right." };
  }
  await startSession();
  redirect("/admin");
}

export async function logout() {
  await endSession();
  redirect("/admin/login");
}

function uploadedFile(form: FormData, field: string): File | null {
  const value = form.get(field);
  return value instanceof File && value.size > 0 ? value : null;
}

async function uniqueSlug(name: string): Promise<string> {
  const base = slugify(name) || "plant";
  const existing = new Set(
    (await db.select({ slug: plants.slug }).from(plants)).map((row) => row.slug),
  );
  let slug = base;
  for (let n = 2; existing.has(slug); n++) slug = `${base}-${n}`;
  return slug;
}

/** Creates a plant, or updates one when `id` is bound. */
export async function savePlant(
  id: number | null,
  _state: FormState,
  form: FormData,
): Promise<FormState> {
  await requireAdmin();

  const parsed = parsePlantForm(form);
  if (!parsed.success) return { error: parsed.error.issues[0].message };

  const existing = id
    ? (await db.select().from(plants).where(eq(plants.id, id)).limit(1))[0]
    : null;
  if (id && !existing) return { error: "This plant no longer exists." };

  const files = {
    imageAdult: uploadedFile(form, "imageAdult"),
    imageSeed: uploadedFile(form, "imageSeed"),
    imageBaby: uploadedFile(form, "imageBaby"),
  };
  if (!id && !files.imageAdult) return { error: "Add an adult or fruit image." };

  // Check every upload before storing any, so a bad file leaves nothing behind.
  const checks = await Promise.all(
    Object.entries(files).map(async ([column, file]) => ({
      column: column as keyof typeof files,
      check: file ? await checkImage(file) : null,
    })),
  );
  for (const { check } of checks) {
    if (check && !check.ok) return { error: check.error };
  }

  const images: Partial<Record<keyof typeof files, string | null>> = {};
  const stored: string[] = [];
  for (const { column, check } of checks) {
    if (!check?.ok) continue;
    try {
      images[column] = await storeImage(check.bytes);
      stored.push(images[column]!);
    } catch (error) {
      await Promise.all(stored.map(deleteImage));
      console.error("Failed to store image", error);
      return { error: "One of the images couldn't be read. Try a different file." };
    }
  }
  if (!files.imageSeed && form.get("removeImageSeed")) images.imageSeed = null;
  if (!files.imageBaby && form.get("removeImageBaby")) images.imageBaby = null;

  // Keep a credit only while its image exists.
  const { credits, ...values } = parsed.data;
  const columns = { adult: "imageAdult", seed: "imageSeed", baby: "imageBaby" } as const;
  const imageCredits: ImageCredits = {};
  for (const kind of IMAGE_KINDS) {
    const column = columns[kind];
    const hasImage = column in images ? images[column] : existing?.[column];
    if (hasImage && credits[kind]) imageCredits[kind] = credits[kind];
  }

  try {
    if (id) {
      await db
        .update(plants)
        .set({ ...values, ...images, imageCredits })
        .where(eq(plants.id, id));
    } else {
      const slug = await uniqueSlug(values.name);
      await db.insert(plants).values({ ...values, ...images, imageCredits, slug });
    }
  } catch (error) {
    await Promise.all(stored.map(deleteImage));
    console.error("Failed to save plant", error);
    return { error: "The plant couldn't be saved. Please try again." };
  }

  if (existing) {
    for (const column of Object.keys(images) as (keyof typeof files)[]) {
      await deleteImage(existing[column]);
    }
  }

  revalidatePath("/[lang]", "layout");
  redirect("/admin");
}

export async function deletePlant(id: number) {
  await requireAdmin();
  const [deleted] = await db.delete(plants).where(eq(plants.id, id)).returning();
  if (deleted) {
    await Promise.all(
      [deleted.imageAdult, deleted.imageSeed, deleted.imageBaby].map(deleteImage),
    );
  }
  revalidatePath("/[lang]", "layout");
  refresh();
}
