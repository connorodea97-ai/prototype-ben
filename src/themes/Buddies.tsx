import { useEffect, useRef, useState, type CSSProperties } from "react";
import "@fontsource/bangers/400.css";
import "@fontsource/comic-neue/400.css";
import "@fontsource/comic-neue/700.css";
import { BenEmbed } from "../ben/BenEmbed.tsx";
import { useBen, type BenStatus } from "../ben/useBen.ts";
import "./buddies.css";

const E = (name: string) => `/buddies/${name}`;

const POWERS = [
  { id: "water", title: "Water Power", img: E("droplet.png"), color: "blue", sfx: "SPLASH!", ask: "Ben, why is drinking water a super power? Can you give me a fun water challenge?" },
  { id: "veggie", title: "Veggie Power", img: E("broccoli.webp"), color: "green", sfx: "CRUNCH!", ask: "Ben, which veggies give me super powers? Tell me a fun way to eat more of them!" },
  { id: "sleep", title: "Sleep Power", img: E("sleeping.webp"), color: "purple", sfx: "ZZZ!", ask: "Ben, why do heroes need sleep? Can you help me with a bedtime routine?" },
  { id: "brush", title: "Brushing Power", img: E("tooth.png"), color: "white", sfx: "SPARKLE!", ask: "Ben, how do I brush my teeth like a superhero? How long should I brush?" },
  { id: "move", title: "Move Power", img: E("soccer.webp"), color: "red", sfx: "ZOOM!", ask: "Ben, can you give me a super fun move-your-body challenge right now?" },
  { id: "feel", title: "Feelings Power", img: E("hug.webp"), color: "yellow", sfx: "HUG!", ask: "Ben, what can I do when I feel a big feeling like being angry or sad?" },
];

const FEELINGS = [
  { id: "happy", label: "Happy", img: E("smile.webp") },
  { id: "excited", label: "Excited", img: E("starstruck.webp") },
  { id: "silly", label: "Silly", img: E("zany.webp") },
  { id: "sad", label: "Sad", img: E("sad.webp") },
  { id: "angry", label: "Angry", img: E("angry.webp") },
  { id: "scared", label: "Scared", img: E("scared.webp") },
];

const BALLOON: Record<BenStatus, string> = {
  loading: "Hang on, I'm putting on my cape…",
  ready: "Hi, hero! Press the big button to talk to me!",
  connecting: "Flying over to you… WHOOSH!",
  live: "I'm listening, hero!",
  ended: "That was AWESOME! Come back soon!",
  unavailable: "Oops, I'm on another mission. Try again soon!",
};

const STAR_GOAL = 10;

