"use client";

import { useTransition } from "react";
import { deletePlant } from "@/server/actions/admin";

export function DeletePlantButton({ id, name }: { id: number; name: string }) {
  const [pending, startTransition] = useTransition();

  function handleClick() {
    if (window.confirm(`Delete ${name} and its images? This can't be undone.`)) {
      startTransition(() => deletePlant(id));
    }
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={pending}
      className="font-medium text-clay hover:underline disabled:opacity-60"
    >
      {pending ? "Deleting…" : "Delete"}
      <span className="sr-only"> {name}</span>
    </button>
  );
}
