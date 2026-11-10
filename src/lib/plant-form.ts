import { z } from "zod";

const text = (label: string) =>
  z.string().trim().min(1, `${label} is required.`).max(500, `${label} is too long.`);

const optionalText = z
  .string()
  .trim()
  .max(500, "A translation is too long.")
  .optional()
  .transform((value) => value || null);

const commaList = (value: string) =>
  value
    .split(/[,，、]/)
    .map((name) => name.trim())
    .filter(Boolean);

const credit = (label: string) =>
  z
    .object({
      author: z.string().trim().max(200),
      license: z.string().trim().max(100),
      sourceUrl: z.string().trim().max(1000),
    })
    .superRefine((value, ctx) => {
      const filled = [value.author, value.license, value.sourceUrl].filter(Boolean).length;
      if (filled > 0 && filled < 3) {
        ctx.addIssue({ code: "custom", message: `Fill in all three ${label} credit fields, or leave them all blank.` });
      }
      if (value.sourceUrl && !/^https?:\/\/\S+$/.test(value.sourceUrl)) {
        ctx.addIssue({ code: "custom", message: `The ${label} credit source must be a web address.` });
      }
    })
    .transform((value) => (value.author ? value : undefined));

const INT32_MAX = 2_147_483_647;

const optionalYears = z
  .string()
  .trim()
  .optional()
  .transform((value) => (value ? Number(value) : null))
  .pipe(
    z
      .number("Lifespan must be a whole number of years.")
      .int("Lifespan must be a whole number of years.")
      .min(1, "Lifespan must be at least 1 year.")
      .max(100, "Lifespan can't be more than 100 years.")
      .nullable(),
  );

export const plantFormSchema = z
  .object({
    name: text("Name"),
    sowingMonths: z
      .array(z.coerce.number().int().min(1).max(12))
      .min(1, "Choose at least one sowing month."),
    harvestWeeksMin: z.coerce.number().int().min(1, "Harvest weeks must be at least 1.").max(520),
    harvestWeeksMax: z.coerce.number().int().min(1, "Harvest weeks must be at least 1.").max(520),
    soilType: text("Soil type"),
    phMin: z.coerce.number().min(0).max(14),
    phMax: z.coerce.number().min(0).max(14),
    sunlight: text("Sunlight"),
    watering: text("Watering"),
    spacing: text("Spacing"),
    companionPlants: z.string().max(500),
    frostTolerance: z.enum(["none", "light", "hardy"]),
    lifeCycle: z.enum(["annual", "perennial"]),
    lifespanYearsMin: optionalYears,
    lifespanYearsMax: optionalYears,
    nameZh: optionalText,
    soilTypeZh: optionalText,
    sunlightZh: optionalText,
    wateringZh: optionalText,
    spacingZh: optionalText,
    companionPlantsZh: z.string().max(500).optional(),
    credits: z.object({
      adult: credit("adult image"),
      seed: credit("seed image"),
      baby: credit("baby plant image"),
    }),
    popularity: z.coerce
      .number("Popularity must be a whole number.")
      .int("Popularity must be a whole number.")
      .min(-INT32_MAX - 1, "Popularity is too small.")
      .max(INT32_MAX, "Popularity is too large."),
  })
  .refine((v) => v.harvestWeeksMin <= v.harvestWeeksMax, {
    message: "Harvest minimum can't be more than the maximum.",
  })
  .refine((v) => v.phMin <= v.phMax, {
    message: "pH minimum can't be more than the maximum.",
  })
  .refine(
    (v) => v.lifespanYearsMin === null || v.lifespanYearsMax === null || v.lifespanYearsMin <= v.lifespanYearsMax,
    { message: "Lifespan minimum can't be more than the maximum." },
  )
  .transform(({ companionPlants, companionPlantsZh, lifespanYearsMin, lifespanYearsMax, ...values }) => {
    const zhList = commaList(companionPlantsZh ?? "");
    // Only perennials have a lifespan. One number on its own means "about N years".
    const perennial = values.lifeCycle === "perennial";
    return {
      ...values,
      lifespanYearsMin: perennial ? (lifespanYearsMin ?? lifespanYearsMax) : null,
      lifespanYearsMax: perennial ? (lifespanYearsMax ?? lifespanYearsMin) : null,
      sowingMonths: [...new Set(values.sowingMonths)].sort((a, b) => a - b),
      companionPlants: commaList(companionPlants),
      companionPlantsZh: zhList.length ? zhList : null,
    };
  });

const field = (form: FormData, name: string) => {
  const value = form.get(name);
  return typeof value === "string" ? value : "";
};

export function parsePlantForm(form: FormData) {
  const credit = (kind: string) => ({
    author: field(form, `${kind}CreditAuthor`),
    license: field(form, `${kind}CreditLicense`),
    sourceUrl: field(form, `${kind}CreditUrl`),
  });
  return plantFormSchema.safeParse({
    ...Object.fromEntries(form),
    sowingMonths: form.getAll("sowingMonths"),
    credits: { adult: credit("adult"), seed: credit("seed"), baby: credit("baby") },
  });
}
