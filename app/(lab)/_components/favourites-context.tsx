"use client";

import { createContext, useCallback, useContext, useState } from "react";
import { LAB_SHOWCASE } from "@/data/lab-showcase";

// Starred project ids, shared by the Lab cards and the sidebar Favourites so a star shows up there at once.
// shortcut: lives in the lab layout (survives navigation, resets on reload) — no favourites API yet.
type Favs = { stars: Set<string>; toggle: (id: string) => void };
const Ctx = createContext<Favs>({ stars: new Set(), toggle: () => {} });

export function FavouritesProvider({ children }: { children: React.ReactNode }) {
  const [stars, setStars] = useState(() => new Set(LAB_SHOWCASE.filter((c) => c.favourite).map((c) => c.projectId)));
  const toggle = useCallback(
    (id: string) =>
      setStars((prev) => {
        const next = new Set(prev);
        if (!next.delete(id)) next.add(id);
        return next;
      }),
    [],
  );
  return <Ctx.Provider value={{ stars, toggle }}>{children}</Ctx.Provider>;
}

export const useFavourites = () => useContext(Ctx);
