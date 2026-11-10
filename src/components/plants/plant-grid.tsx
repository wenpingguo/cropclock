import type { LifeCycle } from "@/db/schema";
import type { Locale } from "@/i18n/config";
import type { Dictionary } from "@/i18n/dictionaries";
import { PlantCard } from "./plant-card";

type GridPlant = {
  slug: string;
  name: string;
  imageAdult: string | null;
  harvestWeeksMin: number;
  harvestWeeksMax: number;
  allYear: boolean;
  lifeCycle: LifeCycle;
};

/**
 * A grid of plant cards. Cards are badged "All year" and "Perennial"; pass
 * `hide` to leave out the badge every plant on that page would carry.
 */
export function PlantGrid({
  plants,
  locale,
  t,
  hide,
}: {
  plants: GridPlant[];
  locale: Locale;
  t: Dictionary;
  hide?: "allYear" | "perennial";
}) {
  return (
    <ul className="mt-6 grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
      {plants.map((plant) => {
        const badges: string[] = [];
        if (plant.allYear && hide !== "allYear") badges.push(t.badges.allYear);
        if (plant.lifeCycle === "perennial" && hide !== "perennial") badges.push(t.badges.perennial);
        return (
          <li key={plant.slug}>
            <PlantCard
              plant={plant}
              locale={locale}
              harvestLabel={t.harvestIn(plant.harvestWeeksMin, plant.harvestWeeksMax)}
              badges={badges}
            />
          </li>
        );
      })}
    </ul>
  );
}

export function GridSkeleton({ className = "mt-6" }: { className?: string }) {
  return (
    <div className={`${className} grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4`} aria-hidden>
      {Array.from({ length: 8 }, (_, i) => (
        <div key={i} className="aspect-[4/5] animate-pulse rounded-lg bg-line/50" />
      ))}
    </div>
  );
}
