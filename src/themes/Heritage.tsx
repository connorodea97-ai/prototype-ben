import { useEffect, useRef, useState } from "react";
import "@fontsource/im-fell-english/400.css";
import "@fontsource/im-fell-english/400-italic.css";
import "@fontsource/im-fell-english-sc/400.css";
import "@fontsource-variable/eb-garamond/wght.css";
import "@fontsource-variable/eb-garamond/wght-italic.css";
import { BenEmbed } from "../ben/BenEmbed.tsx";
import { useBen, type BenStatus } from "../ben/useBen.ts";
import "./heritage.css";

const REMEDIES = [
  {
    no: "I",
    label: "Tinct. of Rest",
    title: "Sleep",
    plant: "Somnus",
    img: "/heritage/sleep.jpg",
    alt: "Etching of a child asleep on a pillow, Carl Bloch, 1881",
    copy: "For restless nights and early wakings. Taken nightly, at a regular hour.",
    ask: "Mr. Ben, I sleep poorly of late. What evening habits would you recommend for a better night's rest?",
  },
  {
    no: "II",
    label: "Elixir of Nourishment",
    title: "Diet",
    plant: "Victus",
    img: "/heritage/diet.jpg",
    alt: "Four silver dishes of savouries: cheese soufflés, angels on horseback, croûtes à l'Indienne and anchovy croûtes, from Mrs Beeton's Book of Household Management",
    copy: "For a sound constitution. Good food, well served, taken in good measure.",
    ask: "What simple changes to my daily meals would most improve my health?",
  },
  {
    no: "III",
    label: "Spirit of Vigour",
    title: "Exercise",
    plant: "Exercitatio",
    img: "/heritage/exercise.jpg",
    alt: "Engraving of a young man exercising with Indian clubs, from a 19th-century drill manual",
    copy: "For stiffness of limb and want of energy. A brisk daily constitutional.",
    ask: "I should like to be more active. How might I begin a gentle daily exercise routine?",
  },
  {
    no: "IV",
    label: "Balm of Calm",
    title: "Temperament",
    plant: "Temperamentum",
    img: "/heritage/temperament.jpg",
    alt: "Engraving of four heads showing the lymphatic, sanguine, bilious and nervous temperaments",
    copy: "For worry, haste and a troubled mind. Breathe slowly; repeat as needed.",
    ask: "I have been anxious and hurried. Could you guide me through a calming practice?",
  },
];

const STATUS: Record<BenStatus, string> = {
  loading: "Mr. Ben is being sent for…",
  ready: "Mr. Ben is receiving visitors",
  connecting: "Announcing your arrival…",
  live: "In consultation",
  ended: "The consultation has concluded",
  unavailable: "Mr. Ben is engaged; kindly call again",
};

function Fleuron({ className = "" }: { className?: string }) {
  return (
    <svg className={`hr-fleuron ${className}`} viewBox="0 0 120 20" aria-hidden="true">
      <path d="M0 10h44M76 10h44" stroke="currentColor" strokeWidth="1" />
      <path
        d="M60 2c4 4 4 12 0 16-4-4-4-12 0-16Zm-8 8c3-3 6-3 8 0-2 3-5 3-8 0Zm16 0c-3-3-6-3-8 0 2 3 5 3 8 0Z"
        fill="currentColor"
      />
      <circle cx="47" cy="10" r="1.6" fill="currentColor" />
      <circle cx="73" cy="10" r="1.6" fill="currentColor" />
    </svg>
  );
}

function Corner({ className }: { className: string }) {
  return (
    <svg className={`hr-corner ${className}`} viewBox="0 0 60 60" aria-hidden="true">
      <path d="M4 56V20C4 10 10 4 20 4h36" fill="none" stroke="currentColor" strokeWidth="2" />
      <path d="M12 56V24c0-7 5-12 12-12h32" fill="none" stroke="currentColor" strokeWidth="1" />
      <path d="M20 20c6 0 10 4 10 10-6 0-10-4-10-10Z" fill="currentColor" />
      <circle cx="8" cy="8" r="3" fill="currentColor" />
    </svg>
  );
}

