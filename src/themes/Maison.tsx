import "@fontsource-variable/bodoni-moda";
import "@fontsource-variable/bodoni-moda/wght-italic.css";
import "@fontsource-variable/jost";
import { useEffect, useRef, useState } from "react";
import { ArrowRight, ArrowUpRight, Menu, PhoneOff } from "lucide-react";
import { BenEmbed } from "../ben/BenEmbed.tsx";
import { useBen, type BenStatus } from "../ben/useBen.ts";
import "./maison.css";

interface StayItem {
  time: string;
  title: string;
  copy: string;
  img: string;
  ask: string;
}

const STAY: { day: string; theme: string; items: StayItem[] }[] = [
  {
    day: "I",
    theme: "Arrive & unwind",
    items: [
      { time: "07:00", title: "Sunrise swim", copy: "Twenty slow lengths as the terrace warms.", img: "/maison/pool-sunset.jpg", ask: "What's the best way to start my morning at the resort?" },
      { time: "09:30", title: "Botanical breakfast", copy: "Pressed juices, seasonal fruit, slow conversation.", img: "/maison/robe-juice.jpg", ask: "What should I eat for breakfast to feel energised all day?" },
      { time: "14:00", title: "Hot stone ritual", copy: "Ninety minutes of warmth to release the journey.", img: "/maison/stones.jpg", ask: "How does a hot stone massage help recovery?" },
      { time: "18:00", title: "Petal bath", copy: "Magnesium salts, chamomile and garden flowers.", img: "/maison/bath-petals.jpg", ask: "Help me build a relaxing evening bath ritual at home." },
      { time: "21:30", title: "Sleep ceremony", copy: "Linen turned down, lights low, phone away.", img: "/maison/towels.jpg", ask: "How can I sleep deeply tonight?" },
    ],
  },
  {
    day: "II",
    theme: "Restore",
    items: [
      { time: "07:30", title: "Garden breathwork", copy: "Guided breathing under the palms.", img: "/maison/palm-shadow.jpg", ask: "Guide me through a short breathing practice." },
      { time: "10:00", title: "Longevity consultation", copy: "A private conversation with Ben about your goals.", img: "/maison/spa-room.jpg", ask: "Let's talk about my long-term health goals." },
      { time: "15:00", title: "Infinity pool hour", copy: "Unhurried laps, then shade and mineral water.", img: "/maison/pool-tropical.jpg", ask: "What kind of movement is best on a recovery day?" },
      { time: "19:30", title: "Candlelit supper", copy: "A menu composed for steady, restful energy.", img: "/maison/bath-tray.jpg", ask: "What makes a good dinner for better sleep?" },
    ],
  },
  {
    day: "III",
    theme: "Renew & return",
    items: [
      { time: "06:45", title: "Ocean sunrise", copy: "Coffee on the terrace as the sky turns rose.", img: "/maison/pool-maldives.jpg", ask: "How do I keep this feeling of calm when I get home?" },
      { time: "11:00", title: "Signature massage", copy: "A full-body ritual to carry you home lighter.", img: "/maison/spa-table.jpg", ask: "How often should I make time for recovery?" },
      { time: "16:00", title: "Your plan with Ben", copy: "Three small habits to take home with you.", img: "/maison/towels.jpg", ask: "Give me three small habits to keep after my stay." },
    ],
  },
];

const MENU: { title: string; items: { name: string; note: string; time: string; ask: string }[] }[] = [
  {
    title: "Rituals of Rest",
    items: [
      { name: "The Deep Sleep Ritual", note: "warm oil, lavender, guided wind-down", time: "75 min", ask: "Tell me about building a deep sleep ritual." },
      { name: "Moonlight Bath", note: "magnesium, chamomile, petals", time: "45 min", ask: "Help me create a calming evening bath." },
    ],
  },
  {
    title: "Rituals of Strength",
    items: [
      { name: "Morning Mobility", note: "gentle strength by the pool", time: "40 min", ask: "Suggest a gentle morning mobility routine." },
      { name: "Hot Stone Recovery", note: "basalt stones, slow pressure", time: "90 min", ask: "How can I recover better after exercise?" },
    ],
  },
  {
    title: "Rituals of Renewal",
    items: [
      { name: "Botanical Nourish", note: "a menu composed with Ben", time: "60 min", ask: "Help me plan a nourishing day of meals." },
      { name: "Stillness Session", note: "breath, silence, sea air", time: "30 min", ask: "Guide me through a moment of stillness." },
    ],
  },
];

const GALLERY = [
  { img: "/maison/spa-room.jpg", cap: "The treatment suites", cls: "ms-g1" },
  { img: "/maison/pool-maldives.jpg", cap: "Dusk on the ocean terrace", cls: "ms-g2" },
  { img: "/maison/towels.jpg", cap: "Turn-down, every evening", cls: "ms-g3" },
  { img: "/maison/bath-tray.jpg", cap: "The bath ritual", cls: "ms-g4" },
  { img: "/maison/palm-shadow.jpg", cap: "Afternoon light", cls: "ms-g5" },
];

