import { useEffect, useRef, useState, type CSSProperties, type PointerEvent as ReactPointerEvent, type ReactNode } from "react";
import { ArrowRight, Footprints, Moon, PhoneOff, Smile, Sparkles } from "lucide-react";
import "@fontsource-variable/unbounded";
import "@fontsource-variable/plus-jakarta-sans";
import { BenEmbed } from "../ben/BenEmbed.tsx";
import { useBen, type BenStatus } from "../ben/useBen.ts";
import "./aurora.css";

type Mood = "energised" | "calm" | "focused" | "rested";

const MOODS: Record<Mood, { label: string; icon: string; colors: [string, string, string]; ask: string }> = {
  energised: {
    label: "Energised",
    icon: "/aurora/zap.png",
    colors: ["#FF5CA8", "#FFB547", "#7C5CFF"],
    ask: "I want to feel more energised today. What's one thing I can do in the next hour?",
  },
  calm: {
    label: "Calm",
    icon: "/aurora/lotus.png",
    colors: ["#22D3EE", "#7C5CFF", "#5EEAD4"],
    ask: "I want to feel calmer. Can you guide me through a quick reset?",
  },
  focused: {
    label: "Focused",
    icon: "/aurora/target.png",
    colors: ["#7C5CFF", "#22D3EE", "#FF5CA8"],
    ask: "I need to focus for the next few hours. How should I set myself up?",
  },
  rested: {
    label: "Rested",
    icon: "/aurora/moon.png",
    colors: ["#6366F1", "#C084FC", "#22D3EE"],
    ask: "I want to wake up feeling rested tomorrow. What should my evening look like?",
  },
};

const FEATURES = [
  { icon: "/aurora/heart.png", title: "Talks like a friend", copy: "Face to face, in real time. Ben reads the room and answers like a person.", ask: "What makes you different from a normal health app?" },
  { icon: "/aurora/sleep.png", title: "Sleep, sorted", copy: "Wind-down rituals and gentle nudges that make mornings easier.", ask: "Help me build a better bedtime routine." },
  { icon: "/aurora/salad.png", title: "Food without rules", copy: "Simple swaps you actually enjoy. No calorie guilt.", ask: "Give me an easy, tasty lunch idea that keeps me full." },
  { icon: "/aurora/runner.png", title: "Move your way", copy: "Walks, dance breaks, stretches. Whatever gets you going.", ask: "Suggest a fun 10-minute workout I can do at home." },
  { icon: "/aurora/brain.png", title: "Mind matters", copy: "Breathing, journaling prompts and stress resets on demand.", ask: "I'm overthinking a lot lately. Can you help?" },
  { icon: "/aurora/shield.png", title: "Private by design", copy: "Your conversations stay yours. Never sold, never shared.", ask: "How do you keep my information private?" },
];

const STATUS: Record<BenStatus, string> = {
  loading: "Waking Ben up",
  ready: "Ben is online",
  connecting: "Connecting",
  live: "Live with Ben",
  ended: "Chat ended",
  unavailable: "Ben is busy",
};

/** Card that tilts toward the pointer. */
function Tilt({ className = "", children, onClick }: { className?: string; children: ReactNode; onClick?: () => void }) {
  const ref = useRef<HTMLButtonElement>(null);
  const move = (event: ReactPointerEvent<HTMLButtonElement>) => {
    const el = ref.current;
    if (!el || event.pointerType !== "mouse") return;
    const r = el.getBoundingClientRect();
    const x = (event.clientX - r.left) / r.width - 0.5;
    const y = (event.clientY - r.top) / r.height - 0.5;
    el.style.setProperty("--rx", `${(-y * 10).toFixed(2)}deg`);
    el.style.setProperty("--ry", `${(x * 12).toFixed(2)}deg`);
    el.style.setProperty("--mx", `${((x + 0.5) * 100).toFixed(1)}%`);
    el.style.setProperty("--my", `${((y + 0.5) * 100).toFixed(1)}%`);
  };
  const leave = () => {
    const el = ref.current;
    if (!el) return;
    el.style.setProperty("--rx", "0deg");
    el.style.setProperty("--ry", "0deg");
  };
  return (
    <button ref={ref} type="button" className={`au-tilt ${className}`} onPointerMove={move} onPointerLeave={leave} onClick={onClick}>
      {children}
    </button>
  );
}

