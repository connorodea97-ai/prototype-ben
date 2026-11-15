import { Suspense, lazy, useCallback, useEffect, useState, type ComponentType } from "react";
import type { ThemeId } from "./ben/config.ts";
import { Switcher } from "./components/Switcher.tsx";
import { THEMES } from "./components/themes.ts";

// Each direction is its own chunk, so heavy ones (three.js, GSAP) only load when chosen.
const VIEWS: Record<ThemeId, ComponentType> = {
  serene: lazy(() => import("./themes/Serene.tsx").then((m) => ({ default: m.Serene }))),
  pulse: lazy(() => import("./themes/Pulse.tsx").then((m) => ({ default: m.Pulse }))),
  aurevita: lazy(() => import("./themes/Aurevita.tsx").then((m) => ({ default: m.Aurevita }))),
  noir: lazy(() => import("./themes/Noir.tsx").then((m) => ({ default: m.Noir }))),
  aurora: lazy(() => import("./themes/Aurora.tsx").then((m) => ({ default: m.Aurora }))),
  heritage: lazy(() => import("./themes/Heritage.tsx").then((m) => ({ default: m.Heritage }))),
  buddies: lazy(() => import("./themes/Buddies.tsx").then((m) => ({ default: m.Buddies }))),
  maison: lazy(() => import("./themes/Maison.tsx").then((m) => ({ default: m.Maison }))),
};

function readHash(): ThemeId {
  const hash = window.location.hash.replace("#", "");
  return THEMES.some((t) => t.id === hash) ? (hash as ThemeId) : "serene";
}

function Loading() {
  return (
    <div className="theme-loading" aria-live="polite">
      <span />
    </div>
  );
}

export function App() {
  const [theme, setTheme] = useState<ThemeId>(readHash);

  const choose = useCallback((id: ThemeId) => {
    if (window.location.hash !== `#${id}`) history.replaceState(null, "", `#${id}`);
    setTheme(id);
    window.scrollTo({ top: 0 });
  }, []);

  useEffect(() => {
    const onHash = () => setTheme(readHash());
    const onKey = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null;
      if (target && (target.tagName === "INPUT" || target.tagName === "TEXTAREA" || target.isContentEditable)) return;
      if (event.metaKey || event.ctrlKey || event.altKey) return;
      const keys = ["1", "2", "3", "4", "5", "6", "7", "8"];
      const index = keys.indexOf(event.key);
      if (index >= 0 && THEMES[index]) choose(THEMES[index].id);
      if (event.key === "[" || event.key === "]") {
        const at = THEMES.findIndex((t) => t.id === readHash());
        const next = (at + (event.key === "]" ? 1 : -1) + THEMES.length) % THEMES.length;
        choose(THEMES[next].id);
      }
    };
    window.addEventListener("hashchange", onHash);
    window.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener("hashchange", onHash);
      window.removeEventListener("keydown", onKey);
    };
  }, [choose]);

  useEffect(() => {
    document.documentElement.dataset.direction = theme;
  }, [theme]);

  const View = VIEWS[theme];

  return (
    <>
      {/* key: each direction gets a fresh element and a fresh Tavus session */}
      <div className="theme-stage" key={theme}>
        <Suspense fallback={<Loading />}>
          <View />
        </Suspense>
      </div>
      <Switcher value={theme} onChange={choose} />
    </>
  );
}
