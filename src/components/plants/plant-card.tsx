import Link from "next/link";
import { localePath, type Locale } from "@/i18n/config";
import { PlantImage } from "./plant-image";

type CardPlant = { slug: string; name: string; imageAdult: string | null };

export function PlantCard({
  plant,
  locale,
  harvestLabel,
  badges = [],
}: {
  plant: CardPlant;
  locale: Locale;
  harvestLabel: string;
  badges?: string[];
}) {
  return (
    <Link
      href={localePath(locale, `/plants/${plant.slug}`)}
      className="group block overflow-hidden rounded-lg border border-line bg-card hover:border-leaf"
    >
      <div className="relative aspect-[4/3]">
        <PlantImage
          name={plant.name}
          file={plant.imageAdult}
          alt={plant.name}
          sizes="(min-width: 1024px) 25vw, (min-width: 768px) 33vw, 50vw"
        />
        {badges.length > 0 && (
          <ul className="absolute left-2 top-2 flex flex-wrap gap-1">
            {badges.map((badge) => (
              <li key={badge} className="rounded-full bg-card/95 px-2 py-0.5 text-xs font-medium text-leaf-dark shadow-sm">
                {badge}
              </li>
            ))}
          </ul>
        )}
      </div>
      <div className="p-3">
        <h2 className="font-display text-lg font-semibold group-hover:text-leaf">{plant.name}</h2>
        <p className="mt-0.5 text-sm text-muted">{harvestLabel}</p>
      </div>
    </Link>
  );
}
