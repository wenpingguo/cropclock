"use client";

import Image from "next/image";
import Link from "next/link";
import { startTransition, useActionState, useState, type FormEvent, type ReactNode } from "react";
import { savePlant } from "@/server/actions/admin";
import type { ImageCredit, ImageKind, LifeCycle, Plant } from "@/db/schema";
import { imageUrl } from "@/lib/image-url";
import { shrinkImage } from "@/lib/shrink-image";
import { MONTHS, monthName } from "@/lib/months";

const input = "mt-1 w-full rounded-md border border-line bg-card px-3 py-2";

function Field({ label, htmlFor, children }: { label: string; htmlFor: string; children: ReactNode }) {
  return (
    <div>
      <label htmlFor={htmlFor} className="block text-sm font-medium">
        {label}
      </label>
      {children}
    </div>
  );
}

function TextField({ name, label, value }: { name: string; label: string; value?: string }) {
  return (
    <Field label={label} htmlFor={name}>
      <input id={name} name={name} defaultValue={value} required maxLength={500} className={input} />
    </Field>
  );
}

function OptionalField({ name, label, value, lang }: { name: string; label: string; value?: string | null; lang?: string }) {
  return (
    <Field label={label} htmlFor={name}>
      <input id={name} name={name} lang={lang} defaultValue={value ?? ""} maxLength={500} className={input} />
    </Field>
  );
}

function ImageField({
  name,
  kind,
  label,
  current,
  credit,
  required,
  removable,
}: {
  name: string;
  kind: ImageKind;
  label: string;
  current?: string | null;
  credit?: ImageCredit;
  required?: boolean;
  removable?: boolean;
}) {
  const small = "mt-1 w-full rounded-md border border-line bg-paper px-2 py-1 text-sm";
  return (
    <div className="rounded-md border border-line bg-card p-3">
      <label htmlFor={name} className="block text-sm font-medium">
        {label}
      </label>
      {current && (
        <div className="relative mt-2 h-24 w-24 overflow-hidden rounded-md">
          <Image src={imageUrl(current)} alt={`Current ${label}`} fill sizes="96px" className="object-cover" />
        </div>
      )}
      <input
        id={name}
        name={name}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        required={required}
        className="mt-2 w-full text-sm"
      />
      {current && removable && (
        <label className="mt-2 flex items-center gap-2 text-sm text-muted">
          <input type="checkbox" name={`remove${name[0].toUpperCase()}${name.slice(1)}`} />
          Remove this image
        </label>
      )}
      <details className="mt-3 text-sm" open={Boolean(credit)}>
        <summary className="cursor-pointer text-muted">Credit (for images you didn&apos;t take)</summary>
        <label className="mt-2 block">
          Author
          <input name={`${kind}CreditAuthor`} defaultValue={credit?.author} maxLength={200} className={small} />
        </label>
        <label className="mt-2 block">
          Licence
          <input name={`${kind}CreditLicense`} defaultValue={credit?.license} maxLength={100} placeholder="CC BY-SA 4.0" className={small} />
        </label>
        <label className="mt-2 block">
          Source URL
          <input name={`${kind}CreditUrl`} type="url" defaultValue={credit?.sourceUrl} maxLength={1000} className={small} />
        </label>
      </details>
    </div>
  );
}

