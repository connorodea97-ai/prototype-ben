import type { ThemeId } from "../ben/config.ts";

export interface ThemeMeta {
  id: ThemeId;
  name: string;
  tagline: string;
  swatch: string[];
}

export const THEMES: ThemeMeta[] = [
  { id: "serene", name: "Serene", tagline: "Calm clinical", swatch: ["#F4EFE6", "#A9BFA8", "#23402F"] },
  { id: "pulse", name: "Pulse", tagline: "Mobile app", swatch: ["#06080C", "#38E1FF", "#D4FF3A"] },
  { id: "aurevita", name: "Aurevita", tagline: "3D clinic tour", swatch: ["#F3EDE4", "#C9A27A", "#3A2E25"] },
  { id: "noir", name: "Noir", tagline: "Luxury motion", swatch: ["#0A0908", "#C9A96E", "#F2EDE4"] },
  { id: "aurora", name: "Aurora", tagline: "Vibrant glass", swatch: ["#7C5CFF", "#FF5CA8", "#22D3EE"] },
  { id: "heritage", name: "Heritage", tagline: "Traditional classic", swatch: ["#F1E7D3", "#6B2E2A", "#2E3B2F"] },
  { id: "buddies", name: "Ben & Buddies", tagline: "Comic for kids", swatch: ["#FFE14D", "#E8322B", "#1E6FE8"] },
  { id: "maison", name: "Maison", tagline: "Resort luxury", swatch: ["#EFE8DC", "#2F4A3A", "#B8955A"] },
];