function Logo() {
  return (
    <svg viewBox="0 0 36 36" width="34" height="34" aria-hidden="true">
      <defs>
        <linearGradient id="au-logo" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#22D3EE" />
          <stop offset=".5" stopColor="#7C5CFF" />
          <stop offset="1" stopColor="#FF5CA8" />
        </linearGradient>
      </defs>
      <circle cx="18" cy="18" r="14" fill="none" stroke="url(#au-logo)" strokeWidth="5" />
      <circle cx="18" cy="18" r="4.5" fill="#fff" />
    </svg>
  );
}

function StoreBadge({ store }: { store: "apple" | "google" }) {
  return (
    <a className="au-store" href="#aurora" onClick={(e) => e.preventDefault()}>
      {store === "apple" ? (
        <svg viewBox="0 0 24 24" width="22" height="22" aria-hidden="true">
          <path
            fill="currentColor"
            d="M16.4 12.6c0-2.4 2-3.5 2-3.6-1.1-1.6-2.8-1.8-3.4-1.8-1.4-.1-2.8.9-3.5.9-.7 0-1.9-.9-3.1-.8-1.6 0-3 .9-3.8 2.3-1.6 2.8-.4 7 1.2 9.3.8 1.1 1.7 2.4 2.9 2.3 1.2 0 1.6-.7 3-.7s1.8.7 3.1.7c1.3 0 2.1-1.1 2.8-2.3.9-1.3 1.3-2.6 1.3-2.6s-2.5-1-2.5-3.7ZM14.2 5.6c.6-.8 1.1-1.9 1-3-.9 0-2.1.6-2.7 1.4-.6.7-1.1 1.8-1 2.9 1 .1 2.1-.5 2.7-1.3Z"
          />
        </svg>
      ) : (
        <svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true">
          <path fill="#22D3EE" d="M3.6 2.3 13.3 12l-9.7 9.7c-.4-.2-.6-.6-.6-1.1V3.4c0-.5.2-.9.6-1.1Z" />
          <path fill="#7C5CFF" d="m16.6 8.7-3.3 3.3-9.7-9.7 12.4 6.1.6.3Z" />
          <path fill="#FF5CA8" d="m16.6 15.3-.6.3-12.4 6.1 9.7-9.7 3.3 3.3Z" />
          <path fill="#FFB547" d="M20.6 10.6c.9.5.9 1.8 0 2.3l-4 2.4-3.3-3.3 3.3-3.3 4 1.9Z" />
        </svg>
      )}
      <span>
        <small>{store === "apple" ? "Download on the" : "Get it on"}</small>
        <b>{store === "apple" ? "App Store" : "Google Play"}</b>
      </span>
    </a>
  );
}

