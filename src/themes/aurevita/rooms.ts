export interface Room {
  name: string;
  kicker: string;
  title: string;
  copy: string;
  ask: string;
}

export const ROOMS: Room[] = [
  {
    name: "Reception",
    kicker: "Arrive & breathe",
    title: "The Reception Lounge",
    copy: "Warm oak, soft light and a longevity concierge who already knows your goals. No clipboards, no waiting room.",
    ask: "I've just arrived at the reception. What will my first visit to Aurevita look like?",
  },
  {
    name: "Consultation",
    kicker: "Meet your coach",
    title: "The Consultation Suite",
    copy: "Sit down with Ben and your physician to turn your biomarkers into a living plan, measured by biological age, not birthdays.",
    ask: "We're in the consultation suite. How do you and my physician build my longevity plan?",
  },
  {
    name: "Diagnostics",
    kicker: "Measure what matters",
    title: "The Diagnostics Lab",
    copy: "More than a hundred biomarkers, a body-composition scan and VO₂ max testing, all in a single calm morning.",
    ask: "I'm looking at the diagnostics lab. Which tests matter most for living longer, and why?",
  },
  {
    name: "Recovery",
    kicker: "Restore deeply",
    title: "The Recovery Spa",
    copy: "Contrast therapy, a cedar sauna and a cold plunge, tuned to your recovery data rather than guesswork.",
    ask: "We're in the recovery spa. How should I use sauna and cold plunge for my health?",
  },
  {
    name: "Garden",
    kicker: "Live it daily",
    title: "The Longevity Garden",
    copy: "A light-filled kitchen and living wall, where nutrition, movement and community become everyday habits.",
    ask: "Now I'm in the longevity garden. What daily habits make the biggest difference to healthspan?",
  },
];

export const HOTSPOT_COPY: Record<string, { title: string; copy: string; ask: string }> = {
  concierge: {
    title: "Longevity concierge",
    copy: "Your single point of contact for bookings, results and follow-ups.",
    ask: "What does the longevity concierge do for members?",
  },
  lounge: {
    title: "The lounge",
    copy: "Herbal infusions and a quiet moment before your first session.",
    ask: "Can you suggest a calming ritual before my appointments?",
  },
  plan: {
    title: "Your living plan",
    copy: "Biological age, sleep, VO₂ max and ApoB tracked in one view.",
    ask: "What is biological age and how can I lower mine?",
  },
  coach: {
    title: "Coaching with Ben",
    copy: "Daily face-to-face check-ins between clinic visits.",
    ask: "How would you coach me between my clinic visits?",
  },
  scan: {
    title: "Body composition scan",
    copy: "Muscle, bone density and visceral fat in under ten minutes.",
    ask: "Why does muscle mass matter so much for longevity?",
  },
  bloods: {
    title: "Advanced blood panel",
    copy: "Metabolic, cardiovascular, hormonal and inflammation markers.",
    ask: "Which blood markers should I track every year?",
  },
  plunge: {
    title: "Cold plunge",
    copy: "Ten to twelve degrees, two minutes, guided breathing.",
    ask: "Is cold plunging safe for me, and how do I start?",
  },
  sauna: {
    title: "Cedar sauna",
    copy: "Heat exposure linked to better cardiovascular health.",
    ask: "How often should I use a sauna for heart health?",
  },
  kitchen: {
    title: "Nutrition island",
    copy: "Cooking classes built around protein, fibre and colour.",
    ask: "What does a longevity-friendly plate look like?",
  },
  garden: {
    title: "Living wall",
    copy: "Daylight, plants and quiet: designed to lower stress.",
    ask: "How does nature help with stress and ageing?",
  },
};
