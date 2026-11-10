import type { Metadata } from "next";
import Link from "next/link";
import { logout } from "@/server/actions/admin";

export const metadata: Metadata = { robots: { index: false } };

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-8 sm:px-6">
      <nav className="flex items-center justify-between gap-4 text-sm" aria-label="Admin">
        <Link href="/admin" className="font-medium text-leaf hover:underline">
          All plants
        </Link>
        <form action={logout}>
          <button type="submit" className="font-medium text-muted hover:underline">
            Sign out
          </button>
        </form>
      </nav>
      {children}
    </main>
  );
}
