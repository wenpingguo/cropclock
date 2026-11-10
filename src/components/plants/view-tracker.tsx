"use client";

import { useEffect } from "react";

/**
 * Counts a view once the page is really open in a browser, so link prefetches
 * and crawlers don't count. The timeout absorbs React Strict Mode's dev-only
 * mount/unmount/mount, and the effect re-runs on each later visit to the page.
 */
export function ViewTracker({ slug }: { slug: string }) {
  useEffect(() => {
    const timer = setTimeout(() => {
      fetch(`/api/plants/${slug}/view`, { method: "POST", keepalive: true }).catch(() => undefined);
    }, 0);
    return () => clearTimeout(timer);
  }, [slug]);

  return null;
}
