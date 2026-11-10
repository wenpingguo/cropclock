import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    serverActions: {
      // Vercel rejects request bodies over 4.5 MB. The admin form shrinks
      // photos in the browser first, so three images fit with room to spare.
      bodySizeLimit: "4mb",
    },
  },
  images: {
    // The /uploads route serves these widths itself (see src/lib/image-url.ts).
    loader: "custom",
    loaderFile: "./src/lib/image-loader.ts",
    deviceSizes: [640, 1200],
    imageSizes: [256],
  },
  cacheComponents: true,
  partialPrefetching: true,
};

export default nextConfig;
