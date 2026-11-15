import {
  ArrowRight,
  ArrowUpRight,
  HeartPulse,
  Leaf,
  Lock,
  Moon,
  MessageCircleHeart,
  ShieldCheck,
  Sparkles,
  Star,
  Stethoscope,
} from "lucide-react";
import { BenEmbed } from "../ben/BenEmbed.tsx";
import { useBen, type BenStatus } from "../ben/useBen.ts";
import "./serene.css";

const FOCUS = [
  { title: "Restful sleep", copy: "Wind-down rituals that actually stick.", img: "/img/sleep.jpg", ask: "Can you help me sleep better? I keep waking up at night." },
  { title: "Nourishing food", copy: "Simple swaps, no strict diets.", img: "/img/bowl.jpg", ask: "What is one easy change I could make to eat healthier this week?" },
  { title: "Gentle movement", copy: "Move more, in ways you enjoy.", img: "/img/run-sunrise.jpg", ask: "I want to move more but I hate the gym. Where do I start?" },
  { title: "Calmer mind", copy: "Breathing and reset moments.", img: "/img/meditate-log.jpg", ask: "I feel stressed lately. Can you guide me through a short breathing exercise?" },
];

const MEET_PROMPTS = [
  "I want more energy during the day",
  "Help me build a calmer evening routine",
  "Where should I start with eating better?",
];

function LeafMark() {
  return (
    <svg viewBox="0 0 32 32" width="30" height="30" aria-hidden="true">
      <circle cx="16" cy="16" r="16" fill="currentColor" />
      <path d="M10 22c0-7 4.5-12 12-12 0 7.5-5 12-12 12Z" fill="#F4EFE6" />
      <path d="m10 22 7-7" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
    </svg>
  );
}

function statusText(status: BenStatus, elapsed: string) {
  switch (status) {
    case "loading":
      return "Ben is getting ready…";
    case "ready":
      return "Ben is available now";
    case "connecting":
      return "Connecting you to Ben…";
    case "live":
      return `In session · ${elapsed}`;
    case "ended":
      return "Session complete";
    case "unavailable":
      return "Ben is busy, try again soon";
  }
}