export function PlantForm({ plant }: { plant?: Plant }) {
  const [state, action, pending] = useActionState(savePlant.bind(null, plant?.id ?? null), {});
  const [lifeCycle, setLifeCycle] = useState<LifeCycle>(plant?.lifeCycle ?? "annual");

  // Submitting by hand stops React resetting the form, so an error keeps what was typed.
  // It also lets large photos be shrunk before they are sent.
  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    for (const field of ["imageAdult", "imageSeed", "imageBaby"]) {
      const file = data.get(field);
      if (file instanceof File && file.size > 0) data.set(field, await shrinkImage(file));
    }
    startTransition(() => action(data));
  }

  return (
    <form onSubmit={handleSubmit} className="mt-6 max-w-3xl space-y-8">
      <section className="space-y-4">
        <TextField name="name" label="Plant name" value={plant?.name} />
        <Field label="Popularity" htmlFor="popularity">
          <input
            id="popularity"
            name="popularity"
            type="number"
            step={1}
            required
            defaultValue={plant?.popularity ?? 0}
            aria-describedby="popularity-help"
            className={input}
          />
          <p id="popularity-help" className="mt-1 text-sm text-muted">
            Hidden from visitors. Sets the home page order and goes up by 1 with each view.
          </p>
        </Field>
      </section>

      <section>
        <h2 className="font-display text-xl font-semibold">Images</h2>
        <p className="mt-1 text-sm text-muted">JPEG, PNG or WebP. Large photos are shrunk automatically before upload.</p>
        <div className="mt-3 grid gap-3 sm:grid-cols-3">
          <ImageField name="imageAdult" kind="adult" label="Adult / fruit" current={plant?.imageAdult} credit={plant?.imageCredits.adult} required={!plant} />
          <ImageField name="imageSeed" kind="seed" label="Seed" current={plant?.imageSeed} credit={plant?.imageCredits.seed} removable />
          <ImageField name="imageBaby" kind="baby" label="Baby plant" current={plant?.imageBaby} credit={plant?.imageCredits.baby} removable />
        </div>
      </section>

      <section>
        <h2 className="font-display text-xl font-semibold">Timeline</h2>
        <fieldset className="mt-3">
          <legend className="text-sm font-medium">Sowing months in Sydney</legend>
          <div className="mt-2 grid grid-cols-2 gap-2 sm:grid-cols-4">
            {MONTHS.map((_, index) => (
              <label key={index} className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  name="sowingMonths"
                  value={index + 1}
                  defaultChecked={plant?.sowingMonths.includes(index + 1)}
                />
                {monthName(index + 1)}
              </label>
            ))}
          </div>
        </fieldset>
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <Field label="Harvest from (weeks after sowing)" htmlFor="harvestWeeksMin">
            <input id="harvestWeeksMin" name="harvestWeeksMin" type="number" min={1} max={520} required defaultValue={plant?.harvestWeeksMin} className={input} />
          </Field>
          <Field label="Harvest to (weeks after sowing)" htmlFor="harvestWeeksMax">
            <input id="harvestWeeksMax" name="harvestWeeksMax" type="number" min={1} max={520} required defaultValue={plant?.harvestWeeksMax} className={input} />
          </Field>
        </div>
      </section>

      <section className="space-y-4">
        <h2 className="font-display text-xl font-semibold">Care instructions</h2>
        <TextField name="soilType" label="Soil type" value={plant?.soilType} />
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="pH minimum" htmlFor="phMin">
            <input id="phMin" name="phMin" type="number" min={0} max={14} step={0.1} required defaultValue={plant?.phMin} className={input} />
          </Field>
          <Field label="pH maximum" htmlFor="phMax">
            <input id="phMax" name="phMax" type="number" min={0} max={14} step={0.1} required defaultValue={plant?.phMax} className={input} />
          </Field>
        </div>
        <TextField name="sunlight" label="Sunlight" value={plant?.sunlight} />
        <TextField name="watering" label="Watering frequency" value={plant?.watering} />
        <TextField name="spacing" label="Spacing" value={plant?.spacing} />
        <Field label="Companion plants (comma separated)" htmlFor="companionPlants">
          <input id="companionPlants" name="companionPlants" defaultValue={plant?.companionPlants.join(", ")} maxLength={500} className={input} />
        </Field>
        <Field label="Frost tolerance" htmlFor="frostTolerance">
          <select id="frostTolerance" name="frostTolerance" defaultValue={plant?.frostTolerance ?? "none"} className={input}>
            <option value="none">None</option>
            <option value="light">Light frost</option>
            <option value="hardy">Hardy</option>
          </select>
        </Field>
        <Field label="Life cycle" htmlFor="lifeCycle">
          <select
            id="lifeCycle"
            name="lifeCycle"
            value={lifeCycle}
            onChange={(event) => setLifeCycle(event.target.value as LifeCycle)}
            aria-describedby="lifeCycle-help"
            className={input}
          >
            <option value="annual">Annual: replanted each season</option>
            <option value="perennial">Perennial: keeps growing for more than one year</option>
          </select>
          <p id="lifeCycle-help" className="mt-1 text-sm text-muted">
            Perennials are listed under the Perennials tab. Plants sown in all 12 months appear under All year round automatically.
          </p>
        </Field>
        {lifeCycle === "perennial" && (
          <fieldset>
            <legend className="text-sm font-medium">Productive lifespan in years (optional)</legend>
            <div className="mt-1 grid gap-4 sm:grid-cols-2">
              <Field label="From" htmlFor="lifespanYearsMin">
                <input id="lifespanYearsMin" name="lifespanYearsMin" type="number" min={1} max={100} step={1} defaultValue={plant?.lifespanYearsMin ?? ""} className={input} />
              </Field>
              <Field label="To" htmlFor="lifespanYearsMax">
                <input id="lifespanYearsMax" name="lifespanYearsMax" type="number" min={1} max={100} step={1} defaultValue={plant?.lifespanYearsMax ?? ""} className={input} />
              </Field>
            </div>
          </fieldset>
        )}
      </section>

      <section className="space-y-4">
        <div>
          <h2 className="font-display text-xl font-semibold">Chinese translation</h2>
          <p className="mt-1 text-sm text-muted">Optional. Shown on the 中文 site; blank fields fall back to English.</p>
        </div>
        <OptionalField name="nameZh" label="Plant name (中文)" value={plant?.nameZh} lang="zh-CN" />
        <OptionalField name="soilTypeZh" label="Soil type (中文)" value={plant?.soilTypeZh} lang="zh-CN" />
        <OptionalField name="sunlightZh" label="Sunlight (中文)" value={plant?.sunlightZh} lang="zh-CN" />
        <OptionalField name="wateringZh" label="Watering frequency (中文)" value={plant?.wateringZh} lang="zh-CN" />
        <OptionalField name="spacingZh" label="Spacing (中文)" value={plant?.spacingZh} lang="zh-CN" />
        <OptionalField name="companionPlantsZh" label="Companion plants (中文, comma separated)" value={plant?.companionPlantsZh?.join("、")} lang="zh-CN" />
      </section>

      {state.error && (
        <p role="alert" className="rounded-md bg-clay-soft px-3 py-2 text-sm text-clay">
          {state.error}
        </p>
      )}

      <div className="flex items-center gap-4">
        <button
          type="submit"
          disabled={pending}
          className="rounded-md bg-leaf px-5 py-2 font-medium text-white hover:bg-leaf-dark disabled:opacity-60"
        >
          {pending ? "Saving…" : plant ? "Save changes" : "Add plant"}
        </button>
        <Link href="/admin" className="font-medium text-muted hover:underline">
          Cancel
        </Link>
      </div>
    </form>
  );
}
