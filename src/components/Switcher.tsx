import { useEffect, useState } from "react";
import { ChevronLeft, ChevronRight, LayoutGrid, X } from "lucide-react";
import type { ThemeId } from "../ben/config.ts";
import { THEMES } from "./themes.ts";

function Swatch({ colors, size = 30 }: { colors: string[]; size?: number }) {
  return (
    <span className="switcher-swatch" style={{ width: size, height: size }} aria-hidden="true">
      {colors.map((color) => (
        <span key={color} style={{ background: color }} />
      ))}
    </span>
  );
}

export function Switcher({ value, onChange }: { value: ThemeId; onChange: (id: ThemeId) => void }) {
  const [open, setOpen] = useState(false);
  const index = Math.max(0, THEMES.findIndex((t) => t.id === value));
  const current = THEMES[index];
  const go = (delta: number) => onChange(THEMES[(index + delta + THEMES.length) % THEMES.length].id);

  useEffect(() => {
    if (!open) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  return (
    <>
      {open && (
        <div className="switcher-sheet" role="dialog" aria-label="Choose a design direction" onClick={() => setOpen(false)}>
          <div className="switcher-panel" onClick={(event) => event.stopPropagation()}>
            <div className="switcher-panel-head">
              <div>
                <span className="switcher-label">Ben · design directions</span>
                <h2>Pick a direction</h2>
              </div>
              <button type="button" className="switcher-icon" onClick={() => setOpen(false)} aria-label="Close">
                <X size={18} />
              </button>
            </div>
            <div className="switcher-grid">
              {THEMES.map((theme, i) => (
                <button
                  key={theme.id}
                  type="button"
                  className="switcher-card"
                  aria-pressed={theme.id === value}
                  onClick={() => {
                    onChange(theme.id);
                    setOpen(false);
                  }}
                >
                  <span className="switcher-card-art" style={{ background: theme.swatch[0] }}>
                    <i style={{ background: theme.swatch[1] }} />
                    <i style={{ background: theme.swatch[2] }} />
                  </span>
                  <span className="switcher-card-num">{String(i + 1).padStart(2, "0")}</span>
                  <b>{theme.name}</b>
                  <small>{theme.tagline}</small>
                </button>
              ))}
            </div>
            <p className="switcher-foot">Keys 1–8 jump to a direction · [ and ] step through</p>
          </div>
        </div>
      )}

      <nav className="switcher" aria-label="Design direction">
        <button type="button" className="switcher-icon" onClick={() => go(-1)} aria-label="Previous direction">
          <ChevronLeft size={18} />
        </button>
        <button type="button" className="switcher-current" onClick={() => setOpen(true)} aria-label="Open all directions">
          <Swatch colors={current.swatch} />
          <span className="switcher-text">
            <b>
              {String(index + 1).padStart(2, "0")} {current.name}
            </b>
            <small>{current.tagline}</small>
          </span>
          <span className="switcher-count">
            <LayoutGrid size={14} /> {index + 1}/{THEMES.length}
          </span>
        </button>
        <button type="button" className="switcher-icon" onClick={() => go(1)} aria-label="Next direction">
          <ChevronRight size={18} />
        </button>
      </nav>
    </>
  );
}