export function Serene() {
  const ben = useBen();
  const live = ben.status === "live";

  const scrollToBen = () => document.getElementById("sr-ben")?.scrollIntoView({ behavior: "smooth", block: "center" });
  const talk = () => {
    scrollToBen();
    if (live) return;
    ben.start();
  };
  const askAbout = (text: string) => {
    scrollToBen();
    ben.ask(text);
  };

  return (
    <div className="sr">
      <header className="sr-nav">
        <a className="sr-logo" href="#serene">
          <LeafMark />
          <span>
            ben<em>.</em>
          </span>
        </a>
        <nav className="sr-links" aria-label="Main">
          <a href="#sr-how">How it works</a>
          <a href="#sr-focus">What Ben helps with</a>
          <a href="#sr-stories">Stories</a>
          <a href="#sr-trust">Privacy</a>
        </nav>
        <button type="button" className="sr-btn sr-btn-dark sr-btn-sm" onClick={talk}>
          Talk to Ben <ArrowUpRight size={16} />
        </button>
      </header>

      <section className="sr-hero">
        <div className="sr-hero-copy">
          <span className="sr-eyebrow">
            <span className="sr-pulse-dot" /> Your AI health coach · face to face, 24/7
          </span>
          <h1>
            Feel better, <em>one conversation</em> at a time.
          </h1>
          <p className="sr-lede">
            Ben is a coach you can actually talk to. He listens, remembers what matters to you, and turns small steps
            into lasting habits for sleep, food, movement and stress.
          </p>
          <div className="sr-cta-row">
            <button type="button" className="sr-btn sr-btn-dark" onClick={talk}>
              Start a free session <ArrowRight size={18} />
            </button>
            <a className="sr-btn sr-btn-ghost" href="#sr-how">
              See how it works
            </a>
          </div>
          <div className="sr-proof">
            <div className="sr-faces">
              <img src="/img/videocall.jpg" alt="" />
              <img src="/img/run-sunrise.jpg" alt="" />
              <img src="/img/meditate.jpg" alt="" />
              <img src="/img/videocall-wave.jpg" alt="" />
            </div>
            <div>
              <div className="sr-stars" aria-label="Rated 4.9 out of 5">
                {[0, 1, 2, 3, 4].map((i) => (
                  <Star key={i} size={14} fill="currentColor" strokeWidth={0} />
                ))}
                <b>4.9</b>
              </div>
              <small>Loved by 12,000+ members</small>
            </div>
          </div>
        </div>

        <div className="sr-hero-visual">
          <span className="sr-hero-sheet" aria-hidden="true" />
          <figure className="sr-hero-photo">
            <div className="sr-hero-shot">
              <img src="/img/hero-call.jpg" alt="A smiling middle-aged man giving a thumbs-up to his coach on a laptop video call" />
              <span className="sr-hero-live">
                <span className="sr-pulse-dot" /> Live with Ben
              </span>
            </div>
            <figcaption className="sr-hero-bar">
              <span>
                <b>Morning check-in</b>
                <small>Sleep · stress · one small step</small>
              </span>
              <span className="sr-hero-time">07:15</span>
            </figcaption>
          </figure>
          <div className="sr-float sr-float-a">
            <span className="sr-float-icon sr-sage">
              <Moon size={18} />
            </span>
            <div>
              <small>Sleep this day</small>
              <b>
                7h 42m <i>+38m</i>
              </b>
            </div>
          </div>
          <div className="sr-float sr-float-b">
            <span className="sr-float-icon sr-clay">
              <HeartPulse size={18} />
            </span>
            <div>
              <small>Resting heart rate</small>
              <b>62 bpm</b>
            </div>
            <svg className="sr-spark" viewBox="0 0 80 28" aria-hidden="true">
              <path d="M0 20 C10 18 14 8 22 12 S36 22 44 14 58 4 66 10 76 8 80 6" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            </svg>
          </div>
        </div>
      </section>

      <section className="sr-meet" id="sr-ben" aria-label="Talk to Ben">
        <div className="sr-ben-card">
          <div className="sr-ben-frame">
            <BenEmbed theme="serene" />
          </div>
          <div className="sr-ben-status" data-status={ben.status}>
            <span className="sr-status-dot" />
            {statusText(ben.status, ben.elapsed)}
            {live && (
              <button type="button" className="sr-link-btn" onClick={ben.end}>
                End
              </button>
            )}
          </div>
        </div>
        <div className="sr-meet-copy">
          <span className="sr-kicker">Meet Ben</span>
          <h2>
            Talk it through, <em>face to face</em>.
          </h2>
          <p>
            Press start and Ben greets you by video. Speak naturally; he listens, asks one gentle question at a time and
            helps you leave with one small step.
          </p>
          <div className="sr-meet-prompts">
            {MEET_PROMPTS.map((prompt) => (
              <button type="button" key={prompt} onClick={() => askAbout(prompt)}>
                <MessageCircleHeart size={16} /> {prompt}
              </button>
            ))}
          </div>
          <small className="sr-meet-note">
            <Lock size={14} /> Private by design. Nothing is shared without your say-so.
          </small>
        </div>
      </section>

      <section className="sr-marquee" aria-label="Coaching methods">
        <span>Coaching grounded in</span>
        <b>Habit science</b>
        <b>Motivational interviewing</b>
        <b>CBT for insomnia</b>
        <b>Mindfulness-based stress reduction</b>
      </section>

      <section className="sr-section" id="sr-focus">
        <div className="sr-section-head">
          <span className="sr-kicker">What Ben helps with</span>
          <h2>
            Gentle guidance for the <em>whole you</em>.
          </h2>
          <p>Tap a card and Ben starts the conversation right there.</p>
        </div>
        <div className="sr-focus-grid">
          {FOCUS.map((item) => (
            <button type="button" key={item.title} className="sr-focus" onClick={() => askAbout(item.ask)}>
              <img src={item.img} alt="" loading="lazy" />
              <span className="sr-focus-shade" />
              <span className="sr-focus-text">
                <b>{item.title}</b>
                <small>{item.copy}</small>
              </span>
              <span className="sr-focus-cta">
                <MessageCircleHeart size={16} /> Ask Ben
              </span>
            </button>
          ))}
        </div>
      </section>

      <section className="sr-section sr-how" id="sr-how">
        <div className="sr-section-head">
          <span className="sr-kicker">How it works</span>
          <h2>
            Three steps. <em>No forms, no waiting rooms.</em>
          </h2>
        </div>
        <ol className="sr-steps">
          <li>
            <span className="sr-num">01</span>
            <h3>Say hello</h3>
            <p>Press start and talk to Ben face to face, from any device. No app to install.</p>
            <svg viewBox="0 0 120 40" aria-hidden="true">
              <path d="M2 30c20 0 20-20 40-20s20 20 40 20 20-20 36-20" fill="none" stroke="currentColor" strokeWidth="1.5" />
            </svg>
          </li>
          <li>
            <span className="sr-num">02</span>
            <h3>Share what matters</h3>
            <p>Ben listens for how you feel, not just what you say, and asks one thoughtful question at a time.</p>
            <svg viewBox="0 0 120 40" aria-hidden="true">
              <circle cx="20" cy="20" r="10" fill="none" stroke="currentColor" strokeWidth="1.5" />
              <circle cx="60" cy="20" r="14" fill="none" stroke="currentColor" strokeWidth="1.5" />
              <circle cx="100" cy="20" r="10" fill="none" stroke="currentColor" strokeWidth="1.5" />
            </svg>
          </li>
          <li>
            <span className="sr-num">03</span>
            <h3>Leave with one step</h3>
            <p>Every session ends with a small, doable action. Ben remembers it and checks in next time.</p>
            <svg viewBox="0 0 120 40" aria-hidden="true">
              <path d="M4 34 40 22 70 26 116 6" fill="none" stroke="currentColor" strokeWidth="1.5" />
              <circle cx="116" cy="6" r="4" fill="currentColor" />
            </svg>
          </li>
        </ol>
      </section>

      <section className="sr-section sr-story" id="sr-stories">
        <div className="sr-story-img">
          <img src="/img/yoga-senior.jpg" alt="Smiling woman stretching on a yoga mat" loading="lazy" />
          <span className="sr-story-badge">
            <Sparkles size={16} /> 9 months with Ben
          </span>
        </div>
        <figure className="sr-quote">
          <Leaf className="sr-quote-leaf" size={28} />
          <blockquote>
            “It feels like talking to someone who truly gets me. Ben noticed I was exhausted before I did, and now I
            sleep through the night for the first time in years.”
          </blockquote>
          <figcaption>
            <b>Helen R.</b>, 61 · retired teacher
          </figcaption>
          <div className="sr-stats">
            <div>
              <b>87%</b>
              <small>sleep better within 4 weeks</small>
            </div>
            <div>
              <b>3×</b>
              <small>more likely to keep a habit</small>
            </div>
            <div>
              <b>&lt;1s</b>
              <small>to start talking, any time</small>
            </div>
          </div>
        </figure>
      </section>

      <section className="sr-section sr-trust" id="sr-trust">
        {[
          { icon: <Stethoscope size={22} />, t: "Designed with clinicians", c: "Coaching grounded in behavioural science and reviewed by medical advisors." },
          { icon: <Lock size={22} />, t: "Private by design", c: "Encrypted conversations. Your data is never sold or used for ads." },
          { icon: <ShieldCheck size={22} />, t: "Knows its limits", c: "Ben coaches, he doesn't diagnose, and points you to care when it matters." },
        ].map((item) => (
          <div key={item.t} className="sr-trust-item">
            <span className="sr-trust-icon">{item.icon}</span>
            <h3>{item.t}</h3>
            <p>{item.c}</p>
          </div>
        ))}
      </section>

      <section className="sr-final">
        <img src="/img/monstera.jpg" alt="" loading="lazy" />
        <div className="sr-final-inner">
          <h2>
            Your next good habit <em>starts with hello.</em>
          </h2>
          <button type="button" className="sr-btn sr-btn-light" onClick={talk}>
            Talk to Ben now <ArrowRight size={18} />
          </button>
        </div>
      </section>

      <footer className="sr-footer">
        <span className="sr-logo">
          <LeafMark />
          <span>
            ben<em>.</em>
          </span>
        </span>
        <small>Ben is a wellness coach, not a medical provider. In an emergency, call your local emergency number.</small>
      </footer>
    </div>
  );
}
