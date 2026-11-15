import "@fontsource/cormorant-garamond/400.css";
import "@fontsource/cormorant-garamond/500.css";
import "@fontsource/cormorant-garamond/400-italic.css";
import "@fontsource/cormorant-garamond/500-italic.css";
import "@fontsource-variable/manrope";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  ArrowLeft,
  ArrowRight,
  ArrowUpRight,
  Hand,
  Minus,
  Pause,
  PhoneOff,
  Play,
  Plus,
  Sparkles,
  X,
} from "lucide-react";
import { BenEmbed } from "../ben/BenEmbed.tsx";
import { useBen, type BenStatus } from "../ben/useBen.ts";
import { ClinicTour, HOTSPOTS, ROOM_COUNT, detectRenderTier, type RenderTier, type Tour } from "./aurevita/scene.ts";
import { StillTour } from "./aurevita/still.ts";
import { HOTSPOT_COPY, ROOMS } from "./aurevita/rooms.ts";
import "./aurevita.css";

const STATUS: Record<BenStatus, string> = {
  loading: "Preparing your host",
  ready: "Your host is available",
  connecting: "Connecting…",
  live: "In conversation",
  ended: "Conversation ended",
  unavailable: "Your host is with another guest",
};

const PILLARS = [
  { n: "I", title: "Measure", copy: "A hundred-plus biomarkers, imaging and fitness testing establish your true baseline.", img: "/aurevita/img/lab.jpg" },
  { n: "II", title: "Restore", copy: "Recovery protocols built on your data: heat, cold, breath and deep sleep.", img: "/aurevita/img/sauna.jpg" },
  { n: "III", title: "Move", copy: "Strength, stability and zone 2 cardio, programmed for decades, not weeks.", img: "/aurevita/img/couple-meditate.jpg" },
  { n: "IV", title: "Renew", copy: "Touch, rest and stillness, because longevity is also how you feel today.", img: "/aurevita/img/massage.jpg" },
];

const JOURNEY = [
  { when: "Day 1", what: "Arrival, full diagnostics and your first conversation with Ben." },
  { when: "Week 1", what: "Results review and your personal longevity blueprint." },
  { when: "Weeks 2–12", what: "Daily coaching with Ben, monthly clinic sessions, recovery rituals." },
  { when: "Day 90", what: "Re-test, compare biological age and refine the plan." },
];

function Monogram() {
  return (
    <svg viewBox="0 0 40 40" width="34" height="34" aria-hidden="true">
      <circle cx="20" cy="20" r="19" fill="none" stroke="currentColor" strokeWidth="1" />
      <path d="M12 29 20 10l8 19M15 22h10" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinejoin="round" />
    </svg>
  );
}