function toRoman(n: number): string {
  const map: [number, string][] = [
    [1000, "M"], [900, "CM"], [500, "D"], [400, "CD"], [100, "C"], [90, "XC"],
    [50, "L"], [40, "XL"], [10, "X"], [9, "IX"], [5, "V"], [4, "IV"], [1, "I"],
  ];
  let out = "";
  for (const [value, numeral] of map) {
    while (n >= value) {
      out += numeral;
      n -= value;
    }
  }
  return out;
}

export function Heritage() {
  const ben = useBen();
  const live = ben.status === "live";
  const ledgerRef = useRef<HTMLOListElement>(null);
  const [year] = useState(() => toRoman(new Date().getFullYear()));

  useEffect(() => {
    const el = ledgerRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [ben.transcript.length]);

  const toConsult = () => document.getElementById("hr-consult")?.scrollIntoView({ behavior: "smooth", block: "center" });
  const request = () => {
    toConsult();
    if (!live) ben.start();
  };
  const prescribe = (text: string) => {
    toConsult();
    ben.ask(text);
  };

  return (
    <div className="hr">
      <header className="hr-mast">
        <div className="hr-mast-top">
          <span>Vol. CXXXVIII · No. XLVII</span>
          <span className="hr-mast-mid">Printed for the Wellbeing of the Public</span>
          <span>Price: One Conversation</span>
        </div>
        <div className="hr-rule-double" />
        <div className="hr-mast-title">
          <img className="hr-vignette" src="/heritage/apothecary-shop.jpg" alt="Engraving of a Flemish apothecary's shop" />
          <div>
            <p className="hr-est">Est. MDCCCLXXXVIII</p>
            <h1>The Ben Almanack</h1>
            <p className="hr-sub">of Health, Good Habit &amp; a Sound Temperament</p>
          </div>
          <img className="hr-vignette hr-vignette-r" src="/heritage/lavender.jpg" alt="Botanical engraving of lavender" />
        </div>
        <div className="hr-rule-double" />
        <nav className="hr-nav" aria-label="Sections">
          <a href="#hr-consult">The Consultation</a>
          <span>❦</span>
          <a href="#hr-remedies">Remedies of Habit</a>
          <span>❦</span>
          <a href="#hr-maxims">Maxims</a>
          <span>❦</span>
          <a href="#hr-hours">Hours</a>
        </nav>
      </header>

      <main>
        <section className="hr-lead">
          <article className="hr-article">
            <p className="hr-kicker">Leading Article</p>
            <h2>On the Keeping of Good Health, by Means of Conversation</h2>
            <Fleuron />
            <div className="hr-columns">
              <p className="hr-dropcap">
                It has long been held by physicians and grandmothers alike that a man's health is best preserved not by
                grand remedies, but by small and faithful habits. To that end the proprietors of this house present Mr.
                Ben, a coach of uncommon patience, who will speak with you face to face at any hour.
              </p>
              <p>
                Mr. Ben listens before he advises. He enquires after your sleep, your table, your exercise and your
                spirits, and from your answers he prescribes one modest step, to be taken before you next meet.
              </p>
              <p>
                He does not pretend to the office of a physician, and will gladly direct you to one where the matter
                requires it. But for the daily business of living well, the reader will find no more agreeable companion.
              </p>
            </div>
            <aside className="hr-notice">
              <span className="hr-notice-head">Notice to the Reader</span>
              Consultations are private and may be had without appointment. No fee is asked of the curious.
            </aside>
          </article>

          <section className="hr-consult" id="hr-consult" aria-label="Consultation with Ben">
            <div className="hr-frame">
              <Corner className="tl" />
              <Corner className="tr" />
              <Corner className="bl" />
              <Corner className="br" />
              <div className="hr-plate">
                <BenEmbed theme="heritage" />
              </div>
            </div>
            <p className="hr-caption">
              <em>Plate I.</em> A Consultation with Mr. Ben
            </p>
            <div className="hr-status" data-status={ben.status}>
              <span className="hr-seal" />
              {STATUS[ben.status]}
              {live && <span className="hr-clock">{ben.elapsed}</span>}
            </div>
            <div className="hr-actions">
              {live ? (
                <button type="button" className="hr-btn hr-btn-ghost" onClick={ben.end}>
                  Conclude the Consultation
                </button>
              ) : (
                <button type="button" className="hr-btn" onClick={request} disabled={ben.status === "loading"}>
                  Request an Audience
                </button>
              )}
            </div>

            <div className="hr-ledger">
              <div className="hr-ledger-head">
                <span>The Ledger of Conversation</span>
                <span>{ben.transcript.length ? `${toRoman(ben.transcript.length)} entries` : "—"}</span>
              </div>
              {ben.transcript.length === 0 ? (
                <p className="hr-ledger-empty">Entries shall be recorded here as you converse.</p>
              ) : (
                <ol ref={ledgerRef}>
                  {ben.transcript.map((line) => (
                    <li key={line.id} data-role={line.role}>
                      <b>{line.role === "replica" ? "Mr. Ben." : "Yourself."}</b> {line.speech}
                    </li>
                  ))}
                </ol>
              )}
            </div>
          </section>
        </section>

        <section className="hr-section" id="hr-remedies">
          <div className="hr-section-head">
            <Fleuron />
            <h2>Remedies of Habit</h2>
            <p>Prepared fresh, dispensed in conversation. Select a jar to consult Mr. Ben upon the matter.</p>
          </div>
          <div className="hr-jars">
            {REMEDIES.map((r) => (
              <button type="button" key={r.no} className="hr-jar" onClick={() => prescribe(r.ask)}>
                <span className="hr-jar-no">No. {r.no}</span>
                <span className="hr-jar-img">
                  <img src={r.img} alt={r.alt} loading="lazy" />
                </span>
                <span className="hr-label">
                  <small>{r.label}</small>
                  <b>{r.title}</b>
                  <i>{r.plant}</i>
                </span>
                <span className="hr-jar-copy">{r.copy}</span>
                <span className="hr-jar-cta">Consult upon this ☞</span>
              </button>
            ))}
          </div>
        </section>

        <section className="hr-maxims" id="hr-maxims">
          <div className="hr-maxim-art">
            <img src="/heritage/sleep.jpg" alt="" loading="lazy" />
          </div>
          <div className="hr-maxim-body">
            <p className="hr-kicker">Maxims for the Season</p>
            <blockquote>“Early to bed and early to rise, makes a man healthy, wealthy, and wise.”</blockquote>
            <cite>— Benjamin Franklin, Poor Richard's Almanack, 1735</cite>
            <Fleuron />
            <ol className="hr-precepts">
              <li>
                <b>I.</b> Retire at the same hour each night, and rise likewise.
              </li>
              <li>
                <b>II.</b> Take water freely and sweets sparingly.
              </li>
              <li>
                <b>III.</b> Walk out of doors daily, whatever the weather.
              </li>
              <li>
                <b>IV.</b> Speak your troubles aloud; they weigh less when shared.
              </li>
            </ol>
          </div>
        </section>

        <section className="hr-section hr-hours" id="hr-hours">
          <div className="hr-section-head">
            <Fleuron />
            <h2>Hours of Consultation</h2>
          </div>
          <table>
            <tbody>
              <tr>
                <th>Monday to Friday</th>
                <td>At all hours, day and night</td>
              </tr>
              <tr>
                <th>Saturday &amp; Sunday</th>
                <td>Likewise, without exception</td>
              </tr>
              <tr>
                <th>Feast Days</th>
                <td>Mr. Ben keeps no holidays</td>
              </tr>
            </tbody>
          </table>
          <button type="button" className="hr-btn" onClick={request}>
            Call upon Mr. Ben
          </button>
        </section>
      </main>

      <footer className="hr-colophon">
        <div className="hr-rule-double" />
        <p>
          Printed at the House of Ben · Anno {year} · Mr. Ben is a coach of habit and not a physician. In any urgent
          matter, send at once for a doctor or the emergency services.
        </p>
        <p className="hr-credits">Engravings: Köhler's Medizinal-Pflanzen (1887) and a Flemish apothecary scene, public domain.</p>
      </footer>
    </div>
  );
}
