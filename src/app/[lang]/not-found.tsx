import Link from "next/link";
import { localePath } from "@/i18n/config";
import { getI18n } from "@/i18n/server";

export default async function NotFound() {
  const { locale, t } = await getI18n();
  return (
    <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-16 sm:px-6">
      <h1 className="font-display text-3xl font-semibold">{t.notFoundTitle}</h1>
      <Link href={localePath(locale, "/")} className="mt-4 inline-block font-medium text-leaf hover:underline">
        {t.backToGuide}
      </Link>
    </main>
  );
}
