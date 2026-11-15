// Tavus deployment that powers Ben. Created in the PAL Maker (https://maker.tavus.io)
// on the "embed" channel. The id is public by design; it is not a secret.
export const DEPLOYMENT_ID = "260adc67-3381-4ac8-9ae7-1743329e3e24";

export type ThemeId =
  | "serene"
  | "pulse"
  | "aurevita"
  | "noir"
  | "aurora"
  | "heritage"
  | "buddies"
  | "maison";

/** Who Ben is. Sent as conversational_context when a conversation is created. */
const BEN_CORE =
  "You are Ben, a warm, evidence-based AI health coach. You speak face to face with the member in a live video call. " +
  "Keep replies short and conversational (two or three sentences), ask one question at a time, reflect feelings before giving advice, " +
  "and turn advice into one small, concrete next step. You coach on sleep, nutrition, movement, stress and habits. " +
  "You are not a doctor: you do not diagnose or prescribe, and for chest pain, thoughts of self-harm or other urgent symptoms you calmly advise contacting emergency services or a clinician.";

interface ThemeTavus {
  context: string;
  greeting: string;
  mode: "light" | "dark";
  accent: string;
  preview: { title: string; description: string; btn_title: string };
  afterCall: { title: string; description: string };
}

const THEME_TAVUS: Record<ThemeId, ThemeTavus> = {
  serene: {
    context: "The member opened Ben from the calm wellness home page. Tone: gentle, reassuring, unhurried.",
    greeting: "Hi, I'm Ben, your health coach. Take a breath, there's no rush. What's on your mind today?",
    mode: "light",
    accent: "#23402F",
    preview: { title: "Talk to Ben", description: "A calm, face-to-face check-in with your health coach.", btn_title: "Start a session" },
    afterCall: { title: "Thanks for checking in", description: "Ben will be here whenever you need him." },
  },
  pulse: {
    context:
      "The member opened Ben from their performance dashboard. Today's data: readiness 82, HRV 64 ms (down 9% vs 7-day average), " +
      "sleep 6 h 48 min with 1 h 32 min deep sleep, resting heart rate 54 bpm, 7,412 steps of a 10,000 goal. " +
      "Tone: crisp, data-literate, motivating; reference the numbers when relevant.",
    greeting: "Hey, Ben here. I've looked at today's numbers. Want to start with your recovery or plan tomorrow?",
    mode: "dark",
    accent: "#D4FF3A",
    preview: { title: "Ben · Live coaching", description: "Review today's recovery and plan your next session.", btn_title: "Go live" },
    afterCall: { title: "Session logged", description: "Insights saved to your dashboard." },
  },
  aurevita: {
    context:
      "The member is taking a virtual 3D tour of the Aurevita longevity clinic: reception lounge, consultation suite, diagnostics lab, " +
      "recovery spa and longevity garden. You are their host and coach. When they mention a room, describe what happens there in plain words " +
      "and how it supports a longer, healthier life. Tone: refined, warm, quietly confident.",
    greeting: "Welcome to Aurevita. I'm Ben, your longevity coach. Shall I show you around, or is there something on your mind first?",
    mode: "light",
    accent: "#A07A4E",
    preview: { title: "Your host, Ben", description: "Tour the clinic with your longevity coach.", btn_title: "Begin with Ben" },
    afterCall: { title: "Thank you for visiting", description: "Your longevity plan begins with one small step." },
  },
  noir: {
    context: "The member opened Ben from an exclusive members-only concierge health experience. Tone: discreet, elegant, unhurried, precise.",
    greeting: "Good evening. I'm Ben, your private health concierge. What would you like to attend to today?",
    mode: "dark",
    accent: "#C9A96E",
    preview: { title: "Private consultation", description: "Your concierge coach, by appointment of one.", btn_title: "Enter" },
    afterCall: { title: "Until next time", description: "Your concierge notes have been kept in confidence." },
  },
  aurora: {
    context: "The member opened Ben from a vibrant, modern wellness app. Tone: bright, optimistic, energising, modern.",
    greeting: "Hey! I'm Ben. Let's make today feel a little lighter. What would you like to work on?",
    mode: "dark",
    accent: "#7C5CFF",
    preview: { title: "Meet Ben", description: "Your always-on coach for body and mind.", btn_title: "Start talking" },
    afterCall: { title: "Glow on", description: "Little steps, every day." },
  },
  heritage: {
    context:
      "The member opened Ben from a classic, traditional health house with an old apothecary feel. Tone: courteous, wise, time-honoured, gently formal.",
    greeting: "Good day, and welcome. I'm Ben, your health coach. How may I be of service to your wellbeing today?",
    mode: "light",
    accent: "#6B2E2A",
    preview: { title: "An audience with Ben", description: "Time-honoured wisdom, a modern conversation.", btn_title: "Begin" },
    afterCall: { title: "With our compliments", description: "May your health be your finest heirloom." },
  },
  buddies: {
    context:
      "The member is a child (about 6 to 11 years old), maybe with a parent nearby, using a comic-book health app for kids. " +
      "Speak simply and playfully, like a friendly superhero sidekick. Use short sentences, celebrate effort, and teach healthy habits " +
      "(drinking water, fruit and veggies, brushing teeth, sleep, moving and playing, feelings). Never give medical advice to a child; " +
      "if something sounds serious, kindly ask them to tell a grown-up.",
    greeting: "Hey there, hero! I'm Ben! Ready for a super healthy adventure today?",
    mode: "light",
    accent: "#E8322B",
    preview: { title: "Hi, hero!", description: "Ben is ready for a super healthy adventure!", btn_title: "Let's go!" },
    afterCall: { title: "Super job, hero!", description: "You earned a power-up star!" },
  },
  maison: {
    context: "The member opened Ben from a luxury wellness resort and spa. Tone: gracious, serene, attentive, five-star hospitality.",
    greeting: "Welcome to the Maison. I'm Ben, your wellness host. How would you like to feel by the end of your stay?",
    mode: "light",
    accent: "#2F4A3A",
    preview: { title: "Your wellness host", description: "A private conversation with Ben.", btn_title: "Reserve a moment" },
    afterCall: { title: "Merci", description: "We look forward to welcoming you again." },
  },
};

export function conversationalContext(theme: ThemeId): string {
  return `${BEN_CORE} ${THEME_TAVUS[theme].context}`;
}

export function customGreeting(theme: ThemeId): string {
  return THEME_TAVUS[theme].greeting;
}

/** Page-level overrides deep-merged over the deployment's saved customization. */
export function overrideConfig(theme: ThemeId): string {
  const t = THEME_TAVUS[theme];
  return JSON.stringify({
    customization: {
      show_haircheck: false,
      style: { mode: t.mode },
      preview: t.preview,
      after_call: { title: t.afterCall.title, description: t.afterCall.description },
      magic_canvas: { accent_color: t.accent },
    },
  });
}