const STATUS: Record<BenStatus, string> = {
  loading: "Your host is preparing",
  ready: "Ben is available",
  connecting: "Connecting you to Ben",
  live: "In conversation",
  ended: "Thank you for your visit",
  unavailable: "Ben is with another guest",
};

function Crest() {
  return (
    <svg viewBox="0 0 40 40" width="34" height="34" aria-hidden="true">
      <circle cx="20" cy="20" r="18.5" fill="none" stroke="currentColor" strokeWidth="0.8" />
      <path d="M20 8c3 5 3 9 0 13-3-4-3-8 0-13Z" fill="currentColor" opacity="0.85" />
      <path d="M20 21c4-3 8-3 11-1-3 3-7 4-11 1Zm0 0c-4-3-8-3-11-1 3 3 7 4 11 1Z" fill="currentColor" opacity="0.55" />
      <path d="M20 21v11" stroke="currentColor" strokeWidth="0.8" />
    </svg>
  );
}

export function Maison() {
  const ben = useBen();
  const live = ben.status === "live";
  const rootRef = useRef<HTMLDivElement>(null);
  const [day, setDay] = useState(0);
  const lastLine = ben.transcript[ben.transcript.length - 1];

  const toHost = () => document.getElementById("ms-host")?.scrollIntoView({ behavior: "smooth", block: "center" });
  const speak = () => {
    toHost();
    if (!live) ben.start();
  };
  const askBen = (text: string) => {
    toHost();
    ben.ask(text);
  };

  // Gentle editorial reveals: fade and rise once, as each block enters the page.
  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;
    const els = root.querySelectorAll<HTMLElement>("[data-rise]");
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches || !("IntersectionObserver" in window)) {
      els.forEach((el) => el.classList.add("is-in"));
      return;
    }
    const io = new IntersectionObserver(
      (entries) =>
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-in");
            io.unobserve(entry.target);
          }
        }),
      { rootMargin: "0px 0px -8% 0px", threshold: 0.12 },
    );
    els.forEach((el) => io.observe(el));
    return () => io.disconnect();
  }, [day]);

  return (
    <div className="ms" ref={rootRef}>
      <header className="ms-mast">
        <div className="ms-mast-side">
          <button type="button" className="ms-icon-btn" aria-label="Menu">
            <Menu size={18} strokeWidth={1.4} />
          </button>
          <nav aria-label="Main">
            <a href="#maison" onClick={(e) => e.preventDefault()}>
              Stay
            </a>
            <a href="#maison" onClick={(e) => e.preventDefault()}>
              Spa
            </a>
            <a href="#maison" onClick={(e) => e.preventDefault()}>
              Dining
            </a>
          </nav>
        </div>
        <a className="ms-logo" href="#maison">
          <Crest />
          <span>
            <b>Maison Ben</b>
            <small>Wellness Resort &amp; Spa</small>
          </span>
        </a>
        <div className="ms-mast-side ms-right">
          <button type="button" className="ms-btn ms-btn-line ms-btn-sm" onClick={speak}>
            Reserve
          </button>
        </div>
      </header>

      <section className="ms-cover">
        <div className="ms-cover-img">
          <img src="/maison/pool-tropical.jpg" alt="Infinity pool framed by palms at sunset" />
        </div>
        <div className="ms-cover-copy">
          <p className="ms-issue">Nº 10 &nbsp;·&nbsp; The Longevity Edition &nbsp;·&nbsp; Winter 2026</p>
          <h1>
            Stay <em>well,</em>
            <br />
            live <em>beautifully.</em>
          </h1>
        </div>
        <div className="ms-cover-foot">
          <span>A private island of rest</span>
          <span className="ms-rule" />
          <span>Your host: Ben</span>
        </div>
      </section>

      <section className="ms-intro">
        <div className="ms-intro-copy" data-rise>
          <span className="ms-kicker">Le Concierge</span>
          <h2>
            Meet Ben, <em>your wellness host.</em>
          </h2>
          <p className="ms-dropcap">
            Every guest of the Maison is welcomed by Ben, a coach you speak with face to face. He learns how you sleep,
            what you love to eat and how you like to move, then composes small rituals for your stay and for the life you
            return to.
          </p>
          <p className="ms-sign">
            <em>With warm regards,</em> Ben
          </p>
          <div className="ms-intro-actions">
            <button type="button" className="ms-btn ms-btn-solid" onClick={speak}>
              Speak with Ben <ArrowRight size={16} strokeWidth={1.5} />
            </button>
            <button type="button" className="ms-btn ms-btn-text" onClick={() => askBen("What would you recommend for my first day here?")}>
              Plan my first day
            </button>
          </div>
        </div>

        <div className="ms-host" id="ms-host" data-rise>
          <div className="ms-host-arch" aria-hidden="true">
            <img src="/maison/palm-shadow.jpg" alt="" />
          </div>
          <figure className="ms-host-frame">
            <div className="ms-host-embed">
              <BenEmbed theme="maison" />
            </div>
            <figcaption>
              <span className="ms-status" data-status={ben.status}>
                <i /> {STATUS[ben.status]}
                {live && <em> · {ben.elapsed}</em>}
              </span>
              {live && (
                <button type="button" className="ms-btn ms-btn-text ms-end" onClick={ben.end}>
                  <PhoneOff size={14} strokeWidth={1.6} /> End
                </button>
              )}
            </figcaption>
            {lastLine && (
              <blockquote className="ms-host-line" key={lastLine.id}>
                <span>{lastLine.role === "replica" ? "Ben" : "You"}</span>“{lastLine.speech}”
              </blockquote>
            )}
          </figure>
        </div>
      </section>

      <section className="ms-stay">
        <div className="ms-stay-head" data-rise>
          <span className="ms-kicker ms-kicker-light">Your stay</span>
          <h2>
            Three days, <em>composed for you.</em>
          </h2>
          <div className="ms-tabs" role="tablist" aria-label="Day of stay">
            {STAY.map((d, i) => (
              <button key={d.day} type="button" role="tab" aria-selected={day === i} onClick={() => setDay(i)}>
                <b>Day {d.day}</b>
                <small>{d.theme}</small>
              </button>
            ))}
          </div>
        </div>
        <ol className="ms-timeline" key={day}>
          {STAY[day].items.map((item, i) => (
            <li key={item.title} style={{ animationDelay: `${i * 90}ms` }}>
              <time>{item.time}</time>
              <div className="ms-tl-img">
                <img src={item.img} alt="" loading="lazy" />
              </div>
              <div className="ms-tl-text">
                <h3>{item.title}</h3>
                <p>{item.copy}</p>
              </div>
              <button type="button" className="ms-ask" onClick={() => askBen(item.ask)}>
                Ask Ben <ArrowUpRight size={15} strokeWidth={1.5} />
              </button>
            </li>
          ))}
        </ol>
      </section>

      <section className="ms-menu-wrap">
        <div className="ms-menu" data-rise>
          <div className="ms-menu-head">
            <Crest />
            <span className="ms-kicker">Maison Ben</span>
            <h2>
              La Carte <em>des Soins</em>
            </h2>
            <p>Each ritual may be discussed with Ben before you book.</p>
          </div>
          {MENU.map((group) => (
            <div key={group.title} className="ms-menu-group">
              <h3>{group.title}</h3>
              {group.items.map((item) => (
                <button key={item.name} type="button" className="ms-menu-item" onClick={() => askBen(item.ask)}>
                  <span className="ms-menu-name">
                    {item.name}
                    <small>{item.note}</small>
                  </span>
                  <span className="ms-leader" aria-hidden="true" />
                  <span className="ms-menu-time">{item.time}</span>
                </button>
              ))}
            </div>
          ))}
          <p className="ms-menu-foot">Complimentary for guests · Ben coaches; he does not diagnose</p>
        </div>
      </section>

      <section className="ms-gallery">
        {GALLERY.map((g, i) => (
          <figure key={g.cap} className={`ms-gal ${g.cls}`} data-rise>
            <div className="ms-gal-img">
              <img src={g.img} alt="" loading="lazy" />
            </div>
            <figcaption>
              <span>Nº {i + 1}</span> {g.cap}
            </figcaption>
          </figure>
        ))}
        <div className="ms-gal-quote" data-rise>
          <p>
            “I arrived exhausted and left with three small habits that changed my year. Ben felt less like an app and
            more like the best concierge I've ever had.”
          </p>
          <span>— A returning guest</span>
        </div>
      </section>

      <section className="ms-close">
        <div className="ms-close-img">
          <img src="/maison/pool-sunset.jpg" alt="" loading="lazy" />
        </div>
        <div className="ms-close-copy" data-rise>
          <span className="ms-kicker ms-kicker-light">Reservations</span>
          <h2>
            Reserve a moment <em>with Ben.</em>
          </h2>
          <button type="button" className="ms-btn ms-btn-brass" onClick={speak}>
            Begin the conversation <ArrowRight size={16} strokeWidth={1.5} />
          </button>
        </div>
      </section>

      <footer className="ms-foot">
        <a className="ms-logo" href="#maison">
          <Crest />
          <span>
            <b>Maison Ben</b>
            <small>Wellness Resort &amp; Spa</small>
          </span>
        </a>
        <p>Ben is a wellness coach, not a medical provider. In an emergency, call your local emergency number.</p>
        <span>© 2026</span>
      </footer>
    </div>
  );
}
