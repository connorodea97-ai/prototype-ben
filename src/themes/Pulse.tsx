import { useEffect, useRef, useState, type ReactNode } from "react";
import {
  Activity,
  Bell,
  BellRing,
  CalendarClock,
  Check,
  ChevronLeft,
  ChevronRight,
  Droplets,
  Flame,
  Footprints,
  HeartPulse,
  House,
  Moon,
  PhoneOff,
  Radio,
  Settings,
  Sparkles,
  Target,
  Trophy,
  User,
  Utensils,
  Video,
  Watch,
  Wind,
  Zap,
} from "lucide-react";
import { BenEmbed } from "../ben/BenEmbed.tsx";
import { useBen, type BenStatus } from "../ben/useBen.ts";
import "./pulse.css";

type Tab = "today" | "trends" | "coach" | "plan" | "me";

const PROMPTS = [
  "Why did my HRV dip today?",
  "Plan tomorrow around my recovery",
  "How do I get more deep sleep?",
  "High-protein day under 2,200 kcal",
];

const RANGES = {
  W: { hrv: [58, 61, 57, 66, 70, 68, 72], strain: [62, 78, 71, 85, 66, 90, 74], labels: "MTWTFSS".split("") },
  M: {
    hrv: [55, 59, 57, 62, 60, 64, 66, 63, 68, 70, 67, 72, 69, 71],
    strain: [70, 64, 81, 75, 68, 88, 72],
    labels: ["W1", "", "W2", "", "W3", "", "W4"],
  },
  "3M": {
    hrv: [49, 52, 51, 55, 57, 56, 60, 61, 63, 62, 66, 68, 67, 70],
    strain: [58, 66, 71, 69, 77, 80, 74],
    labels: ["AUG", "", "SEP", "", "OCT", "", "NOV"],
  },
} as const;
type Range = keyof typeof RANGES;

const SLEEP = [
  { label: "Awake", minutes: 22, color: "var(--p-muted-2)" },
  { label: "REM", minutes: 96, color: "var(--p-violet)" },
  { label: "Light", minutes: 198, color: "var(--p-cyan)" },
  { label: "Deep", minutes: 92, color: "var(--p-lime)" },
];

const PLAN = [
  { time: "07:30", icon: <Footprints size={16} />, title: "Zone 2 run · 40 min", note: "HR 128–142 · easy pace", done: true, ask: "Walk me through this morning's Zone 2 run." },
  { time: "10:00", icon: <Droplets size={16} />, title: "750 ml water + electrolytes", note: "You're 0.9 L behind", done: true, ask: "How much should I drink on a training day?" },
  { time: "12:30", icon: <Utensils size={16} />, title: "High-protein lunch", note: "40 g protein · salmon bowl", ask: "Give me a 40 g protein lunch I can make in 10 minutes." },
  { time: "15:00", icon: <Wind size={16} />, title: "Box breathing · 5 min", note: "Afternoon stress dip", ask: "Coach me through five minutes of box breathing." },
  { time: "22:45", icon: <Moon size={16} />, title: "Wind-down, screens off", note: "Lights out by 23:00", ask: "Help me build a wind-down routine for tonight." },
];

const STATUS_LABEL: Record<BenStatus, string> = {
  loading: "Booting",
  ready: "Ready",
  connecting: "Linking",
  live: "Live",
  ended: "Logged",
  unavailable: "Busy",
};

function sparkPath(values: readonly number[], width: number, height: number) {
  const min = Math.min(...values);
  const max = Math.max(...values);
  const step = width / (values.length - 1);
  return values
    .map((v, i) => {
      const x = i * step;
      const y = height - ((v - min) / (max - min || 1)) * (height - 10) - 5;
      return `${i === 0 ? "M" : "L"}${x.toFixed(1)} ${y.toFixed(1)}`;
    })
    .join(" ");
}

