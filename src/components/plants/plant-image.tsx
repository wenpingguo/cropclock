import Image from "next/image";
import { imageUrl } from "@/lib/image-url";

export function PlantImage({
  name,
  file,
  alt,
  sizes,
  priority,
}: {
  name: string;
  file: string | null;
  alt: string;
  sizes: string;
  priority?: boolean;
}) {
  if (!file) {
    return (
      <div
        aria-hidden
        className="flex h-full w-full items-center justify-center bg-leaf-soft font-display text-5xl text-leaf"
      >
        {name.charAt(0)}
      </div>
    );
  }
  return (
    <Image src={imageUrl(file)} alt={alt} fill sizes={sizes} priority={priority} className="object-cover" />
  );
}