export function Aurevita() {
  const ben = useBen();
  const live = ben.status === "live";
  const stageRef = useRef<HTMLDivElement>(null);
  const tourRef = useRef<Tour | null>(null);
  const hotspotRefs = useRef<Map<string, HTMLButtonElement>>(new Map());
  const [room, setRoom] = useState(0);
  const [progress, setProgress] = useState(0);
  const [failed, setFailed] = useState(false);
  const [tierUsed, setTierUsed] = useState<RenderTier>("gpu");
  const [graceOver, setGraceOver] = useState(false);
  const [auto, setAuto] = useState(false);
  const [openSpot, setOpenSpot] = useState<string | null>(null);
  const [hostOpen, setHostOpen] = useState(true);
  const roomRef = useRef(0);

  // Boot the 3D clinic once fonts used on its signage are ready.
  useEffect(() => {
    const stage = stageRef.current;
    if (!stage) return;
    let cancelled = false;
    let tour: Tour | null = null;
    const boot = async () => {
      await Promise.all([
        document.fonts.load('500 64px "Cormorant Garamond"'),
        document.fonts.load('600 32px "Manrope Variable"'),
      ]).catch(() => undefined);
      if (cancelled) return;
      // Pick the richest tour this device can run: full 3D on a GPU, light 3D on software
      // WebGL (VPS, VM, no driver), or the picture tour when there is no WebGL at all.
      // ?tour=full|lite|still forces one; ?capture renders full quality on demand (for stills).
      const params = new URLSearchParams(window.location.search);
      const forced = params.get("tour");
      const capture = params.has("capture");
      const tier: RenderTier =
        forced === "still" ? "none" : forced === "lite" ? "software" : forced === "full" || capture ? "gpu" : detectRenderTier();
      const onFrame = () => {
        // Move hotspot pins every frame without re-rendering React.
        for (const spot of HOTSPOTS) {
          const el = hotspotRefs.current.get(spot.id);
          if (!el || !tour) continue;
          const pos = spot.room === roomRef.current && !tour.isFlying() ? tour.project(spot.position) : null;
          if (pos) {
            el.style.transform = `translate(${pos.x}px, ${pos.y}px)`;
            el.dataset.visible = "true";
          } else {
            el.dataset.visible = "false";
          }
        }
      };
      const onLoad = (p: number) => setProgress(p);
      setTierUsed(tier);
      try {
        tour =
          tier === "none"
            ? new StillTour(stage, onLoad, onFrame)
            : new ClinicTour(stage, onLoad, onFrame, {
                lite: tier === "software",
                onDemand: capture,
                // Even lite 3D can't keep up (a very busy VPS): continue as the picture tour, same room.
                onTooSlow: () => {
                  if (cancelled) return;
                  tour?.dispose();
                  tour = new StillTour(stage, onLoad, onFrame, roomRef.current);
                  tourRef.current = tour;
                  setTierUsed("none");
                },
              });
      } catch (error) {
        console.warn("[Aurevita] WebGL unavailable, using the picture tour", error);
        try {
          tour = new StillTour(stage, onLoad, onFrame);
          setTierUsed("none");
        } catch {
          setFailed(true);
        }
      }
      tourRef.current = tour;
      if (capture) (window as unknown as { __tour?: Tour | null }).__tour = tour;
    };
    void boot();
    return () => {
      cancelled = true;
      tour?.dispose();
      tourRef.current = null;
    };
  }, []);

  const goTo = useCallback(
    (index: number) => {
      const next = (index + ROOM_COUNT) % ROOM_COUNT;
      roomRef.current = next;
      setRoom(next);
      setOpenSpot(null);
      tourRef.current?.goTo(next);
      const r = ROOMS[next];
      ben.share(`The member has just walked into ${r.title}. ${r.copy} If it feels natural, briefly welcome them to this room.`);
    },
    [ben],
  );

  // Don't hold the visitor on the veil: show the clinic after a few seconds, furniture streams in.
  useEffect(() => {
    const timer = window.setTimeout(() => setGraceOver(true), 4000);
    return () => window.clearTimeout(timer);
  }, []);

  // Guided auto-tour.
  useEffect(() => {
    if (!auto) return;
    const timer = window.setInterval(() => goTo(roomRef.current + 1), 9000);
    return () => window.clearInterval(timer);
  }, [auto, goTo]);

  // Arrow keys walk the clinic while the tour is on screen.
  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null;
      if (target && (target.tagName === "INPUT" || target.tagName === "TEXTAREA")) return;
      if (window.scrollY > window.innerHeight * 0.6) return;
      if (event.key === "ArrowRight") goTo(roomRef.current + 1);
      if (event.key === "ArrowLeft") goTo(roomRef.current - 1);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [goTo]);

  const current = ROOMS[room];
  const lastLines = ben.transcript.slice(-2);
  const loaded = progress >= 1 || graceOver;

  return (
    <div className="av" data-tier={tierUsed}>
      <section className="av-tour">
        <div className="av-stage" ref={stageRef} />
        {failed && (
          <div className="av-fallback">
            <img src="/aurevita/img/massage.jpg" alt="" />
          </div>
        )}
        <div className="av-vignette" aria-hidden="true" />

        <div className={`av-veil ${loaded || failed ? "is-done" : ""}`} aria-hidden={loaded}>
          <Monogram />
          <span className="av-veil-word">AUREVITA</span>
          <span className="av-veil-bar">
            <i style={{ transform: `scaleX(${Math.max(0.04, progress)})` }} />
          </span>
          <small>Preparing your private tour · {Math.round(progress * 100)}%</small>
        </div>

        <header className="av-nav">
          <a className="av-logo" href="#aurevita">
            <Monogram />
            <span>AUREVITA</span>
          </a>
          <nav className="av-links" aria-label="Main">
            <a href="#av-method">The Method</a>
            <a href="#av-journey">Your Journey</a>
            <a href="#av-membership">Membership</a>
          </nav>
          <button type="button" className="av-btn av-btn-line" onClick={() => (live ? undefined : ben.start())}>
            Book a visit <ArrowUpRight size={15} />
          </button>
        </header>

        {HOTSPOTS.map((spot) => (
          <button
            key={spot.id}
            type="button"
            className="av-pin"
            data-visible="false"
            data-open={openSpot === spot.id || undefined}
            ref={(el) => {
              if (el) hotspotRefs.current.set(spot.id, el);
              else hotspotRefs.current.delete(spot.id);
            }}
            onClick={() => setOpenSpot(openSpot === spot.id ? null : spot.id)}
            aria-label={HOTSPOT_COPY[spot.id].title}
          >
            <span className="av-pin-dot" />
            <span className="av-pin-label">{HOTSPOT_COPY[spot.id].title}</span>
          </button>
        ))}

        <div className="av-room" key={room}>
          <span className="av-room-num">
            {String(room + 1).padStart(2, "0")} <i>/ {String(ROOM_COUNT).padStart(2, "0")}</i> · {current.kicker}
          </span>
          <h1>{current.title}</h1>
          <p>{current.copy}</p>
          <div className="av-room-actions">
            <button type="button" className="av-btn av-btn-solid" onClick={() => ben.ask(current.ask)}>
              <Sparkles size={15} /> Ask Ben about this room
            </button>
            <button type="button" className="av-btn av-btn-glass" onClick={() => goTo(room + 1)}>
              {room === ROOM_COUNT - 1 ? "Back to reception" : `Walk to ${ROOMS[room + 1].name}`} <ArrowRight size={15} />
            </button>
          </div>
        </div>

        {openSpot && (
          <div className="av-spot-card" role="dialog" aria-label={HOTSPOT_COPY[openSpot].title}>
            <button type="button" className="av-spot-close" onClick={() => setOpenSpot(null)} aria-label="Close">
              <X size={14} />
            </button>
            <h3>{HOTSPOT_COPY[openSpot].title}</h3>
            <p>{HOTSPOT_COPY[openSpot].copy}</p>
            <button
              type="button"
              className="av-link"
              onClick={() => {
                ben.ask(HOTSPOT_COPY[openSpot].ask);
                setOpenSpot(null);
              }}
            >
              Ask Ben <ArrowRight size={14} />
            </button>
          </div>
        )}

        <div className="av-steps">
          <button type="button" className="av-round" onClick={() => goTo(room - 1)} aria-label="Previous room">
            <ArrowLeft size={16} />
          </button>
          <ol>
            {ROOMS.map((r, i) => (
              <li key={r.name}>
                <button type="button" aria-current={i === room ? "step" : undefined} onClick={() => goTo(i)}>
                  <span>{String(i + 1).padStart(2, "0")}</span>
                  {r.name}
                </button>
              </li>
            ))}
          </ol>
          <button type="button" className="av-round" onClick={() => goTo(room + 1)} aria-label="Next room">
            <ArrowRight size={16} />
          </button>
          <button type="button" className="av-auto" onClick={() => setAuto((a) => !a)} aria-pressed={auto}>
            {auto ? <Pause size={14} /> : <Play size={14} />} {auto ? "Pause tour" : "Guided tour"}
          </button>
        </div>

        <span className="av-hint">
          <Hand size={14} /> Drag to look around · tap the gold points
        </span>

        <aside className="av-host" data-open={hostOpen}>
          <div className="av-host-head">
            <span className="av-host-status" data-status={ben.status}>
              <i /> {STATUS[ben.status]}
            </span>
            {live && <span className="av-host-time">{ben.elapsed}</span>}
            <button type="button" className="av-round av-round-sm" onClick={() => setHostOpen((o) => !o)} aria-label={hostOpen ? "Minimise host" : "Show host"}>
              {hostOpen ? <Minus size={14} /> : <Plus size={14} />}
            </button>
          </div>
          <div className="av-host-body">
            <div className="av-host-frame">
              <BenEmbed theme="aurevita" />
            </div>
            <div className="av-host-foot">
              <div>
                <b>Ben</b>
                <small>Longevity coach & host</small>
              </div>
              {live && (
                <button type="button" className="av-end" onClick={ben.end}>
                  <PhoneOff size={14} /> End
                </button>
              )}
            </div>
            {lastLines.length > 0 && (
              <ul className="av-host-lines">
                {lastLines.map((line) => (
                  <li key={line.id} data-role={line.role}>
                    <b>{line.role === "replica" ? "Ben" : "You"}</b> {line.speech}
                  </li>
                ))}
              </ul>
            )}
          </div>
        </aside>
      </section>

      <section className="av-intro">
        <p>
          Aurevita is a longevity clinic where <em>measurement</em>, <em>recovery</em> and <em>daily coaching</em> live under one roof,
          and where your coach walks the halls with you.
        </p>
      </section>

      <section className="av-section" id="av-method">
        <div className="av-head">
          <span className="av-kicker">The Aurevita Method</span>
          <h2>
            Four disciplines, <em>one long life.</em>
          </h2>
        </div>
        <div className="av-pillars">
          {PILLARS.map((p) => (
            <article key={p.n} className="av-pillar">
              <div className="av-pillar-img">
                <img src={p.img} alt="" loading="lazy" />
              </div>
              <span className="av-pillar-n">{p.n}</span>
              <h3>{p.title}</h3>
              <p>{p.copy}</p>
              <button type="button" className="av-link" onClick={() => ben.ask(`Tell me about the ${p.title} part of the Aurevita method.`)}>
                Ask Ben <ArrowRight size={14} />
              </button>
            </article>
          ))}
        </div>
      </section>

      <section className="av-section av-journey" id="av-journey">
        <div className="av-head">
          <span className="av-kicker">Your first ninety days</span>
          <h2>
            A journey, <em>gently guided.</em>
          </h2>
        </div>
        <ol className="av-timeline">
          {JOURNEY.map((j) => (
            <li key={j.when}>
              <span>{j.when}</span>
              <p>{j.what}</p>
            </li>
          ))}
        </ol>
      </section>

      <section className="av-section av-story">
        <img src="/aurevita/img/couple-laptop.jpg" alt="A smiling couple at home, she leans over his shoulder as they look at a laptop together" loading="lazy" />
        <figure>
          <blockquote>
            “We came for the tests. We stayed for the feeling of being looked after, every single day, by people and by Ben.”
          </blockquote>
          <figcaption>Elena & Marco · members since 2025</figcaption>
        </figure>
      </section>

      <section className="av-section" id="av-membership">
        <div className="av-head">
          <span className="av-kicker">Membership</span>
          <h2>
            Choose your <em>pace.</em>
          </h2>
        </div>
        <div className="av-tiers">
          {[
            { name: "Essential", price: "€290", items: ["Annual diagnostics", "Ben, daily coaching", "Quarterly review"] },
            { name: "Signature", price: "€690", items: ["Everything in Essential", "Monthly clinic sessions", "Recovery spa access"], featured: true },
            { name: "Private", price: "On request", items: ["Dedicated physician", "Home & travel care", "Family membership"] },
          ].map((tier) => (
            <article key={tier.name} className="av-tier" data-featured={tier.featured || undefined}>
              <h3>{tier.name}</h3>
              <b>
                {tier.price}
                {tier.price.startsWith("€") && <small> / month</small>}
              </b>
              <ul>
                {tier.items.map((it) => (
                  <li key={it}>{it}</li>
                ))}
              </ul>
              <button type="button" className={`av-btn ${tier.featured ? "av-btn-solid" : "av-btn-line"}`} onClick={() => ben.ask(`Is the ${tier.name} membership right for me?`)}>
                Discuss with Ben
              </button>
            </article>
          ))}
        </div>
      </section>

      <footer className="av-footer">
        <span className="av-logo">
          <Monogram />
          <span>AUREVITA</span>
        </span>
        <small>Prototype · Ben is a wellness coach, not a medical provider.</small>
      </footer>
    </div>
  );
}
