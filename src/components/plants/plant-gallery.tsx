"use client";

import Image from "next/image";
import { useState } from "react";
import type { ImageCredit } from "@/db/schema";
import { imageUrl } from "@/lib/image-url";
import { PlantImage } from "./plant-image";

export type GalleryImage = { label: string; file: string; credit?: ImageCredit };

export function PlantGallery({
  name,
  images,
  photoLabel,
}: {
  name: string;
  images: GalleryImage[];
  photoLabel: string;
}) {
  const [selected, setSelected] = useState(0);
  const current = images[selected];

  return (
    <div>
      <figure>
        <div className="relative aspect-[4/3] overflow-hidden rounded-lg border border-line bg-card">
          <PlantImage
            name={name}
            file={current?.file ?? null}
            alt={current ? `${name}: ${current.label}` : name}
            sizes="(min-width: 1024px) 50vw, 100vw"
            priority
          />
        </div>
        {current?.credit && (
          <figcaption className="mt-2 text-xs text-muted">
            {photoLabel}
            <a href={current.credit.sourceUrl} target="_blank" rel="noopener noreferrer" className="underline hover:text-ink">
              {current.credit.author}
            </a>
            , {current.credit.license}
          </figcaption>
        )}
      </figure>
      {images.length > 1 && (
        <div className="mt-3 flex gap-3">
          {images.map((image, index) => (
            <button
              key={image.label}
              type="button"
              onClick={() => setSelected(index)}
              aria-pressed={index === selected}
              className="w-24 text-left text-xs text-muted"
            >
              <span
                className={`relative block aspect-square overflow-hidden rounded-md border-2 ${
                  index === selected ? "border-leaf" : "border-line"
                }`}
              >
                <Image src={imageUrl(image.file)} alt="" fill sizes="96px" className="object-cover" />
              </span>
              <span className="mt-1 block">{image.label}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