function Ring({ value, size, id, stroke = 10 }: { value: number; size: number; id: string; stroke?: number }) {
  const r = size / 2 - stroke - 2;
  const c = 2 * Math.PI * r;
  return (
    <svg className="p-ring" width={size} height={size} viewBox={`0 0 ${size} ${size}`} aria-hidden="true">
      <defs>
        <linearGradient id={id} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#D4FF3A" />
          <stop offset="1" stopColor="#38E1FF" />
        </linearGradient>
      </defs>
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="rgba(255,255,255,.08)" strokeWidth={stroke} />
      <circle
        cx={size / 2}
        cy={size / 2}
        r={r}
        fill="none"
        stroke={`url(#${id})`}
        strokeWidth={stroke}
        strokeLinecap="round"
        strokeDasharray={c}
        strokeDashoffset={c * (1 - value / 100)}
        transform={`rotate(-90 ${size / 2} ${size / 2})`}
        className="p-ring-arc"
      />
    </svg>
  );
}

function Logo({ size = 30 }: { size?: number }) {
  return (
    <svg viewBox="0 0 32 32" width={size} height={size} aria-hidden="true">
      <rect width="32" height="32" rx="9" fill="#D4FF3A" />
      <path d="M5 17h5l3-7 5 13 3-6h6" fill="none" stroke="#06080C" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

/** Signal, wifi and battery, drawn as simple SVG. */
function StatusIcons() {
  return (
    <span className="p-status-icons" aria-hidden="true">
      <svg width="18" height="12" viewBox="0 0 18 12">
        {[0, 1, 2, 3].map((i) => (
          <rect key={i} x={i * 4.6} y={9 - i * 3} width="3.2" height={3 + i * 3} rx="1" fill="currentColor" />
        ))}
      </svg>
      <svg width="16" height="12" viewBox="0 0 16 12">
        <path d="M8 11.5 10.4 9a3.4 3.4 0 0 0-4.8 0Z" fill="currentColor" />
        <path d="M3.6 7a6.2 6.2 0 0 1 8.8 0" stroke="currentColor" strokeWidth="1.7" fill="none" strokeLinecap="round" />
        <path d="M1 4.3a9.9 9.9 0 0 1 14 0" stroke="currentColor" strokeWidth="1.7" fill="none" strokeLinecap="round" />
      </svg>
      <svg width="26" height="12" viewBox="0 0 26 12">
        <rect x="0.5" y="0.5" width="22" height="11" rx="3.2" stroke="currentColor" strokeOpacity=".45" fill="none" />
        <rect x="2.2" y="2.2" width="15" height="7.6" rx="1.8" fill="currentColor" />
        <rect x="23.6" y="4" width="1.6" height="4" rx=".8" fill="currentColor" fillOpacity=".45" />
      </svg>
    </span>
  );
}

function Card({ children, className = "" }: { children: ReactNode; className?: string }) {
  return <section className={`p-card ${className}`}>{children}</section>;
}

export function Pulse() {
  const ben = useBen();
  const live = ben.status === "live";
  const [tab, setTab] = useState<Tab>("today");
  const [range, setRange] = useState<Range>("W");
  const [sources, setSources] = useState({ oura: true, apple: true, strava: false, cgm: false });
  const coachRef = useRef<HTMLDivElement>(null);
  const screenRef = useRef<HTMLDivElement>(null);
  const touchRef = useRef<HTMLSpanElement>(null);

  // Inside the phone, swap the system cursor for a round iPhone-style pointer (mouse and trackpad only).
  useEffect(() => {
    const screen = screenRef.current;
    const dot = touchRef.current;
    if (!screen || !dot || !window.matchMedia("(pointer: fine)").matches) return;
    screen.classList.add("p-touch-on");
    const onMove = (e: PointerEvent) => {
      const el = e.target as HTMLElement | null;
      // Ben's video keeps the normal pointer for its own controls.
      if (el?.closest("tavus-embed")) {
        dot.dataset.state = "off";
        return;
      }
      const r = screen.getBoundingClientRect();
      dot.style.transform = `translate(${e.clientX - r.left}px, ${e.clientY - r.top}px)`;
      dot.dataset.state = el?.closest("button, a, label, input, [role='tab']") ? "hover" : "on";
    };
    const onLeave = () => {
      dot.dataset.state = "off";
    };
    const onDown = () => {
      dot.dataset.down = "";
    };
    const onUp = () => {
      delete dot.dataset.down;
    };
    screen.addEventListener("pointermove", onMove);
    screen.addEventListener("pointerleave", onLeave);
    screen.addEventListener("pointerdown", onDown);
    window.addEventListener("pointerup", onUp);
    return () => {
      screen.classList.remove("p-touch-on");
      screen.removeEventListener("pointermove", onMove);
      screen.removeEventListener("pointerleave", onLeave);
      screen.removeEventListener("pointerdown", onDown);
      window.removeEventListener("pointerup", onUp);
    };
  }, []);

  const [{ greeting, week, todayIndex }] = useState(() => {
    const date = new Date();
    const hour = date.getHours();
    const monday = new Date(date);
    monday.setDate(date.getDate() - ((date.getDay() + 6) % 7));
    return {
      greeting: hour < 12 ? "Good morning" : hour < 18 ? "Good afternoon" : "Good evening",
      todayIndex: (date.getDay() + 6) % 7,
      week: Array.from({ length: 7 }, (_, i) => {
        const d = new Date(monday);
        d.setDate(monday.getDate() + i);
        return { day: "MTWTFSS"[i], date: d.getDate() };
      }),
    };
  });

  useEffect(() => {
    const el = coachRef.current;
    if (el && tab === "coach") el.scrollTo({ top: el.scrollHeight, behavior: "smooth" });
  }, [ben.transcript.length, tab]);

  const askBen = (question: string) => {
    setTab("coach");
    ben.ask(question);
  };

  const data = RANGES[range];

  const tabs: { id: Tab; label: string; icon: ReactNode }[] = [
    { id: "today", label: "Today", icon: <House size={21} /> },
    { id: "trends", label: "Trends", icon: <Activity size={21} /> },
    { id: "coach", label: "Ben", icon: <Video size={22} /> },
    { id: "plan", label: "Plan", icon: <CalendarClock size={21} /> },
    { id: "me", label: "Me", icon: <User size={21} /> },
  ];

  return (
    <div className="p">
      <div className="p-glow" aria-hidden="true" />

      {/* ---------- left: the pitch (desktop only) ---------- */}
      <aside className="p-pitch">
        <div className="p-brand">
          <Logo size={34} />
          <span>
            Pulse <em>with Ben</em>
          </span>
        </div>
        <span className="p-mono p-dim">IOS · ANDROID · PRIVATE BETA</span>
        <h1>
          Your coach lives
          <br />
          in your <span className="p-lime">pocket.</span>
        </h1>
        <p className="p-lede">
          Pulse reads your recovery every morning. Ben, your face-to-face AI coach, turns it into one clear plan. Tap the
          lime button and talk to him.
        </p>
        <ul className="p-features">
          <li>
            <span>
              <Video size={16} />
            </span>
            Live video coaching, any hour
          </li>
          <li>
            <span>
              <Watch size={16} />
            </span>
            Reads Oura, Apple Health and Garmin
          </li>
          <li>
            <span>
              <Sparkles size={16} />
            </span>
            A plan that adapts every day
          </li>
        </ul>
        <div className="p-pitch-cta">
          <button type="button" className="p-btn-lime" onClick={() => setTab("coach")}>
            <Video size={17} /> Talk to Ben
          </button>
          <span className="p-rating">
            <b>4.9</b>
            <span className="p-stars" aria-hidden="true">
              ★★★★★
            </span>
            <small>beta testers</small>
          </span>
        </div>
      </aside>

      {/* ---------- the phone ---------- */}
      <div className="p-device-wrap">
        <div className="p-device">
          <div className="p-screen" ref={screenRef}>
            <span className="p-touch" ref={touchRef} aria-hidden="true">
              <i />
            </span>
            <div className="p-statusbar" aria-hidden="true">
              <span>9:41</span>
              <StatusIcons />
            </div>
            <button
              type="button"
              className="p-island"
              data-live={live || undefined}
              data-away={(live && tab !== "coach") || undefined}
              onClick={() => live && setTab("coach")}
              aria-label={live ? "Return to the call with Ben" : "Dynamic island"}
              tabIndex={live ? 0 : -1}
            >
              <span className="p-island-dot" />
              <span className="p-island-text">Ben</span>
              <span className="p-island-time">{ben.elapsed}</span>
            </button>

            <div className="p-views">
              {/* ---------- TODAY ---------- */}
              <div className="p-view" data-active={tab === "today" || undefined} aria-hidden={tab !== "today"}>
                <header className="p-hello">
                  <img src="/img/run-sunrise.jpg" alt="" />
                  <div>
                    <small>{greeting}</small>
                    <b>Alex</b>
                  </div>
                  <button type="button" className="p-round" aria-label="Notifications">
                    <Bell size={18} />
                    <i />
                  </button>
                </header>

                <div className="p-days" role="list">
                  {week.map((d, i) => (
                    <span key={i} role="listitem" data-today={i === todayIndex || undefined} data-past={i < todayIndex || undefined}>
                      <small>{d.day}</small>
                      <b>{d.date}</b>
                    </span>
                  ))}
                </div>

                <Card className="p-hero">
                  <div className="p-hero-ring">
                    <Ring value={82} size={128} id="p-ring-app" stroke={11} />
                    <div>
                      <b>82</b>
                      <small>READY</small>
                    </div>
                  </div>
                  <div className="p-hero-copy">
                    <span className="p-chip-lime">
                      <Zap size={12} /> Primed
                    </span>
                    <h2>Good to push today.</h2>
                    <p>Keep it under 60 min. HRV is still recovering.</p>
                  </div>
                  <div className="p-trio">
                    <span>
                      <small>HRV</small>
                      <b>
                        64<i>ms</i>
                      </b>
                    </span>
                    <span>
                      <small>RHR</small>
                      <b>
                        54<i>bpm</i>
                      </b>
                    </span>
                    <span>
                      <small>Sleep</small>
                      <b>
                        6:48<i>h</i>
                      </b>
                    </span>
                  </div>
                </Card>

                <button type="button" className="p-card p-call-card" onClick={() => askBen("Walk me through the plan for tomorrow morning's run.")}>
                  <img src="/img/watch-pulse.jpg" alt="" loading="lazy" />
                  <span className="p-call-body">
                    <span className="p-chip-glass">
                      <Sparkles size={12} /> Ben's call
                    </span>
                    <b>Zone 2 run, 40 min, before 8:00.</b>
                    <span className="p-call-cta">
                      <span className="p-call-play">
                        <Video size={15} />
                      </span>
                      Talk it through with Ben
                    </span>
                  </span>
                </button>

                <div className="p-section-head">
                  <h3>Today</h3>
                  <button type="button" onClick={() => setTab("trends")}>
                    Trends <ChevronRight size={14} />
                  </button>
                </div>
                <div className="p-tiles">
                  {[
                    { icon: <Footprints size={16} />, label: "Steps", value: "7,412", goal: 74, tone: "lime" },
                    { icon: <Flame size={16} />, label: "Active kcal", value: "486", goal: 61, tone: "cyan" },
                    { icon: <Droplets size={16} />, label: "Water", value: "1.6 L", goal: 64, tone: "violet" },
                    { icon: <HeartPulse size={16} />, label: "Zone 2", value: "24 min", goal: 60, tone: "lime" },
                  ].map((m) => (
                    <div key={m.label} className="p-tile" data-tone={m.tone}>
                      <span className="p-tile-icon">{m.icon}</span>
                      <small>{m.label}</small>
                      <b>{m.value}</b>
                      <span className="p-bar">
                        <span style={{ width: `${m.goal}%` }} />
                      </span>
                    </div>
                  ))}
                </div>

                <Card className="p-sleep">
                  <div className="p-card-head">
                    <span>
                      <Moon size={15} /> Sleep
                    </span>
                    <small className="p-mono p-dim">23:41 → 06:29</small>
                  </div>
                  <div className="p-big">
                    6<i>h</i> 48<i>m</i>
                  </div>
                  <div className="p-stages">
                    {SLEEP.map((s) => (
                      <span key={s.label} style={{ flex: s.minutes, background: s.color }} />
                    ))}
                  </div>
                  <ul className="p-legend">
                    {SLEEP.map((s) => (
                      <li key={s.label}>
                        <i style={{ background: s.color }} />
                        {s.label}
                      </li>
                    ))}
                  </ul>
                </Card>

                <button type="button" className="p-card p-tonight" onClick={() => askBen("How can I improve my sleep consistency this week?")}>
                  <img src="/img/sleep-night.jpg" alt="" loading="lazy" />
                  <span>
                    <small className="p-mono">TONIGHT</small>
                    <b>Lights out by 23:00 for +18 min deep sleep.</b>
                  </span>
                  <ChevronRight size={18} />
                </button>
              </div>

              {/* ---------- TRENDS ---------- */}
              <div className="p-view" data-active={tab === "trends" || undefined} aria-hidden={tab !== "trends"}>
                <header className="p-title">
                  <h2>Trends</h2>
                  <div className="p-segment" role="tablist">
                    {(Object.keys(RANGES) as Range[]).map((r) => (
                      <button key={r} type="button" role="tab" aria-selected={range === r} onClick={() => setRange(r)}>
                        {r}
                      </button>
                    ))}
                  </div>
                </header>

                <Card>
                  <div className="p-card-head">
                    <span>
                      <HeartPulse size={15} /> HRV
                    </span>
                    <span className="p-delta p-up">+{data.hrv[data.hrv.length - 1] - data.hrv[0]} ms</span>
                  </div>
                  <div className="p-big">
                    {data.hrv[data.hrv.length - 1]}
                    <i>ms</i>
                  </div>
                  <svg viewBox="0 0 300 110" className="p-chart" preserveAspectRatio="none" aria-hidden="true" key={range}>
                    <defs>
                      <linearGradient id="p-chart-fill" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0" stopColor="#38E1FF" stopOpacity=".38" />
                        <stop offset="1" stopColor="#38E1FF" stopOpacity="0" />
                      </linearGradient>
                    </defs>
                    {[28, 56, 84].map((y) => (
                      <line key={y} x1="0" x2="300" y1={y} y2={y} stroke="rgba(255,255,255,.06)" />
                    ))}
                    <path d={`${sparkPath(data.hrv, 300, 110)} L300 110 L0 110 Z`} fill="url(#p-chart-fill)" />
                    <path className="p-chart-line" d={sparkPath(data.hrv, 300, 110)} fill="none" stroke="#38E1FF" strokeWidth="2.4" />
                  </svg>
                </Card>

                <Card>
                  <div className="p-card-head">
                    <span>
                      <Flame size={15} /> Strain
                    </span>
                    <small className="p-mono p-dim">AVG {Math.round(data.strain.reduce((a, b) => a + b, 0) / data.strain.length)}</small>
                  </div>
                  <div className="p-columns">
                    {data.strain.map((v, i) => (
                      <div key={`${range}-${i}`} className="p-col">
                        <span style={{ height: `${v}%` }} data-hi={i === data.strain.length - 1 || undefined} />
                        <small className="p-mono">{data.labels[i]}</small>
                      </div>
                    ))}
                  </div>
                </Card>

                <Card>
                  <div className="p-card-head">
                    <span>
                      <Moon size={15} /> Bedtime consistency
                    </span>
                    <span className="p-delta p-down">−12%</span>
                  </div>
                  <div className="p-dots" aria-hidden="true">
                    {[22.9, 23.4, 23.1, 0.2, 23.7, 0.6, 23.2].map((t, i) => {
                      const hours = t < 12 ? t + 24 : t;
                      return (
                        <span key={i} style={{ bottom: `${((hours - 22.5) / 2.5) * 100}%`, left: `${(i / 6) * 100}%` }} data-late={hours > 23.75 || undefined} />
                      );
                    })}
                    <i style={{ bottom: `${(0.5 / 2.5) * 100}%` }} />
                  </div>
                  <p className="p-small">Two late nights pulled your deep sleep down 21 min.</p>
                </Card>

                <button type="button" className="p-ask-row" onClick={() => askBen("Explain my trends this week and what I should change.")}>
                  <span className="p-call-play">
                    <Video size={15} />
                  </span>
                  Ask Ben to explain these trends
                  <ChevronRight size={16} />
                </button>
              </div>

              {/* ---------- COACH (always mounted, so the call keeps going) ---------- */}
              <div className="p-view p-coach" ref={coachRef} data-active={tab === "coach" || undefined} aria-hidden={tab !== "coach"}>
                <header className="p-coach-head">
                  <button type="button" className="p-round" onClick={() => setTab("today")} aria-label="Back to today">
                    <ChevronLeft size={18} />
                  </button>
                  <div>
                    <b>Ben</b>
                    <small>AI performance coach</small>
                  </div>
                  <span className="p-tag" data-status={ben.status}>
                    <Radio size={12} /> {STATUS_LABEL[ben.status]}
                  </span>
                </header>

                <div className="p-stage">
                  <BenEmbed theme="pulse" />
                </div>

                {live && (
                  <div className="p-live-bar">
                    <span className="p-mono">
                      <span className="p-dot" /> {ben.elapsed}
                    </span>
                    <button type="button" className="p-end" onClick={ben.end}>
                      <PhoneOff size={14} /> End
                    </button>
                  </div>
                )}

                {ben.transcript.length === 0 ? (
                  <div className="p-coach-empty">
                    <small className="p-mono p-dim">BEN ALREADY SEES TODAY'S DATA</small>
                  </div>
                ) : (
                  <ol className="p-bubbles">
                    {ben.transcript.map((line) => (
                      <li key={line.id} data-role={line.role}>
                        {line.speech}
                      </li>
                    ))}
                  </ol>
                )}

                <div className="p-replies">
                  {PROMPTS.map((prompt) => (
                    <button key={prompt} type="button" onClick={() => ben.ask(prompt)}>
                      <Zap size={12} /> {prompt}
                    </button>
                  ))}
                </div>
              </div>

              {/* ---------- PLAN ---------- */}
              <div className="p-view" data-active={tab === "plan" || undefined} aria-hidden={tab !== "plan"}>
                <header className="p-title">
                  <h2>Plan</h2>
                  <span className="p-chip-lime">
                    <Target size={12} /> 2 of 5
                  </span>
                </header>
                <p className="p-small p-plan-intro">Ben rebuilt today around your readiness of 82.</p>
                <ol className="p-timeline">
                  {PLAN.map((item) => (
                    <li key={item.time} data-done={item.done || undefined}>
                      <span className="p-mono p-time">{item.time}</span>
                      <span className="p-node">{item.done ? <Check size={13} /> : item.icon}</span>
                      <div className="p-step">
                        <b>{item.title}</b>
                        <small>{item.note}</small>
                        <button type="button" onClick={() => askBen(item.ask)}>
                          <Video size={13} /> Ask Ben
                        </button>
                      </div>
                    </li>
                  ))}
                </ol>
              </div>

              {/* ---------- ME ---------- */}
              <div className="p-view" data-active={tab === "me" || undefined} aria-hidden={tab !== "me"}>
                <header className="p-title">
                  <h2>Me</h2>
                  <button type="button" className="p-round" aria-label="Settings">
                    <Settings size={18} />
                  </button>
                </header>
                <div className="p-profile">
                  <img src="/img/run-sunrise.jpg" alt="" />
                  <b>Alex Rivera</b>
                  <small>Member since March · Goal: sub-50 10K</small>
                  <div className="p-badges">
                    <span>
                      <Flame size={14} /> 23-day streak
                    </span>
                    <span>
                      <Trophy size={14} /> 41 sessions
                    </span>
                  </div>
                </div>

                <div className="p-section-head">
                  <h3>Connected sources</h3>
                </div>
                <Card className="p-list">
                  {(
                    [
                      ["oura", "Oura Ring", "Sleep, HRV, readiness"],
                      ["apple", "Apple Health", "Steps, workouts, heart"],
                      ["strava", "Strava", "Runs and rides"],
                      ["cgm", "Glucose monitor", "CGM, meals"],
                    ] as const
                  ).map(([key, name, note]) => (
                    <label key={key} className="p-row">
                      <span>
                        <b>{name}</b>
                        <small>{note}</small>
                      </span>
                      <input
                        type="checkbox"
                        className="p-switch"
                        checked={sources[key]}
                        onChange={(e) => setSources((s) => ({ ...s, [key]: e.target.checked }))}
                      />
                    </label>
                  ))}
                </Card>

                <div className="p-section-head">
                  <h3>Coaching</h3>
                </div>
                <Card className="p-list">
                  {[
                    { icon: <BellRing size={16} />, name: "Morning check-in", value: "07:00" },
                    { icon: <Video size={16} />, name: "Ben's voice and video", value: "On" },
                    { icon: <Target size={16} />, name: "Weekly goal review", value: "Sun" },
                  ].map((row) => (
                    <div key={row.name} className="p-row">
                      <span className="p-row-icon">{row.icon}</span>
                      <span>
                        <b>{row.name}</b>
                      </span>
                      <small className="p-dim">
                        {row.value} <ChevronRight size={14} />
                      </small>
                    </div>
                  ))}
                </Card>
              </div>
            </div>

            <nav className="p-tabbar" aria-label="App sections">
              {tabs.map((t) => (
                <button
                  key={t.id}
                  type="button"
                  className={t.id === "coach" ? "p-tab p-tab-ben" : "p-tab"}
                  aria-current={tab === t.id ? "page" : undefined}
                  onClick={() => setTab(t.id)}
                >
                  <span className="p-tab-icon">{t.icon}</span>
                  <span className="p-tab-label">{t.label}</span>
                </button>
              ))}
            </nav>
            <span className="p-home" aria-hidden="true" />
          </div>
        </div>
      </div>

      {/* ---------- right: widgets and notifications (wide desktop only) ---------- */}
      <aside className="p-widgets" aria-label="Pulse on your lock screen">
        <div className="p-notif">
          <Logo size={26} />
          <div>
            <span>
              <b>Pulse · Ben</b>
              <small>now</small>
            </span>
            <p>HRV is back up 6%. Zone 2 run before 8:00? Tap to talk it through.</p>
          </div>
        </div>
        <div className="p-notif p-notif-2">
          <Logo size={26} />
          <div>
            <span>
              <b>Pulse · Ben</b>
              <small>22:30</small>
            </span>
            <p>Wind-down time. Screens off in 15 min for +18 min deep sleep.</p>
          </div>
        </div>
        <div className="p-widget">
          <div className="p-widget-ring">
            <Ring value={82} size={92} id="p-ring-widget" stroke={9} />
            <b>82</b>
          </div>
          <div>
            <small className="p-mono p-dim">READINESS</small>
            <b>Primed</b>
            <span className="p-delta p-up">+6 vs avg</span>
          </div>
        </div>
        <div className="p-wear">
          <img src="/img/watch.jpg" alt="A woman checking health data on her smartwatch" />
          <div className="p-wear-body">
            <span className="p-wear-tag">
              <Watch size={13} /> Wearables
            </span>
            <b>Your watch talks to Ben.</b>
            <div className="p-wear-data">
              <span>
                <HeartPulse size={12} /> 54 bpm
              </span>
              <span>
                <Activity size={12} /> HRV 64
              </span>
              <span>
                <Moon size={12} /> 6:48 h
              </span>
            </div>
          </div>
        </div>
      </aside>
    </div>
  );
}