export function Buddies() {
  const ben = useBen();
  const live = ben.status === "live";
  const [stars, setStars] = useState(3);
  const [feeling, setFeeling] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const [burst, setBurst] = useState<{ id: string; sfx: string } | null>(null);
  const timers = useRef<number[]>([]);

  useEffect(() => {
    const pending = timers.current;
    return () => pending.forEach((t) => window.clearTimeout(t));
  }, []);

  const later = (fn: () => void, ms: number) => {
    timers.current.push(window.setTimeout(fn, ms));
  };

  const flash = (text: string) => {
    setToast(text);
    later(() => setToast(null), 2200);
  };

  const toPanel = () => document.getElementById("bd-hero")?.scrollIntoView({ behavior: "smooth", block: "center" });

  const choosePower = (power: (typeof POWERS)[number]) => {
    setBurst({ id: power.id, sfx: power.sfx });
    later(() => setBurst(null), 700);
    toPanel();
    ben.ask(power.ask);
  };

  const didIt = (power: (typeof POWERS)[number]) => {
    const next = Math.min(STAR_GOAL, stars + 1);
    setStars(next);
    flash(next === STAR_GOAL ? "WOW! 10 stars! You're a SUPER HERO!" : `+1 star for ${power.title}!`);
    ben.share(`The child just earned a star for "${power.title}" and now has ${next} of ${STAR_GOAL} stars. Cheer them on briefly.`);
  };

  const pickFeeling = (f: (typeof FEELINGS)[number]) => {
    setFeeling(f.id);
    const told = ben.share(
      `The child tapped the feelings wheel and says they feel "${f.label}". Respond kindly and simply; if the feeling is hard, help them name it and take a calm breath.`,
    );
    flash(told ? `Ben knows you feel ${f.label.toLowerCase()}!` : `Thanks for sharing! Tell Ben you feel ${f.label.toLowerCase()}!`);
  };

  const lastLines = ben.transcript.slice(-4);

  return (
    <div className="bd">
      <header className="bd-cover">
        <div className="bd-issue">
          <b>No. 1</b>
          <span>KIDS' EDITION</span>
        </div>
        <h1 className="bd-logo" aria-label="Ben and Buddies">
          <span className="bd-logo-1">BEN</span>
          <span className="bd-logo-amp">&amp;</span>
          <span className="bd-logo-2">BUDDIES</span>
        </h1>
        <p className="bd-tag">The Super Healthy Adventures!</p>
        <div className="bd-stars-mini" aria-label={`${stars} stars`}>
          <img src={E("star.webp")} alt="" /> {stars}
        </div>
      </header>

      <main className="bd-page">
        <section className="bd-panel bd-hero" id="bd-hero">
          <div className="bd-caption bd-caption-tl">Starring BEN, your health hero!</div>
          <div className="bd-hero-frame">
            <BenEmbed theme="buddies" />
          </div>
          <div className="bd-sfx bd-sfx-pow" aria-hidden="true">
            POW!
          </div>
          {burst && (
            <div className="bd-sfx bd-sfx-burst" key={burst.id} aria-hidden="true">
              {burst.sfx}
            </div>
          )}
          <div className="bd-hero-bar">
            <div className="bd-balloon bd-balloon-status" data-status={ben.status}>
              {BALLOON[ben.status]}
              {live && <b className="bd-timer">{ben.elapsed}</b>}
            </div>
            {live ? (
              <button type="button" className="bd-btn bd-btn-blue" onClick={ben.end}>
                Bye, Ben!
              </button>
            ) : (
              <button type="button" className="bd-btn" onClick={ben.start} disabled={ben.status === "loading"}>
                <img src={E("rocket.webp")} alt="" /> Let's go!
              </button>
            )}
          </div>
        </section>

        <section className="bd-panel bd-talk">
          <div className="bd-caption">Meanwhile, in the chat…</div>
          {lastLines.length === 0 ? (
            <div className="bd-talk-empty">
              <img src={E("wave.webp")} alt="" />
              <div className="bd-balloon">
                Pick a <b>SUPER POWER</b> below and I'll teach you a cool trick!
              </div>
            </div>
          ) : (
            <ol className="bd-lines">
              {lastLines.map((line) => (
                <li key={line.id} className="bd-balloon" data-role={line.role}>
                  <small>{line.role === "replica" ? "BEN" : "YOU"}</small>
                  {line.speech}
                </li>
              ))}
            </ol>
          )}
        </section>

        <section className="bd-panel bd-feel">
          <div className="bd-caption">How do you feel today?</div>
          <div className="bd-wheel">
            {FEELINGS.map((f, i) => (
              <button
                key={f.id}
                type="button"
                className="bd-feeling"
                style={{ "--i": i } as CSSProperties}
                aria-pressed={feeling === f.id}
                onClick={() => pickFeeling(f)}
              >
                <img src={f.img} alt="" />
                <span>{f.label}</span>
              </button>
            ))}
            <div className="bd-wheel-hub">
              <img src={E("heart.webp")} alt="" />
              <span>All feelings are OK!</span>
            </div>
          </div>
        </section>

        <section className="bd-powers">
          <h2 className="bd-h2">
            <img src={E("muscle.webp")} alt="" /> Choose your SUPER POWER!
          </h2>
          <div className="bd-power-grid">
            {POWERS.map((p) => (
              <article key={p.id} className="bd-power" data-color={p.color}>
                <button type="button" className="bd-power-main" onClick={() => choosePower(p)}>
                  <img src={p.img} alt="" />
                  <b>{p.title}</b>
                  <span>Ask Ben how!</span>
                </button>
                <button type="button" className="bd-did" onClick={() => didIt(p)}>
                  <img src={E("star.webp")} alt="" /> I did it!
                </button>
              </article>
            ))}
          </div>
        </section>

        <section className="bd-panel bd-chart">
          <div className="bd-caption">My Star Chart</div>
          <div className="bd-star-row">
            {Array.from({ length: STAR_GOAL }, (_, i) => (
              <span key={i} className="bd-star" data-on={i < stars || undefined}>
                {i < stars ? <img src={E("star.webp")} alt="" /> : i + 1}
              </span>
            ))}
          </div>
          <div className="bd-progress">
            <span style={{ width: `${(stars / STAR_GOAL) * 100}%` }} />
          </div>
          <p>
            {stars >= STAR_GOAL ? (
              <>
                <img className="bd-inline" src={E("party.webp")} alt="" /> You did it! Super hero unlocked!
              </>
            ) : (
              <>
                <b>{STAR_GOAL - stars}</b> more stars to unlock your <b>Super Hero Badge</b>!
              </>
            )}
          </p>
          <button type="button" className="bd-reset" onClick={() => setStars(0)}>
            Start a new chart
          </button>
        </section>

        <section className="bd-panel bd-grownups">
          <div className="bd-caption bd-caption-blue">A note for grown-ups</div>
          <p>
            Ben is a friendly AI coach that teaches healthy habits through play: water, food, sleep, brushing, moving and
            naming feelings. He is not a doctor and never gives medical advice to children. If something sounds
            worrying, he asks the child to tell a trusted adult.
          </p>
          <p>We recommend a grown-up stays nearby during calls. Camera and microphone are only used while talking to Ben.</p>
        </section>
      </main>

      <footer className="bd-end">
        <span>To be continued…</span>
        <img src={E("sparkles.webp")} alt="" />
      </footer>

      {toast && (
        <div className="bd-toast" role="status">
          <img src={E("star.webp")} alt="" />
          {toast}
        </div>
      )}
    </div>
  );
}
