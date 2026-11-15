import "@fontsource/italiana";
import "@fontsource-variable/hanken-grotesk";
import { memo, useCallback, useEffect, useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { SplitText } from "gsap/SplitText";
import Lenis from "lenis";
import { ArrowDownRight, ArrowUpRight, PhoneOff } from "lucide-react";
import { BenEmbed } from "../ben/BenEmbed.tsx";
import { useBen, type Ben, type BenStatus } from "../ben/useBen.ts";
import "./noir.css";

gsap.registerPlugin(ScrollTrigger, SplitText);

const RITUALS = [
  {
    n: "I",
    title: "Sleep",
    line: "Restoration, engineered nightly.",
    copy: "A wind-down protocol shaped around your chronotype, light and temperature.",
    img: "/noir/portrait.jpg",
    ask: "Design an evening ritual that improves my deep sleep.",
  },
  {
    n: "II",
    title: "Nourishment",
    line: "Food as quiet precision.",
    copy: "Meals composed for steady energy, longevity and genuine pleasure.",
    img: "/noir/food.jpg",
    ask: "What should a day of eating for longevity look like for me?",
  },
  {
    n: "III",
    title: "Recovery",
    line: "Strength that lasts decades.",
    copy: "Training, cold and heat, balanced against what your body tells us.",
    img: "/noir/swimmer.jpg",
    ask: "How should I balance training and recovery this week?",
  },
  {
    n: "IV",
    title: "Mind",
    line: "Stillness, by design.",
    copy: "Breath, focus and calm, practised in moments that fit your day.",
    img: "/noir/candles.jpg",
    ask: "Guide me through a short practice to calm my mind.",
  },
];

const STATUS: Record<BenStatus, string> = {
  loading: "Preparing the suite",
  ready: "Ben is available",
  connecting: "Connecting privately",
  live: "In consultation",
  ended: "Consultation concluded",
  unavailable: "Ben is with another member",
};

function Monogram({ className = "" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 120 120" aria-hidden="true">
      <circle className="nr-mono-ring" cx="60" cy="60" r="56" fill="none" stroke="currentColor" strokeWidth="1" />
      <circle className="nr-mono-ring" cx="60" cy="60" r="50" fill="none" stroke="currentColor" strokeWidth="0.5" />
      <text x="60" y="78" textAnchor="middle" fill="currentColor" fontFamily="Italiana, serif" fontSize="56">
        B
      </text>
    </svg>
  );
}

/* -------- Static sections are memoised so live call updates never touch split text -------- */

const Hero = memo(function Hero({ onBegin }: { onBegin: () => void }) {
  return (
    <section className="nr-hero">
      <div className="nr-hero-media" data-reveal-img>
        <img src="/noir/portrait.jpg" alt="" data-parallax="0.15" />
      </div>
      <div className="nr-hero-copy">
        <p className="nr-eyebrow" data-fade>
          Private health concierge · By invitation
        </p>
        <h1 className="nr-hero-title" data-split-hero>
          The art
          <br />
          of living <em>longer.</em>
        </h1>
        <div className="nr-hero-foot" data-fade>
          <p>
            Ben is your personal longevity coach, present face to face whenever you need him. Discreet, precise and
            entirely yours.
          </p>
          <button type="button" className="nr-btn nr-btn-gold" data-magnetic data-cursor="Begin" onClick={onBegin}>
            <span>Begin a private consultation</span>
            <ArrowDownRight size={18} />
          </button>
        </div>
      </div>
      <div className="nr-scroll-cue" aria-hidden="true">
        <span>Scroll</span>
        <i />
      </div>
    </section>
  );
});

const Marquee = memo(function Marquee() {
  const words = ["Sleep", "Nourishment", "Recovery", "Mind", "Longevity", "Presence"];
  return (
    <div className="nr-marquee" aria-hidden="true">
      <div className="nr-marquee-track">
        {[0, 1].map((k) => (
          <span key={k}>
            {words.map((w) => (
              <span key={w}>
                {w}
                <i>✦</i>
              </span>
            ))}
          </span>
        ))}
      </div>
    </div>
  );
});

const Manifesto = memo(function Manifesto() {
  return (
    <section className="nr-manifesto">
      <span className="nr-label">The philosophy</span>
      <p data-split-words>
        True luxury is time. Ben listens closely, remembers what matters to you, and turns quiet, consistent choices into
        decades of vitality. No noise. No crowds. Only a coach who knows you.
      </p>
    </section>
  );
});

const Rituals = memo(function Rituals({ ask }: { ask: (text: string) => void }) {
  return (
    <div className="nr-rituals-wrap">
      <section className="nr-rituals" data-rituals>
        <div className="nr-rituals-track" data-rituals-track>
          <div className="nr-rituals-intro">
            <span className="nr-label">Four rituals</span>
            <h2>
              A practice
              <br />
              <em>for every hour.</em>
            </h2>
            <p>Select a ritual and Ben will open the conversation.</p>
          </div>
          {RITUALS.map((r) => (
            <article key={r.title} className="nr-ritual">
              <button type="button" className="nr-ritual-img" data-cursor="Ask Ben" onClick={() => ask(r.ask)}>
                <img src={r.img} alt="" loading="lazy" />
              </button>
              <div className="nr-ritual-meta">
                <span className="nr-ritual-n">{r.n}</span>
                <h3>{r.title}</h3>
              </div>
              <p className="nr-ritual-line">{r.line}</p>
              <p className="nr-ritual-copy">{r.copy}</p>
              <button type="button" className="nr-link" data-cursor="Ask" onClick={() => ask(r.ask)}>
                Discuss with Ben <ArrowUpRight size={16} />
              </button>
            </article>
          ))}
        </div>
      </section>
    </div>
  );
});

const Numbers = memo(function Numbers() {
  const items = [
    { value: 1, suffix: ":1", label: "A single coach, devoted to you" },
    { value: 24, suffix: "/7", label: "Present whenever you call" },
    { value: 98, suffix: "%", label: "Members who renew each year" },
    { value: 12, suffix: "", label: "Minutes a day, on average" },
  ];
  return (
    <section className="nr-numbers">
      {items.map((item) => (
        <div key={item.label} className="nr-number">
          <b>
            <span data-count={item.value}>{item.value}</span>
            {item.suffix}
          </b>
          <small>{item.label}</small>
        </div>
      ))}
    </section>
  );
});

const House = memo(function House() {
  return (
    <section className="nr-house">
      <div className="nr-house-img nr-house-a" data-reveal-img>
        <img src="/noir/water.jpg" alt="" data-parallax="0.12" loading="lazy" />
      </div>
      <div className="nr-house-copy">
        <span className="nr-label">The experience</span>
        <h2 data-split-lines>
          Composed in <em>silence,</em> delivered in person.
        </h2>
        <p>
          Every conversation is private and encrypted. Ben remembers your goals, your history and your preferences, so
          each consultation begins exactly where the last one ended.
        </p>
      </div>
      <div className="nr-house-img nr-house-b" data-reveal-img>
        <img src="/noir/portrait-shadow.jpg" alt="" data-parallax="0.18" loading="lazy" />
      </div>
    </section>
  );
});

/* ---------------------------- Live consultation ---------------------------- */

function Consultation({ ben }: { ben: Ben }) {
  const live = ben.status === "live";
  const lines = ben.transcript.slice(-3);
  const chips = [
    "Where should I begin?",
    "Review my sleep with me",
    "Build my longevity plan",
  ];
  return (
    <section className="nr-consult" id="nr-consult">
      <div className="nr-consult-head">
        <span className="nr-label">The consultation</span>
        <h2>
          Your coach,
          <br />
          <em>in private.</em>
        </h2>
      </div>
      <div className="nr-frame">
        <span className="nr-corner nr-c1" />
        <span className="nr-corner nr-c2" />
        <span className="nr-corner nr-c3" />
        <span className="nr-corner nr-c4" />
        <div className="nr-frame-inner">
          <BenEmbed theme="noir" />
        </div>
      </div>
      <div className="nr-consult-bar">
        <span className="nr-status" data-status={ben.status}>
          <i />
          {STATUS[ben.status]}
          {live && <em> · {ben.elapsed}</em>}
        </span>
        {live ? (
          <button type="button" className="nr-btn nr-btn-line" data-magnetic onClick={ben.end}>
            <PhoneOff size={16} /> <span>Conclude</span>
          </button>
        ) : (
          <button type="button" className="nr-btn nr-btn-gold" data-magnetic data-cursor="Begin" onClick={ben.start}>
            <span>Begin consultation</span>
          </button>
        )}
      </div>
      <div className="nr-transcript" aria-live="polite">
        {lines.length === 0 ? (
          <div className="nr-chips">
            {chips.map((c) => (
              <button key={c} type="button" data-cursor="Ask" onClick={() => ben.ask(c)}>
                {c}
              </button>
            ))}
          </div>
        ) : (
          lines.map((l) => (
            <p key={l.id} data-role={l.role}>
              <span>{l.role === "replica" ? "Ben" : "You"}</span>
              {l.speech}
            </p>
          ))
        )}
      </div>
    </section>
  );
}

/* ---------------------------------- Page ---------------------------------- */

export function Noir() {
  const ben = useBen();
  const rootRef = useRef<HTMLDivElement>(null);
  const { start, ask } = ben;

  const begin = useCallback(() => {
    document.getElementById("nr-consult")?.scrollIntoView({ behavior: "smooth", block: "center" });
    start();
  }, [start]);

  const askBen = useCallback(
    (text: string) => {
      document.getElementById("nr-consult")?.scrollIntoView({ behavior: "smooth", block: "center" });
      ask(text);
    },
    [ask],
  );

  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const finePointer = window.matchMedia("(pointer: fine)").matches;
    let cancelled = false;

    // The shared stage fades in with a transform animation that stays applied (fill: both),
    // which turns it into the containing block for position: fixed. Noir relies on fixed
    // layers (nav, cursor, curtain) and ScrollTrigger pinning, so drop that animation here;
    // Noir's own curtain covers the entrance anyway. The stage is recreated per direction.
    const stage = root.closest<HTMLElement>(".theme-stage");
    if (stage) stage.style.animation = "none";

    // Smooth scroll, driven by GSAP's ticker so ScrollTrigger stays in sync.
    let lenis: Lenis | null = null;
    const raf = (time: number) => lenis?.raf(time * 1000);
    if (!reduced) {
      lenis = new Lenis({
        lerp: 0.09,
        prevent: (node) => Boolean(node.closest?.(".switcher-sheet, tavus-embed")),
      });
      lenis.on("scroll", ScrollTrigger.update);
      gsap.ticker.add(raf);
      gsap.ticker.lagSmoothing(0);
    }

    const ctx = gsap.context(() => {
      const curtain = root.querySelector<HTMLElement>(".nr-curtain");

      if (reduced) {
        if (curtain) gsap.set(curtain, { display: "none" });
        return;
      }

      // 1. Intro curtain: monogram draws, counter runs, panels lift.
      const intro = gsap.timeline({ defaults: { ease: "power3.inOut" } });
      intro
        .fromTo(".nr-curtain .nr-mono-ring", { strokeDasharray: 360, strokeDashoffset: 360 }, { strokeDashoffset: 0, duration: 1.1, stagger: 0.15 })
        .from(".nr-curtain text", { opacity: 0, y: 8, duration: 0.6 }, "-=0.7")
        .to(".nr-curtain-count", { innerText: 100, snap: { innerText: 1 }, duration: 1.2, ease: "power1.inOut" }, 0)
        .to(".nr-curtain-inner", { opacity: 0, y: -20, duration: 0.5 }, "+=0.1")
        .to(".nr-curtain-panel", { yPercent: -100, duration: 0.9, stagger: 0.08, ease: "expo.inOut" }, "-=0.2")
        .set(curtain, { display: "none" });

      // 2. Hero: split characters rise out of their line masks.
      void document.fonts.ready.then(() => {
        if (cancelled) return;
        ctx.add(() => {
          const heroTitle = root.querySelector("[data-split-hero]");
          if (heroTitle) {
            const split = SplitText.create(heroTitle, { type: "lines,chars", mask: "lines", linesClass: "nrline" });
            gsap.from(split.chars, { yPercent: 120, rotate: 6, duration: 1.2, stagger: 0.025, ease: "expo.out", delay: 2.3 });
          }
          root.querySelectorAll("[data-split-lines]").forEach((el) => {
            const split = SplitText.create(el, { type: "lines", mask: "lines", linesClass: "nrline" });
            gsap.from(split.lines, {
              yPercent: 110,
              duration: 1.1,
              stagger: 0.1,
              ease: "expo.out",
              scrollTrigger: { trigger: el, start: "top 85%", once: true },
            });
          });
          // Word-by-word light-up while scrolling through the manifesto.
          root.querySelectorAll("[data-split-words]").forEach((el) => {
            const split = SplitText.create(el, { type: "words" });
            gsap.fromTo(
              split.words,
              { opacity: 0.14 },
              { opacity: 1, stagger: 0.1, ease: "none", scrollTrigger: { trigger: el, start: "top 80%", end: "bottom 45%", scrub: true } },
            );
          });
          ScrollTrigger.refresh();
        });
      });

      gsap.from("[data-fade]", { opacity: 0, y: 24, duration: 1, stagger: 0.12, ease: "power3.out", delay: 2.7 });
      gsap.from(".nr-nav", { opacity: 0, y: -16, duration: 1, ease: "power3.out", delay: 2.5 });

      // 3. Clip-path image reveals + parallax.
      gsap.utils.toArray<HTMLElement>("[data-reveal-img]").forEach((el, i) => {
        const isHero = el.classList.contains("nr-hero-media");
        gsap.fromTo(
          el,
          { clipPath: "inset(100% 0% 0% 0%)" },
          {
            clipPath: "inset(0% 0% 0% 0%)",
            duration: 1.6,
            ease: "expo.inOut",
            delay: isHero ? 1.9 : 0,
            scrollTrigger: isHero ? undefined : { trigger: el, start: "top 85%", once: true },
          },
        );
        const img = el.querySelector("img");
        if (img) gsap.fromTo(img, { scale: 1.25 }, { scale: 1, duration: 2.2, ease: "expo.out", delay: isHero ? 1.9 : 0.1 * i });
      });
      gsap.utils.toArray<HTMLElement>("[data-parallax]").forEach((img) => {
        const amount = Number(img.dataset.parallax ?? 0.1) * 100;
        gsap.to(img, {
          yPercent: amount,
          ease: "none",
          scrollTrigger: { trigger: img.parentElement, start: "top bottom", end: "bottom top", scrub: true },
        });
      });

      // 4. Marquee: endless drift that skews with scroll velocity.
      const track = root.querySelector(".nr-marquee-track");
      if (track) {
        const loop = gsap.to(track, { xPercent: -50, duration: 38, ease: "none", repeat: -1 });
        const skew = gsap.quickTo(track, "skewX", { duration: 0.4, ease: "power3" });
        ScrollTrigger.create({
          onUpdate: (self) => {
            const v = gsap.utils.clamp(-12, 12, self.getVelocity() / -250);
            skew(v);
            loop.timeScale(1 + Math.abs(v) / 3);
          },
        });
      }

      // 5. Pinned horizontal rituals (desktop); vertical stack on small screens.
      const mm = gsap.matchMedia();
      mm.add("(min-width: 900px)", () => {
        const section = root.querySelector<HTMLElement>("[data-rituals]");
        const rtrack = root.querySelector<HTMLElement>("[data-rituals-track]");
        if (!section || !rtrack) return;
        const distance = () => rtrack.scrollWidth - window.innerWidth;
        gsap.to(rtrack, {
          x: () => -distance(),
          ease: "none",
          scrollTrigger: {
            trigger: section,
            start: "top top",
            end: () => `+=${distance()}`,
            pin: true,
            scrub: 1,
            invalidateOnRefresh: true,
          },
        });
      });

      // 6. Counters.
      gsap.utils.toArray<HTMLElement>("[data-count]").forEach((el) => {
        gsap.from(el, {
          innerText: 0,
          snap: { innerText: 1 },
          duration: 2,
          ease: "power2.out",
          scrollTrigger: { trigger: el, start: "top 90%", once: true },
        });
      });

      // 7. Section headings fade up.
      gsap.utils.toArray<HTMLElement>(".nr-consult-head, .nr-rituals-intro, .nr-frame, .nr-numbers, .nr-footer-big").forEach((el) => {
        gsap.from(el, { opacity: 0, y: 50, duration: 1.2, ease: "power3.out", scrollTrigger: { trigger: el, start: "top 88%", once: true } });
      });
    }, root);

    // 8. Custom cursor + magnetic buttons (fine pointers only).
    const cleanups: (() => void)[] = [];
    if (finePointer && !reduced) {
      const dot = root.querySelector<HTMLElement>(".nr-cursor");
      const label = root.querySelector<HTMLElement>(".nr-cursor-label");
      if (dot && label) {
        root.classList.add("nr-has-cursor");
        const xTo = gsap.quickTo(dot, "x", { duration: 0.35, ease: "power3" });
        const yTo = gsap.quickTo(dot, "y", { duration: 0.35, ease: "power3" });
        const onMove = (e: PointerEvent) => {
          xTo(e.clientX);
          yTo(e.clientY);
          const el = e.target as HTMLElement | null;
          // Ben's video and the direction switcher sit outside the effect: they keep the system pointer.
          if (el?.closest("tavus-embed, .switcher, .switcher-sheet")) {
            dot.dataset.state = "off";
            label.textContent = "";
            return;
          }
          const target = el?.closest<HTMLElement>("[data-cursor], button, a");
          const text = target?.dataset.cursor ?? "";
          dot.dataset.state = target ? (text ? "label" : "hover") : "";
          label.textContent = text;
        };
        const onOut = (e: MouseEvent) => {
          if (!e.relatedTarget) dot.dataset.state = "off";
        };
        window.addEventListener("pointermove", onMove);
        document.addEventListener("mouseout", onOut);
        cleanups.push(() => {
          window.removeEventListener("pointermove", onMove);
          document.removeEventListener("mouseout", onOut);
        });
      }
      root.querySelectorAll<HTMLElement>("[data-magnetic]").forEach((el) => {
        const onMove = (e: PointerEvent) => {
          const r = el.getBoundingClientRect();
          gsap.to(el, { x: (e.clientX - r.left - r.width / 2) * 0.3, y: (e.clientY - r.top - r.height / 2) * 0.4, duration: 0.5, ease: "power3.out" });
        };
        const onLeave = () => gsap.to(el, { x: 0, y: 0, duration: 0.9, ease: "elastic.out(1, 0.4)" });
        el.addEventListener("pointermove", onMove);
        el.addEventListener("pointerleave", onLeave);
        cleanups.push(() => {
          el.removeEventListener("pointermove", onMove);
          el.removeEventListener("pointerleave", onLeave);
        });
      });
    }

    return () => {
      cancelled = true;
      cleanups.forEach((fn) => fn());
      root.classList.remove("nr-has-cursor");
      ctx.revert();
      gsap.ticker.remove(raf);
      lenis?.destroy();
    };
  }, []);

  return (
    <div className="nr" ref={rootRef}>
      <div className="nr-curtain" aria-hidden="true">
        <div className="nr-curtain-panel" />
        <div className="nr-curtain-panel" />
        <div className="nr-curtain-inner">
          <Monogram className="nr-curtain-mono" />
          <span>
            <b className="nr-curtain-count">0</b>
          </span>
        </div>
      </div>

      <div className="nr-cursor" aria-hidden="true">
        <span className="nr-cursor-label" />
      </div>
      <div className="nr-ambience" aria-hidden="true">
        <span className="nr-glow nr-glow-a" />
        <span className="nr-dust nr-dust-a" />
        <span className="nr-dust nr-dust-b" />
      </div>
      <div className="nr-grain" aria-hidden="true" />

      <header className="nr-nav">
        <a href="#noir" className="nr-brand">
          <Monogram className="nr-brand-mono" />
          <span>
            Ben <i>Private</i>
          </span>
        </a>
        <nav aria-label="Main">
          <a href="#noir" onClick={(e) => e.preventDefault()}>
            Rituals
          </a>
          <a href="#noir" onClick={(e) => e.preventDefault()}>
            Experience
          </a>
          <a href="#noir" onClick={(e) => e.preventDefault()}>
            Membership
          </a>
        </nav>
        <button type="button" className="nr-btn nr-btn-line nr-btn-sm" data-magnetic onClick={begin}>
          <span>Request audience</span>
        </button>
      </header>

      <Hero onBegin={begin} />
      <Marquee />
      <Manifesto />
      <Rituals ask={askBen} />
      <House />
      <Consultation ben={ben} />
      <Numbers />

      <footer className="nr-footer">
        <div className="nr-footer-big">
          Ben<span>.</span>
        </div>
        <div className="nr-footer-row">
          <span>Private health concierge</span>
          <span>Ben coaches; he does not diagnose. In an emergency, call your local emergency number.</span>
          <span>© 2026</span>
        </div>
      </footer>
    </div>
  );
}