export function Aurora() {
  const ben = useBen();
  const live = ben.status === "live";
  const [mood, setMood] = useState<Mood>("calm");
  const rootRef = useRef<HTMLDivElement>(null);
  const [c1, c2, c3] = MOODS[mood].colors;

  // Pointer parallax for the aurora blobs (rAF-throttled, removed on unmount).
  useEffect(() => {
    const root = rootRef.current;
    if (!root || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    let frame = 0;
    let tx = 0;
    let ty = 0;
    const onMove = (event: PointerEvent) => {
      tx = event.clientX / window.innerWidth - 0.5;
      ty = event.clientY / window.innerHeight - 0.5;
      if (frame) return;
      frame = requestAnimationFrame(() => {
        frame = 0;
        root.style.setProperty("--px", tx.toFixed(3));
        root.style.setProperty("--py", ty.toFixed(3));
      });
    };
    window.addEventListener("pointermove", onMove);
    return () => {
      window.removeEventListener("pointermove", onMove);
      cancelAnimationFrame(frame);
    };
  }, []);

  const pick = (next: Mood) => {
    setMood(next);
    ben.share(`The member says they want to feel ${MOODS[next].label.toLowerCase()} today.`);
  };

  const talk = () => {
    document.getElementById("au-device")?.scrollIntoView({ behavior: "smooth", block: "center" });
    if (!live) ben.start();
  };

  const ask = (text: string) => {
    document.getElementById("au-device")?.scrollIntoView({ behavior: "smooth", block: "center" });
    ben.ask(text);
  };

  const lastLines = ben.transcript.slice(-3);

  return (
    <div className="au" ref={rootRef} style={{ "--c1": c1, "--c2": c2, "--c3": c3 } as CSSProperties}>
      <div className="au-sky" aria-hidden="true">
        <span className="au-blob au-b1" />
        <span className="au-blob au-b2" />
        <span className="au-blob au-b3" />
        <span className="au-blob au-b4" />
        <span className="au-grain" />
      </div>

      <header className="au-nav">
        <a className="au-logo" href="#aurora">
          <Logo /> ben
        </a>
        <nav className="au-links" aria-label="Main">
          <a href="#au-features">Features</a>
          <a href="#au-stories">Stories</a>
          <a href="#au-get">Get the app</a>
        </nav>
        <button type="button" className="au-btn au-btn-glass au-btn-sm" onClick={talk}>
          <Sparkles size={15} /> Talk to Ben
        </button>
      </header>

      <section className="au-hero">
        <div className="au-hero-copy">
          <span className="au-chip-label">
            <span className="au-live-dot" /> New · face-to-face AI coaching
          </span>
          <h1>
            Feel good,
            <br />
            <span className="au-grad">out loud.</span>
          </h1>
          <p className="au-lede">
            Ben is the coach who actually talks back. A real face, a real conversation, and tiny steps that make every day
            a little brighter.
          </p>

          <div className="au-moods">
            <span className="au-moods-q">How do you want to feel today?</span>
            <div className="au-mood-row">
              {(Object.keys(MOODS) as Mood[]).map((id) => (
                <button key={id} type="button" className="au-mood" aria-pressed={mood === id} onClick={() => pick(id)}>
                  <img src={MOODS[id].icon} alt="" />
                  {MOODS[id].label}
                </button>
              ))}
            </div>
          </div>

          <div className="au-cta">
            <button type="button" className="au-btn au-btn-grad" onClick={() => ask(MOODS[mood].ask)}>
              Get my {MOODS[mood].label.toLowerCase()} plan <ArrowRight size={18} />
            </button>
            <div className="au-stores">
              <StoreBadge store="apple" />
              <StoreBadge store="google" />
            </div>
          </div>
        </div>

        <div className="au-hero-visual">
          <div className="au-halo" aria-hidden="true" />
          <div className="au-device" id="au-device">
            <div className="au-device-inner">
              <div className="au-device-top">
                <span className="au-status" data-status={ben.status}>
                  <i /> {STATUS[ben.status]}
                </span>
                {live ? (
                  <button type="button" className="au-end" onClick={ben.end}>
                    <PhoneOff size={14} /> {ben.elapsed}
                  </button>
                ) : (
                  <span className="au-device-pill">Ben</span>
                )}
              </div>
              <div className="au-frame">
                <BenEmbed theme="aurora" />
              </div>
            </div>
          </div>

          <button type="button" className="au-orbit au-o1" onClick={() => ask("Can you check in on my mood today?")}>
            <span className="au-orbit-icon" style={{ background: "linear-gradient(135deg,#FF5CA8,#FFB547)" }}>
              <Smile size={18} />
            </span>
            <span>
              <small>Mood</small>
              <b>Feeling bright</b>
            </span>
          </button>
          <button type="button" className="au-orbit au-o2" onClick={() => ask("I slept 7 hours 20 minutes. How can I make it more restful?")}>
            <span className="au-orbit-icon" style={{ background: "linear-gradient(135deg,#7C5CFF,#22D3EE)" }}>
              <Moon size={18} />
            </span>
            <span>
              <small>Sleep</small>
              <b>7h 20m</b>
            </span>
          </button>
          <button type="button" className="au-orbit au-o3" onClick={() => ask("I'm at 8,240 steps. How do I hit 10,000 without trying too hard?")}>
            <span className="au-orbit-icon" style={{ background: "linear-gradient(135deg,#22D3EE,#5EEAD4)" }}>
              <Footprints size={18} />
            </span>
            <span>
              <small>Steps</small>
              <b>8,240</b>
            </span>
          </button>
        </div>
      </section>

      <section className="au-stats">
        {[
          ["< 1 s", "to start talking"],
          ["24/7", "always there"],
          ["30+", "languages"],
          ["4.9★", "member rating"],
        ].map(([n, l]) => (
          <div key={l}>
            <b>{n}</b>
            <small>{l}</small>
          </div>
        ))}
      </section>

      <section className="au-section" id="au-features">
        <div className="au-head">
          <span className="au-chip-label">Everything in one chat</span>
          <h2>
            One coach. <span className="au-grad">Every part of you.</span>
          </h2>
          <p>Tap any card to ask Ben about it.</p>
        </div>
        <div className="au-bento">
          <Tilt className="au-card au-card-hero" onClick={() => ask("Tell me how a session with you works.")}>
            <img className="au-card-photo" src="/aurora/dance.jpg" alt="" loading="lazy" />
            <span className="au-card-photo-shade" />
            <span className="au-card-body">
              <span className="au-tag">Live conversation</span>
              <b className="au-card-big">Real face.
                <br />
                Real talk.</b>
              {lastLines.length > 0 ? (
                <span className="au-mini-log">
                  {lastLines.map((line) => (
                    <span key={line.id} data-role={line.role}>
                      <em>{line.role === "replica" ? "Ben" : "You"}</em> {line.speech}
                    </span>
                  ))}
                </span>
              ) : (
                <span className="au-card-copy">Your words appear here as you talk with Ben.</span>
              )}
            </span>
          </Tilt>
          {FEATURES.map((f) => (
            <Tilt key={f.title} className="au-card" onClick={() => ask(f.ask)}>
              <img className="au-card-icon" src={f.icon} alt="" />
              <b>{f.title}</b>
              <span className="au-card-copy">{f.copy}</span>
              <span className="au-card-ask">
                Ask Ben <ArrowRight size={14} />
              </span>
            </Tilt>
          ))}
        </div>
      </section>

      <section className="au-section" id="au-stories">
        <div className="au-head">
          <span className="au-chip-label">Members glowing up</span>
          <h2>
            Small steps, <span className="au-grad">big feelings.</span>
          </h2>
        </div>
        <div className="au-stories">
          {[
            { img: "/aurora/smile-neon.jpg", name: "Maya, 27", quote: "I talk to Ben on my walk home. It's like a friend who knows a lot about sleep." },
            { img: "/aurora/ringlight.jpg", name: "Jordan, 31", quote: "Ten-minute dance breaks were his idea. I've never been this consistent." },
            { img: "/aurora/headphones.jpg", name: "Sam, 24", quote: "Finally a health app that doesn't feel like homework. It feels like a chat." },
          ].map((s) => (
            <figure key={s.name} className="au-story">
              <img src={s.img} alt="" loading="lazy" />
              <figcaption>
                <blockquote>“{s.quote}”</blockquote>
                <b>{s.name}</b>
              </figcaption>
            </figure>
          ))}
        </div>
      </section>

      <section className="au-section" id="au-get">
        <div className="au-final">
          <div className="au-final-copy">
            <img src="/aurora/rocket.png" alt="" className="au-final-rocket" />
            <h2>
              Your glow-up
              <br />
              <span className="au-grad">starts with hello.</span>
            </h2>
            <p>Free to start. Talk to Ben in your browser now, or take him everywhere with the app.</p>
            <div className="au-cta">
              <button type="button" className="au-btn au-btn-grad" onClick={talk}>
                Talk to Ben now <ArrowRight size={18} />
              </button>
              <div className="au-stores">
                <StoreBadge store="apple" />
                <StoreBadge store="google" />
              </div>
            </div>
          </div>
          <div className="au-qr" aria-hidden="true">
            <svg viewBox="0 0 21 21" shapeRendering="crispEdges">
              {Array.from({ length: 21 * 21 }, (_, i) => {
                const x = i % 21;
                const y = Math.floor(i / 21);
                const finder = (cx: number, cy: number) => x >= cx && x < cx + 7 && y >= cy && y < cy + 7;
                const inFinder = finder(0, 0) || finder(14, 0) || finder(0, 14);
                let on: boolean;
                if (inFinder) {
                  const fx = x >= 14 ? x - 14 : x;
                  const fy = y >= 14 ? y - 14 : y;
                  on = fx === 0 || fx === 6 || fy === 0 || fy === 6 || (fx >= 2 && fx <= 4 && fy >= 2 && fy <= 4);
                } else {
                  on = ((x * 7 + y * 13 + x * y) % 5) < 2;
                }
                return on ? <rect key={i} x={x} y={y} width="1" height="1" /> : null;
              })}
            </svg>
            <small>Scan to get the app</small>
          </div>
        </div>
      </section>

      <footer className="au-footer">
        <span className="au-logo">
          <Logo /> ben
        </span>
        <small>Ben is a wellness coach, not a medical provider. In an emergency, call your local emergency number.</small>
      </footer>
    </div>
  );
}
